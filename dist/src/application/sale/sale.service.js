"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SaleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const product_service_1 = require("../product/product.service");
const printer_service_1 = require("../printer/printer.service");
const fiscal_service_1 = require("../fiscal/fiscal.service");
const email_service_1 = require("../../shared/services/email.service");
const payment_method_dto_1 = require("./dto/payment-method.dto");
let SaleService = SaleService_1 = class SaleService {
    constructor(prisma, productService, printerService, fiscalService, emailService) {
        this.prisma = prisma;
        this.productService = productService;
        this.printerService = printerService;
        this.fiscalService = fiscalService;
        this.emailService = emailService;
        this.logger = new common_1.Logger(SaleService_1.name);
    }
    async create(companyId, sellerId, createSaleDto) {
        try {
            let total = 0;
            const validatedItems = [];
            for (const item of createSaleDto.items) {
                const product = await this.prisma.product.findFirst({
                    where: {
                        id: item.productId,
                        companyId,
                    },
                });
                if (!product) {
                    throw new common_1.NotFoundException(`Produto ${item.productId} não encontrado`);
                }
                if (product.stockQuantity < item.quantity) {
                    throw new common_1.BadRequestException(`Estoque insuficiente para o produto ${product.name}`);
                }
                const itemTotal = product.price.toNumber() * item.quantity;
                total += itemTotal;
                validatedItems.push({
                    productId: product.id,
                    quantity: item.quantity,
                    unitPrice: product.price,
                    totalPrice: itemTotal,
                });
            }
            const validPaymentMethods = Object.values(payment_method_dto_1.PaymentMethod);
            let totalPaid = 0;
            for (const paymentMethod of createSaleDto.paymentMethods) {
                if (!validPaymentMethods.includes(paymentMethod.method)) {
                    throw new common_1.BadRequestException(`Método de pagamento inválido: ${paymentMethod.method}`);
                }
                if (paymentMethod.amount <= 0) {
                    throw new common_1.BadRequestException(`Valor inválido para o método ${paymentMethod.method}: ${paymentMethod.amount}`);
                }
                totalPaid += paymentMethod.amount;
            }
            const hasInstallment = createSaleDto.paymentMethods.some(pm => pm.method === payment_method_dto_1.PaymentMethod.INSTALLMENT);
            if (hasInstallment && !createSaleDto.clientName) {
                throw new common_1.BadRequestException('Nome do cliente é obrigatório para vendas a prazo');
            }
            if (Math.abs(totalPaid - total) > 0.01) {
                throw new common_1.BadRequestException(`Total pago (${totalPaid}) não confere com o total da venda (${total})`);
            }
            const cashPayment = createSaleDto.paymentMethods.find(pm => pm.method === payment_method_dto_1.PaymentMethod.CASH);
            const cashAmount = cashPayment ? cashPayment.amount : 0;
            const change = totalPaid > total ? totalPaid - total : 0;
            const result = await this.prisma.$transaction(async (tx) => {
                const sale = await tx.sale.create({
                    data: {
                        total,
                        clientCpfCnpj: createSaleDto.clientCpfCnpj,
                        clientName: createSaleDto.clientName,
                        change,
                        isInstallment: hasInstallment,
                        companyId,
                        sellerId,
                    },
                });
                for (const paymentMethod of createSaleDto.paymentMethods) {
                    await tx.salePaymentMethod.create({
                        data: {
                            saleId: sale.id,
                            method: paymentMethod.method,
                            amount: paymentMethod.amount,
                            additionalInfo: paymentMethod.additionalInfo,
                        },
                    });
                }
                for (const item of validatedItems) {
                    await tx.saleItem.create({
                        data: {
                            ...item,
                            saleId: sale.id,
                        },
                    });
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stockQuantity: {
                                decrement: item.quantity,
                            },
                        },
                    });
                }
                return sale;
            });
            const completeSale = await this.prisma.sale.findUnique({
                where: { id: result.id },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    barcode: true,
                                    price: true,
                                },
                            },
                        },
                    },
                    seller: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    paymentMethods: true,
                    company: {
                        select: {
                            id: true,
                            name: true,
                            cnpj: true,
                            street: true,
                            number: true,
                            district: true,
                            phone: true,
                            email: true,
                            customFooter: true,
                        },
                    },
                },
            });
            try {
                const nfceData = {
                    companyId,
                    clientCpfCnpj: createSaleDto.clientCpfCnpj,
                    clientName: createSaleDto.clientName,
                    items: completeSale.items.map(item => ({
                        productId: item.product.id,
                        productName: item.product.name,
                        barcode: item.product.barcode,
                        quantity: item.quantity,
                        unitPrice: Number(item.unitPrice),
                        totalPrice: Number(item.totalPrice),
                    })),
                    totalValue: Number(completeSale.total),
                    paymentMethod: completeSale.paymentMethods.map(pm => pm.method),
                    saleId: completeSale.id,
                    sellerName: completeSale.seller.name,
                };
                const fiscalDocument = await this.fiscalService.generateNFCe(nfceData);
                const nfcePrintData = {
                    company: {
                        name: completeSale.company.name,
                        cnpj: completeSale.company.cnpj,
                        address: `${completeSale.company.street || ''}, ${completeSale.company.number || ''} - ${completeSale.company.district || ''}`,
                        phone: completeSale.company.phone,
                        email: completeSale.company.email,
                    },
                    fiscal: {
                        documentNumber: fiscalDocument.documentNumber,
                        accessKey: fiscalDocument.accessKey,
                        emissionDate: fiscalDocument.emissionDate,
                        status: fiscalDocument.status,
                    },
                    sale: {
                        id: completeSale.id,
                        total: Number(completeSale.total),
                        clientName: completeSale.clientName,
                        clientCpfCnpj: completeSale.clientCpfCnpj,
                        paymentMethod: completeSale.paymentMethods.map(pm => pm.method),
                        change: Number(completeSale.change),
                        saleDate: completeSale.saleDate,
                        sellerName: completeSale.seller.name,
                    },
                    items: completeSale.items.map(item => ({
                        productName: item.product.name,
                        barcode: item.product.barcode,
                        quantity: item.quantity,
                        unitPrice: Number(item.unitPrice),
                        totalPrice: Number(item.totalPrice),
                    })),
                    customFooter: completeSale.company.customFooter || 'OBRIGADO PELA PREFERÊNCIA!\nVOLTE SEMPRE!',
                };
                await this.printerService.printNFCe(nfcePrintData);
                this.logger.log(`NFCe printed successfully for sale: ${completeSale.id}`);
            }
            catch (fiscalError) {
                this.logger.warn('Failed to generate or print NFCe:', fiscalError);
            }
            if (createSaleDto.clientCpfCnpj) {
                try {
                    const customer = await this.prisma.customer.findFirst({
                        where: {
                            cpfCnpj: createSaleDto.clientCpfCnpj,
                            companyId,
                        },
                        include: {
                            company: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    });
                    if (customer && customer.email) {
                        await this.emailService.sendSaleConfirmationEmail(customer.email, customer.name, completeSale, customer.company.name);
                        this.logger.log(`Sale confirmation email sent to customer: ${customer.email}`);
                    }
                }
                catch (emailError) {
                    this.logger.error('Failed to send sale confirmation email:', emailError);
                }
            }
            this.logger.log(`Sale created: ${result.id} for company: ${companyId}`);
            return completeSale;
        }
        catch (error) {
            this.logger.error('Error creating sale:', error);
            throw error;
        }
    }
    async findAll(companyId, page = 1, limit = 10, sellerId, startDate, endDate) {
        const where = {};
        if (companyId) {
            where.companyId = companyId;
        }
        if (sellerId) {
            where.sellerId = sellerId;
        }
        if (startDate || endDate) {
            where.saleDate = {};
            if (startDate) {
                where.saleDate.gte = new Date(startDate);
            }
            if (endDate) {
                where.saleDate.lte = new Date(endDate);
            }
        }
        const [sales, total] = await Promise.all([
            this.prisma.sale.findMany({
                where,
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    barcode: true,
                                },
                            },
                        },
                    },
                    paymentMethods: true,
                    seller: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    saleDate: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.sale.count({ where }),
        ]);
        return {
            sales,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id, companyId) {
        const where = { id };
        if (companyId) {
            where.companyId = companyId;
        }
        const sale = await this.prisma.sale.findUnique({
            where,
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                barcode: true,
                                price: true,
                            },
                        },
                    },
                },
                paymentMethods: true,
                seller: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                company: {
                    select: {
                        id: true,
                        name: true,
                        cnpj: true,
                    },
                },
                exchanges: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                barcode: true,
                            },
                        },
                    },
                },
            },
        });
        if (!sale) {
            throw new common_1.NotFoundException('Venda não encontrada');
        }
        return sale;
    }
    async update(id, updateSaleDto, companyId) {
        try {
            const where = { id };
            if (companyId) {
                where.companyId = companyId;
            }
            const existingSale = await this.prisma.sale.findUnique({
                where,
            });
            if (!existingSale) {
                throw new common_1.NotFoundException('Venda não encontrada');
            }
            const hoursSinceSale = (Date.now() - existingSale.saleDate.getTime()) / (1000 * 60 * 60);
            if (hoursSinceSale > 24) {
                throw new common_1.BadRequestException('Não é possível editar vendas com mais de 24 horas');
            }
            const { sellerId, items, paymentMethods, ...updateData } = updateSaleDto;
            const sale = await this.prisma.sale.update({
                where: { id },
                data: updateData,
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    barcode: true,
                                    price: true,
                                },
                            },
                        },
                    },
                    seller: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            this.logger.log(`Sale updated: ${sale.id}`);
            return sale;
        }
        catch (error) {
            this.logger.error('Error updating sale:', error);
            throw error;
        }
    }
    async remove(id, companyId) {
        try {
            const where = { id };
            if (companyId) {
                where.companyId = companyId;
            }
            const existingSale = await this.prisma.sale.findUnique({
                where,
                include: {
                    items: true,
                },
            });
            if (!existingSale) {
                throw new common_1.NotFoundException('Venda não encontrada');
            }
            const hoursSinceSale = (Date.now() - existingSale.saleDate.getTime()) / (1000 * 60 * 60);
            if (hoursSinceSale > 24) {
                throw new common_1.BadRequestException('Não é possível excluir vendas com mais de 24 horas');
            }
            await this.prisma.$transaction(async (tx) => {
                for (const item of existingSale.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stockQuantity: {
                                increment: item.quantity,
                            },
                        },
                    });
                }
                await tx.sale.delete({
                    where: { id },
                });
            });
            this.logger.log(`Sale deleted: ${id}`);
            return { message: 'Venda removida com sucesso' };
        }
        catch (error) {
            this.logger.error('Error deleting sale:', error);
            throw error;
        }
    }
    async processExchange(companyId, processExchangeDto) {
        try {
            const { originalSaleId, productId, quantity, reason } = processExchangeDto;
            const originalSale = await this.prisma.sale.findFirst({
                where: {
                    id: originalSaleId,
                    companyId,
                },
                include: {
                    items: {
                        where: { productId },
                    },
                },
            });
            if (!originalSale) {
                throw new common_1.NotFoundException('Venda original não encontrada');
            }
            const saleItem = originalSale.items[0];
            if (!saleItem) {
                throw new common_1.NotFoundException('Produto não encontrado na venda original');
            }
            if (quantity > saleItem.quantity) {
                throw new common_1.BadRequestException('Quantidade de troca não pode ser maior que a quantidade original');
            }
            const product = await this.prisma.product.findFirst({
                where: {
                    id: productId,
                    companyId,
                },
            });
            if (!product) {
                throw new common_1.NotFoundException('Produto não encontrado');
            }
            const result = await this.prisma.$transaction(async (tx) => {
                const exchange = await tx.productExchange.create({
                    data: {
                        originalSaleId,
                        productId,
                        originalQuantity: saleItem.quantity,
                        exchangedQuantity: quantity,
                        reason,
                    },
                });
                await tx.product.update({
                    where: { id: productId },
                    data: {
                        stockQuantity: {
                            increment: quantity,
                        },
                    },
                });
                return exchange;
            });
            this.logger.log(`Exchange processed: ${result.id} for sale: ${originalSaleId}`);
            return result;
        }
        catch (error) {
            this.logger.error('Error processing exchange:', error);
            throw error;
        }
    }
    async getSalesStats(companyId, sellerId, startDate, endDate) {
        const where = {};
        if (companyId) {
            where.companyId = companyId;
        }
        if (sellerId) {
            where.sellerId = sellerId;
        }
        if (startDate || endDate) {
            where.saleDate = {};
            if (startDate) {
                where.saleDate.gte = new Date(startDate);
            }
            if (endDate) {
                where.saleDate.lte = new Date(endDate);
            }
        }
        const [totalSales, totalValue, averageTicket, salesByPaymentMethod] = await Promise.all([
            this.prisma.sale.count({ where }),
            this.prisma.sale.aggregate({
                where,
                _sum: { total: true },
            }),
            this.prisma.sale.aggregate({
                where,
                _avg: { total: true },
            }),
            this.prisma.salePaymentMethod.groupBy({
                by: ['method'],
                where: {
                    sale: where,
                },
                _count: { id: true },
                _sum: { amount: true },
            }),
        ]);
        const paymentMethodsSummary = salesByPaymentMethod.reduce((acc, item) => {
            acc[item.method] = {
                count: item._count.id,
                total: item._sum.amount || 0,
            };
            return acc;
        }, {});
        return {
            totalSales,
            totalValue: totalValue._sum.total || 0,
            averageTicket: averageTicket._avg.total || 0,
            salesByPaymentMethod: paymentMethodsSummary,
        };
    }
    async reprintReceipt(id, companyId) {
        const sale = await this.findOne(id, companyId);
        try {
            return { message: 'Cupom reimpresso com sucesso' };
        }
        catch (error) {
            this.logger.error('Error reprinting receipt:', error);
            throw new common_1.BadRequestException('Erro ao reimprimir cupom');
        }
    }
};
exports.SaleService = SaleService;
exports.SaleService = SaleService = SaleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        product_service_1.ProductService,
        printer_service_1.PrinterService,
        fiscal_service_1.FiscalService,
        email_service_1.EmailService])
], SaleService);
//# sourceMappingURL=sale.service.js.map
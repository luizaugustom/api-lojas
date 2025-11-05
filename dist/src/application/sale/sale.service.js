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
const ibpt_service_1 = require("../../shared/services/ibpt.service");
const payment_method_dto_1 = require("./dto/payment-method.dto");
let SaleService = SaleService_1 = class SaleService {
    constructor(prisma, productService, printerService, fiscalService, emailService, ibptService) {
        this.prisma = prisma;
        this.productService = productService;
        this.printerService = printerService;
        this.fiscalService = fiscalService;
        this.emailService = emailService;
        this.ibptService = ibptService;
        this.logger = new common_1.Logger(SaleService_1.name);
    }
    async create(companyId, sellerId, createSaleDto, computerId) {
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
            const installmentPayment = createSaleDto.paymentMethods.find(pm => pm.method === payment_method_dto_1.PaymentMethod.INSTALLMENT);
            const hasInstallment = !!installmentPayment;
            if (hasInstallment) {
                if (!createSaleDto.clientName) {
                    throw new common_1.BadRequestException('Nome do cliente é obrigatório para vendas a prazo');
                }
                if (!installmentPayment.customerId) {
                    throw new common_1.BadRequestException('ID do cliente é obrigatório para vendas a prazo');
                }
                if (!installmentPayment.installments || installmentPayment.installments < 1) {
                    throw new common_1.BadRequestException('Número de parcelas é obrigatório e deve ser maior que 0');
                }
                if (!installmentPayment.firstDueDate) {
                    throw new common_1.BadRequestException('Data do primeiro vencimento é obrigatória para vendas a prazo');
                }
                const customer = await this.prisma.customer.findFirst({
                    where: {
                        id: installmentPayment.customerId,
                        companyId,
                    },
                });
                if (!customer) {
                    throw new common_1.NotFoundException('Cliente não encontrado');
                }
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
                if (installmentPayment) {
                    const installmentAmount = installmentPayment.amount / installmentPayment.installments;
                    let firstDueDate;
                    try {
                        firstDueDate = new Date(installmentPayment.firstDueDate);
                        if (isNaN(firstDueDate.getTime())) {
                            throw new Error('Data inválida');
                        }
                    }
                    catch (error) {
                        this.logger.warn(`Data de vencimento inválida para venda ${sale.id}, usando data padrão`);
                        firstDueDate = new Date();
                        firstDueDate.setMonth(firstDueDate.getMonth() + 1);
                    }
                    for (let i = 0; i < installmentPayment.installments; i++) {
                        const dueDate = new Date(firstDueDate);
                        dueDate.setMonth(dueDate.getMonth() + i);
                        await tx.installment.create({
                            data: {
                                installmentNumber: i + 1,
                                totalInstallments: installmentPayment.installments,
                                amount: installmentAmount,
                                remainingAmount: installmentAmount,
                                dueDate,
                                description: installmentPayment.description || `Parcela ${i + 1}/${installmentPayment.installments} da venda`,
                                saleId: sale.id,
                                customerId: installmentPayment.customerId,
                                companyId,
                            },
                        });
                    }
                    this.logger.log(`Created ${installmentPayment.installments} installments for sale ${sale.id}`);
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
                                    ncm: true,
                                    cfop: true,
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
                            stateRegistration: true,
                            street: true,
                            number: true,
                            district: true,
                            phone: true,
                            email: true,
                            state: true,
                            customFooter: true,
                        },
                    },
                },
            });
            if (!createSaleDto.skipPrint) {
                try {
                    const hasValidFiscalConfig = await this.fiscalService.hasValidFiscalConfig(companyId);
                    if (!hasValidFiscalConfig) {
                        this.logger.warn(`⚠️ Empresa ${companyId} não tem configuração fiscal válida. Emitindo cupom não fiscal.`);
                        const receiptData = {
                            company: {
                                name: completeSale.company.name,
                                cnpj: completeSale.company.cnpj || '',
                                address: `${completeSale.company.street || ''}, ${completeSale.company.number || ''} - ${completeSale.company.district || ''}`,
                            },
                            sale: {
                                id: completeSale.id,
                                date: completeSale.saleDate,
                                total: Number(completeSale.total),
                                paymentMethods: completeSale.paymentMethods.map(pm => pm.method),
                                change: Number(completeSale.change),
                            },
                            items: completeSale.items.map(item => ({
                                name: item.product.name,
                                quantity: item.quantity,
                                unitPrice: Number(item.unitPrice),
                                totalPrice: Number(item.totalPrice),
                            })),
                            seller: {
                                name: completeSale.seller.name,
                            },
                            client: completeSale.clientName || completeSale.clientCpfCnpj ? {
                                name: completeSale.clientName || undefined,
                                cpfCnpj: completeSale.clientCpfCnpj || undefined,
                            } : undefined,
                        };
                        let printContent = null;
                        try {
                            printContent = await this.printerService.getNonFiscalReceiptContent(receiptData, true);
                        }
                        catch (generateError) {
                            this.logger.warn('Erro ao gerar conteúdo de cupom não fiscal, continuando sem conteúdo:', generateError);
                        }
                        try {
                            const printResult = await this.printerService.printNonFiscalReceipt(receiptData, companyId, true, computerId);
                            if (!printResult.success) {
                                this.logger.warn(`⚠️ Falha na impressão do cupom não fiscal no servidor para venda: ${completeSale.id}`);
                                this.logger.warn(`Erro: ${printResult.error}`);
                            }
                            else {
                                this.logger.log(`✅ Cupom não fiscal impresso no servidor para venda: ${completeSale.id}`);
                            }
                        }
                        catch (printError) {
                            this.logger.warn('Erro ao imprimir cupom não fiscal no servidor (continuando):', printError);
                        }
                        if (printContent) {
                            completeSale.printContent = printContent;
                            completeSale.printType = 'non-fiscal';
                        }
                        completeSale.warning = 'Cupom não fiscal emitido. Configure os dados fiscais para emitir NFCe válida.';
                    }
                    else {
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
                        const isMocked = fiscalDocument.status === 'MOCK' || fiscalDocument.isMock === true;
                        let totalTaxes = 0;
                        try {
                            const taxCalculations = await Promise.all(completeSale.items.map(item => this.ibptService.calculateProductTax(item.product.ncm || '99999999', Number(item.totalPrice), completeSale.company.state || 'SC')));
                            totalTaxes = taxCalculations.reduce((sum, calc) => sum + calc.taxValue, 0);
                            this.logger.log(`Tributos calculados via IBPT: R$ ${totalTaxes.toFixed(2)}`);
                        }
                        catch (error) {
                            this.logger.warn('Erro ao calcular tributos via IBPT, usando estimativa:', error);
                            totalTaxes = Number(completeSale.total) * 0.1665;
                        }
                        const nfcePrintData = {
                            company: {
                                name: completeSale.company.name,
                                cnpj: completeSale.company.cnpj,
                                inscricaoEstadual: completeSale.company.stateRegistration,
                                address: `${completeSale.company.street || ''}, ${completeSale.company.number || ''} - ${completeSale.company.district || ''}`,
                                phone: completeSale.company.phone,
                                email: completeSale.company.email,
                            },
                            fiscal: {
                                documentNumber: fiscalDocument.documentNumber,
                                accessKey: fiscalDocument.accessKey,
                                emissionDate: fiscalDocument.emissionDate,
                                status: fiscalDocument.status,
                                protocol: fiscalDocument.protocol || undefined,
                                qrCodeUrl: fiscalDocument.qrCodeUrl || undefined,
                                serieNumber: fiscalDocument.serieNumber || '1',
                                isMock: isMocked,
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
                                totalTaxes: totalTaxes,
                            },
                            items: completeSale.items.map(item => ({
                                productName: item.product.name,
                                barcode: item.product.barcode,
                                quantity: item.quantity,
                                unitPrice: Number(item.unitPrice),
                                totalPrice: Number(item.totalPrice),
                                ncm: item.product.ncm || '99999999',
                                cfop: item.product.cfop || '5102',
                            })),
                            customFooter: completeSale.company.customFooter,
                        };
                        let printContent = null;
                        try {
                            printContent = await this.printerService.generatePrintContent(nfcePrintData, companyId);
                        }
                        catch (generateError) {
                            this.logger.warn('Erro ao gerar conteúdo de impressão, continuando sem conteúdo:', generateError);
                        }
                        try {
                            const printResult = await this.printerService.printNFCe(nfcePrintData, companyId, computerId);
                            if (!printResult.success) {
                                this.logger.warn(`⚠️ Falha na impressão no servidor para venda: ${completeSale.id}`);
                                this.logger.warn(`Erro: ${printResult.error}`);
                            }
                            else {
                                this.logger.log(`✅ NFCe impressa no servidor para venda: ${completeSale.id}`);
                            }
                        }
                        catch (printError) {
                            this.logger.warn('Erro ao imprimir no servidor (continuando):', printError);
                        }
                        if (printContent) {
                            completeSale.printContent = printContent;
                            completeSale.printType = isMocked ? 'non-fiscal' : 'nfce';
                        }
                        if (isMocked) {
                            this.logger.warn(`⚠️ Cupom não fiscal gerado para venda: ${completeSale.id} (empresa sem configuração fiscal)`);
                            completeSale.warning = 'Cupom não fiscal emitido. Configure os dados fiscais para emitir NFCe válida.';
                        }
                        else {
                            this.logger.log(`✅ NFCe gerada com sucesso para venda: ${completeSale.id}`);
                        }
                    }
                }
                catch (fiscalError) {
                    if (fiscalError instanceof common_1.BadRequestException) {
                        throw fiscalError;
                    }
                    this.logger.warn('Failed to generate or print NFCe:', fiscalError);
                }
            }
            else {
                this.logger.log(`NFCe printing skipped for sale: ${completeSale.id} (skipPrint=true)`);
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
    async reprintReceipt(id, companyId, computerId) {
        const sale = await this.prisma.sale.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                paymentMethods: true,
                seller: true,
                company: true,
            },
        });
        if (!sale) {
            throw new common_1.BadRequestException('Venda não encontrada');
        }
        if (companyId && sale.companyId !== companyId) {
            throw new common_1.BadRequestException('Venda não pertence à empresa');
        }
        try {
            const fiscalDocument = await this.prisma.fiscalDocument.findFirst({
                where: {
                    companyId: sale.companyId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            const hasValidFiscalConfig = await this.fiscalService.hasValidFiscalConfig(sale.companyId);
            if (!fiscalDocument || !hasValidFiscalConfig) {
                if (!hasValidFiscalConfig) {
                    this.logger.warn(`⚠️ Empresa ${sale.companyId} não tem configuração fiscal válida. Emitindo cupom não fiscal para reimpressão.`);
                }
                else {
                    this.logger.warn(`No fiscal document found for sale ${id}, attempting to generate new NFCe`);
                }
                if (!hasValidFiscalConfig) {
                    const receiptData = {
                        company: {
                            name: sale.company.name,
                            cnpj: sale.company.cnpj || '',
                            address: `${sale.company.street || ''}, ${sale.company.number || ''} - ${sale.company.district || ''}`,
                        },
                        sale: {
                            id: sale.id,
                            date: sale.saleDate,
                            total: Number(sale.total),
                            paymentMethods: sale.paymentMethods.map(pm => pm.method),
                            change: Number(sale.change),
                        },
                        items: sale.items.map(item => ({
                            name: item.product.name,
                            quantity: item.quantity,
                            unitPrice: Number(item.unitPrice),
                            totalPrice: Number(item.totalPrice),
                        })),
                        seller: {
                            name: sale.seller.name,
                        },
                        client: sale.clientName || sale.clientCpfCnpj ? {
                            name: sale.clientName || undefined,
                            cpfCnpj: sale.clientCpfCnpj || undefined,
                        } : undefined,
                    };
                    let printContent = null;
                    try {
                        printContent = await this.printerService.getNonFiscalReceiptContent(receiptData, true);
                    }
                    catch (generateError) {
                        this.logger.warn('Erro ao gerar conteúdo de cupom não fiscal para reprint, continuando sem conteúdo:', generateError);
                    }
                    try {
                        const printResult = await this.printerService.printNonFiscalReceipt(receiptData, sale.companyId, true, computerId);
                        if (!printResult.success) {
                            this.logger.warn(`⚠️ Falha na reimpressão do cupom não fiscal no servidor para venda: ${sale.id}`);
                            this.logger.warn(`Erro: ${printResult.error}`);
                        }
                        else {
                            this.logger.log(`✅ Cupom não fiscal reimpresso no servidor para venda: ${sale.id}`);
                        }
                    }
                    catch (printError) {
                        this.logger.warn('Erro ao reimprimir cupom não fiscal no servidor (continuando):', printError);
                    }
                    this.logger.log(`✅ Conteúdo de cupom não fiscal gerado para reprint da venda: ${sale.id}`);
                    return {
                        message: 'Cupom não fiscal reimpresso com sucesso',
                        warning: 'Cupom não fiscal emitido. Configure os dados fiscais para emitir NFCe válida.',
                        printContent: printContent || undefined,
                        printType: 'non-fiscal',
                    };
                }
                const nfceData = {
                    companyId: sale.companyId,
                    clientCpfCnpj: sale.clientCpfCnpj,
                    clientName: sale.clientName,
                    items: sale.items.map(item => ({
                        productId: item.product.id,
                        productName: item.product.name,
                        barcode: item.product.barcode,
                        quantity: item.quantity,
                        unitPrice: Number(item.unitPrice),
                        totalPrice: Number(item.totalPrice),
                    })),
                    totalValue: Number(sale.total),
                    paymentMethod: sale.paymentMethods.map(pm => pm.method),
                    saleId: sale.id,
                    sellerName: sale.seller.name,
                };
                const newFiscalDocument = await this.fiscalService.generateNFCe(nfceData);
                const isMocked = newFiscalDocument.status === 'MOCK' || newFiscalDocument.isMock === true;
                const nfcePrintData = {
                    company: {
                        name: sale.company.name,
                        cnpj: sale.company.cnpj,
                        inscricaoEstadual: sale.company.stateRegistration,
                        address: `${sale.company.street || ''}, ${sale.company.number || ''} - ${sale.company.district || ''}`,
                        phone: sale.company.phone,
                        email: sale.company.email,
                    },
                    fiscal: {
                        documentNumber: newFiscalDocument.documentNumber,
                        accessKey: newFiscalDocument.accessKey,
                        emissionDate: newFiscalDocument.emissionDate || new Date(),
                        status: newFiscalDocument.status,
                        protocol: newFiscalDocument.protocol || undefined,
                        qrCodeUrl: newFiscalDocument.qrCodeUrl || undefined,
                        serieNumber: newFiscalDocument.serieNumber || '1',
                        isMock: isMocked,
                    },
                    sale: {
                        id: sale.id,
                        total: Number(sale.total),
                        clientName: sale.clientName,
                        clientCpfCnpj: sale.clientCpfCnpj,
                        paymentMethod: sale.paymentMethods.map(pm => pm.method),
                        change: Number(sale.change),
                        saleDate: sale.saleDate,
                        sellerName: sale.seller.name,
                        totalTaxes: Number(sale.total) * 0.1665,
                    },
                    items: sale.items.map(item => ({
                        productName: item.product.name,
                        barcode: item.product.barcode,
                        quantity: item.quantity,
                        unitPrice: Number(item.unitPrice),
                        totalPrice: Number(item.totalPrice),
                        ncm: item.product.ncm || '99999999',
                        cfop: item.product.cfop || '5102',
                    })),
                    customFooter: sale.company.customFooter,
                };
                const printResult = await this.printerService.printNFCe(nfcePrintData, sale.companyId, computerId);
                if (!printResult.success) {
                    const errorMessage = printResult.details?.reason || printResult.error || 'Erro ao reimprimir NFC-e';
                    this.logger.error(`Erro ao reimprimir NFC-e para venda ${sale.id}: ${errorMessage}`);
                    throw new common_1.BadRequestException(errorMessage);
                }
            }
            else {
                const isMocked = fiscalDocument.status === 'MOCK' || fiscalDocument.isMock === true;
                const nfcePrintData = {
                    company: {
                        name: sale.company.name,
                        cnpj: sale.company.cnpj,
                        inscricaoEstadual: sale.company.stateRegistration,
                        address: `${sale.company.street || ''}, ${sale.company.number || ''} - ${sale.company.district || ''}`,
                        phone: sale.company.phone,
                        email: sale.company.email,
                    },
                    fiscal: {
                        documentNumber: fiscalDocument.documentNumber,
                        accessKey: fiscalDocument.accessKey,
                        emissionDate: fiscalDocument.emissionDate || new Date(),
                        status: fiscalDocument.status,
                        protocol: fiscalDocument.protocol || undefined,
                        qrCodeUrl: fiscalDocument.qrCodeUrl || undefined,
                        serieNumber: fiscalDocument.serieNumber || '1',
                        isMock: isMocked,
                    },
                    sale: {
                        id: sale.id,
                        total: Number(sale.total),
                        clientName: sale.clientName,
                        clientCpfCnpj: sale.clientCpfCnpj,
                        paymentMethod: sale.paymentMethods.map(pm => pm.method),
                        change: Number(sale.change),
                        saleDate: sale.saleDate,
                        sellerName: sale.seller.name,
                        totalTaxes: Number(sale.total) * 0.1665,
                    },
                    items: sale.items.map(item => ({
                        productName: item.product.name,
                        barcode: item.product.barcode,
                        quantity: item.quantity,
                        unitPrice: Number(item.unitPrice),
                        totalPrice: Number(item.totalPrice),
                        ncm: item.product.ncm || '99999999',
                        cfop: item.product.cfop || '5102',
                    })),
                    customFooter: sale.company.customFooter,
                };
                let printContent = null;
                try {
                    printContent = await this.printerService.generatePrintContent(nfcePrintData, sale.companyId);
                }
                catch (generateError) {
                    this.logger.warn('Erro ao gerar conteúdo de impressão para reprint, continuando sem conteúdo:', generateError);
                }
                try {
                    const printResult = await this.printerService.printNFCe(nfcePrintData, sale.companyId, computerId);
                    if (!printResult.success) {
                        const errorMessage = printResult.details?.reason || printResult.error || 'Erro ao reimprimir NFC-e no servidor';
                        this.logger.warn(`Aviso ao reimprimir NFC-e no servidor para venda ${sale.id}: ${errorMessage}`);
                    }
                    else {
                        this.logger.log(`✅ NFCe reimpressa no servidor para venda: ${sale.id}`);
                    }
                }
                catch (printError) {
                    this.logger.warn('Erro ao reimprimir NFC-e no servidor (continuando):', printError);
                }
                this.logger.log(`✅ Conteúdo de impressão gerado para reprint da venda: ${sale.id}`);
                return {
                    message: 'NFC-e reimpresso com sucesso',
                    printContent: printContent || undefined,
                    printType: 'nfce',
                };
            }
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.error('Error reprinting NFCe:', error);
            throw new common_1.BadRequestException(`Erro ao reimprimir NFC-e: ${errorMessage}`);
        }
    }
    async getPrintContent(id, companyId) {
        const sale = await this.prisma.sale.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                paymentMethods: true,
                seller: true,
                company: true,
            },
        });
        if (!sale) {
            throw new common_1.BadRequestException('Venda não encontrada');
        }
        if (companyId && sale.companyId !== companyId) {
            throw new common_1.BadRequestException('Venda não pertence à empresa');
        }
        try {
            const fiscalDocument = await this.prisma.fiscalDocument.findFirst({
                where: {
                    companyId: sale.companyId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            const hasValidFiscalConfig = await this.fiscalService.hasValidFiscalConfig(sale.companyId);
            if (!fiscalDocument || !hasValidFiscalConfig) {
                const receiptData = {
                    company: {
                        name: sale.company.name,
                        cnpj: sale.company.cnpj || '',
                        address: `${sale.company.street || ''}, ${sale.company.number || ''} - ${sale.company.district || ''}`,
                    },
                    sale: {
                        id: sale.id,
                        date: sale.saleDate,
                        total: Number(sale.total),
                        paymentMethods: sale.paymentMethods.map(pm => pm.method),
                        change: Number(sale.change),
                    },
                    items: sale.items.map(item => ({
                        name: item.product.name,
                        quantity: item.quantity,
                        unitPrice: Number(item.unitPrice),
                        totalPrice: Number(item.totalPrice),
                    })),
                    seller: {
                        name: sale.seller.name,
                    },
                    client: sale.clientName || sale.clientCpfCnpj ? {
                        name: sale.clientName || undefined,
                        cpfCnpj: sale.clientCpfCnpj || undefined,
                    } : undefined,
                };
                const content = await this.printerService.getNFCeContent({
                    company: receiptData.company,
                    fiscal: { status: 'MOCK', documentNumber: '', accessKey: '', emissionDate: new Date(), isMock: true },
                    sale: {
                        id: receiptData.sale.id,
                        total: receiptData.sale.total,
                        clientName: receiptData.client?.name,
                        clientCpfCnpj: receiptData.client?.cpfCnpj,
                        paymentMethod: receiptData.sale.paymentMethods,
                        change: receiptData.sale.change,
                        saleDate: receiptData.sale.date,
                        sellerName: receiptData.seller.name,
                    },
                    items: receiptData.items.map((item) => ({
                        productName: item.name,
                        barcode: '',
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                    })),
                });
                return { content, isMock: true };
            }
            const isMocked = fiscalDocument.status === 'MOCK' || fiscalDocument.isMock === true;
            const nfcePrintData = {
                company: {
                    name: sale.company.name,
                    cnpj: sale.company.cnpj,
                    inscricaoEstadual: sale.company.stateRegistration,
                    address: `${sale.company.street || ''}, ${sale.company.number || ''} - ${sale.company.district || ''}`,
                    phone: sale.company.phone,
                    email: sale.company.email,
                },
                fiscal: {
                    documentNumber: fiscalDocument.documentNumber,
                    accessKey: fiscalDocument.accessKey,
                    emissionDate: fiscalDocument.emissionDate || new Date(),
                    status: fiscalDocument.status,
                    protocol: fiscalDocument.protocol || undefined,
                    qrCodeUrl: fiscalDocument.qrCodeUrl || undefined,
                    serieNumber: fiscalDocument.serieNumber || '1',
                    isMock: isMocked,
                },
                sale: {
                    id: sale.id,
                    total: Number(sale.total),
                    clientName: sale.clientName,
                    clientCpfCnpj: sale.clientCpfCnpj,
                    paymentMethod: sale.paymentMethods.map(pm => pm.method),
                    change: Number(sale.change),
                    saleDate: sale.saleDate,
                    sellerName: sale.seller.name,
                    totalTaxes: Number(sale.total) * 0.1665,
                },
                items: sale.items.map(item => ({
                    productName: item.product.name,
                    barcode: item.product.barcode,
                    quantity: item.quantity,
                    unitPrice: Number(item.unitPrice),
                    totalPrice: Number(item.totalPrice),
                    ncm: item.product.ncm || '99999999',
                    cfop: item.product.cfop || '5102',
                })),
                customFooter: sale.company.customFooter,
            };
            const content = await this.printerService.getNFCeContent(nfcePrintData);
            return { content, isMock: isMocked };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.error('Error generating print content:', error);
            throw new common_1.BadRequestException(`Erro ao gerar conteúdo de impressão: ${errorMessage}`);
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
        email_service_1.EmailService,
        ibpt_service_1.IBPTService])
], SaleService);
//# sourceMappingURL=sale.service.js.map
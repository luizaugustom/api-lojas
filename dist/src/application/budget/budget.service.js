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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BudgetService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const update_budget_dto_1 = require("./dto/update-budget.dto");
const printer_service_1 = require("../printer/printer.service");
const sale_service_1 = require("../sale/sale.service");
const payment_method_dto_1 = require("../sale/dto/payment-method.dto");
const PDFDocument = require("pdfkit");
const axios_1 = require("axios");
const fs = require("fs");
const path = require("path");
let BudgetService = BudgetService_1 = class BudgetService {
    constructor(prisma, printerService, saleService) {
        this.prisma = prisma;
        this.printerService = printerService;
        this.saleService = saleService;
        this.logger = new common_1.Logger(BudgetService_1.name);
    }
    async create(companyId, sellerId, createBudgetDto) {
        try {
            this.logger.log(`Creating budget for company: ${companyId}`);
            this.logger.log(`Items: ${JSON.stringify(createBudgetDto.items)}`);
            const productIds = createBudgetDto.items.map(item => item.productId);
            this.logger.log(`Product IDs: ${productIds.join(', ')}`);
            const products = await this.prisma.product.findMany({
                where: {
                    id: { in: productIds },
                    companyId,
                },
            });
            this.logger.log(`Found ${products.length} products out of ${productIds.length} requested`);
            if (products.length !== productIds.length) {
                const foundIds = products.map(p => p.id);
                const missingIds = productIds.filter(id => !foundIds.includes(id));
                this.logger.error(`Missing products: ${missingIds.join(', ')}`);
                throw new common_1.BadRequestException(`Um ou mais produtos não foram encontrados: ${missingIds.join(', ')}`);
            }
            let total = 0;
            const validatedItems = createBudgetDto.items.map(item => {
                const product = products.find(p => p.id === item.productId);
                if (!product) {
                    throw new common_1.BadRequestException(`Produto ${item.productId} não encontrado`);
                }
                const unitPrice = Number(product.price);
                const totalPrice = unitPrice * item.quantity;
                total += totalPrice;
                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice,
                    totalPrice,
                };
            });
            const lastBudget = await this.prisma.budget.findFirst({
                where: { companyId },
                orderBy: { budgetNumber: 'desc' },
            });
            const budgetNumber = (lastBudget?.budgetNumber || 0) + 1;
            const budget = await this.prisma.$transaction(async (tx) => {
                const newBudget = await tx.budget.create({
                    data: {
                        companyId,
                        sellerId: sellerId || null,
                        budgetNumber,
                        total,
                        clientName: createBudgetDto.clientName,
                        clientPhone: createBudgetDto.clientPhone,
                        clientEmail: createBudgetDto.clientEmail,
                        clientCpfCnpj: createBudgetDto.clientCpfCnpj,
                        notes: createBudgetDto.notes,
                        validUntil: new Date(createBudgetDto.validUntil),
                        status: 'pending',
                    },
                });
                for (const item of validatedItems) {
                    await tx.budgetItem.create({
                        data: {
                            ...item,
                            budgetId: newBudget.id,
                        },
                    });
                }
                return newBudget;
            });
            const completeBudget = await this.prisma.budget.findUnique({
                where: { id: budget.id },
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
                            logoUrl: true,
                        },
                    },
                },
            });
            this.logger.log(`Budget created successfully with ID: ${budget.id}`);
            return completeBudget;
        }
        catch (error) {
            this.logger.error(`Error creating budget: ${error.message}`, error.stack);
            throw error;
        }
    }
    async findAll(companyId, sellerId, status) {
        const where = { companyId };
        if (sellerId) {
            where.sellerId = sellerId;
        }
        if (status) {
            where.status = status;
        }
        const budgets = await this.prisma.budget.findMany({
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
                seller: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                budgetDate: 'desc',
            },
        });
        return budgets;
    }
    async findOne(id, companyId) {
        const where = { id };
        if (companyId) {
            where.companyId = companyId;
        }
        const budget = await this.prisma.budget.findUnique({
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
                        street: true,
                        number: true,
                        district: true,
                        city: true,
                        state: true,
                        phone: true,
                        email: true,
                        logoUrl: true,
                    },
                },
            },
        });
        if (!budget) {
            throw new common_1.NotFoundException('Orçamento não encontrado');
        }
        return budget;
    }
    async update(id, companyId, updateBudgetDto) {
        const budget = await this.findOne(id, companyId);
        const oldStatus = budget.status;
        if (updateBudgetDto.status === update_budget_dto_1.BudgetStatus.APPROVED && oldStatus !== update_budget_dto_1.BudgetStatus.APPROVED) {
            this.logger.log(`Budget ${id} status changed to approved, creating sale automatically`);
            if (!budget.sellerId) {
                throw new common_1.BadRequestException('Orçamento deve ter um vendedor associado para ser aprovado e gerar venda');
            }
            const existingSale = await this.prisma.sale.findFirst({
                where: {
                    companyId,
                    items: {
                        some: {
                            productId: budget.items[0]?.productId,
                        },
                    },
                    clientName: budget.clientName || undefined,
                    clientCpfCnpj: budget.clientCpfCnpj || undefined,
                    saleDate: {
                        gte: new Date(Date.now() - 5 * 60 * 1000),
                    },
                },
            });
            if (existingSale) {
                this.logger.warn(`Sale already exists for budget ${id}, skipping automatic creation`);
            }
            else {
                try {
                    const saleItems = budget.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: Number(item.unitPrice),
                        totalPrice: Number(item.totalPrice),
                    }));
                    const createSaleDto = {
                        items: saleItems.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                        })),
                        clientName: budget.clientName,
                        clientCpfCnpj: budget.clientCpfCnpj,
                        paymentMethods: [{
                                method: payment_method_dto_1.PaymentMethod.CASH,
                                amount: Number(budget.total),
                            }],
                        totalPaid: Number(budget.total),
                        skipPrint: true,
                    };
                    await this.saleService.create(companyId, budget.sellerId, createSaleDto);
                    this.logger.log(`Sale created automatically for budget ${id}`);
                }
                catch (error) {
                    this.logger.error(`Error creating sale for budget ${id}: ${error.message}`, error.stack);
                }
            }
        }
        const updatedBudget = await this.prisma.budget.update({
            where: { id },
            data: {
                status: updateBudgetDto.status,
                notes: updateBudgetDto.notes,
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                seller: true,
            },
        });
        this.logger.log(`Budget ${id} updated successfully`);
        return updatedBudget;
    }
    async remove(id, companyId) {
        const budget = await this.findOne(id, companyId);
        await this.prisma.budget.delete({
            where: { id },
        });
        this.logger.log(`Budget ${id} deleted successfully`);
        return { message: 'Orçamento excluído com sucesso' };
    }
    async printBudget(id, companyId) {
        const budget = await this.findOne(id, companyId);
        const printData = {
            company: {
                name: budget.company.name,
                cnpj: budget.company.cnpj,
                address: `${budget.company.street || ''}, ${budget.company.number || ''} - ${budget.company.district || ''}`,
                phone: budget.company.phone,
                email: budget.company.email,
                logoUrl: budget.company.logoUrl,
            },
            budget: {
                id: budget.id,
                budgetNumber: budget.budgetNumber,
                budgetDate: budget.budgetDate,
                validUntil: budget.validUntil,
                total: Number(budget.total),
                status: budget.status,
                notes: budget.notes,
            },
            client: budget.clientName ? {
                name: budget.clientName,
                phone: budget.clientPhone,
                email: budget.clientEmail,
                cpfCnpj: budget.clientCpfCnpj,
            } : undefined,
            items: budget.items.map(item => ({
                productName: item.product.name,
                barcode: item.product.barcode,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.totalPrice),
            })),
            seller: budget.seller ? {
                name: budget.seller.name,
            } : undefined,
        };
        await this.printerService.printBudget(printData);
        this.logger.log(`Budget ${id} printed successfully`);
        return { message: 'Orçamento enviado para impressão' };
    }
    async generatePdf(id, companyId) {
        const budget = await this.findOne(id, companyId);
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50,
                    bufferPages: true,
                });
                const buffers = [];
                doc.on('data', (buffer) => buffers.push(buffer));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    this.logger.log(`Budget ${id} PDF generated successfully`);
                    resolve(pdfBuffer);
                });
                doc.on('error', reject);
                await this.generatePdfContent(doc, budget);
                doc.end();
            }
            catch (error) {
                this.logger.error(`Error generating PDF: ${error.message}`, error.stack);
                reject(error);
            }
        });
    }
    async generatePdfContent(doc, budget) {
        const company = budget.company;
        const items = budget.items;
        const date = new Date(budget.budgetDate).toLocaleDateString('pt-BR');
        const validUntil = new Date(budget.validUntil).toLocaleDateString('pt-BR');
        let yPosition = doc.y;
        let hasLogo = false;
        if (company.logoUrl) {
            try {
                let logoBuffer = null;
                if (company.logoUrl.startsWith('http://') || company.logoUrl.startsWith('https://')) {
                    try {
                        const response = await axios_1.default.get(company.logoUrl, { responseType: 'arraybuffer', timeout: 5000 });
                        logoBuffer = Buffer.from(response.data);
                    }
                    catch (error) {
                        this.logger.warn(`Could not download logo from ${company.logoUrl}: ${error.message}`);
                    }
                }
                else {
                    try {
                        const filePath = path.join(process.cwd(), 'uploads', company.logoUrl);
                        if (fs.existsSync(filePath)) {
                            logoBuffer = fs.readFileSync(filePath);
                        }
                    }
                    catch (error) {
                        this.logger.warn(`Could not read local logo file: ${error.message}`);
                    }
                }
                if (logoBuffer) {
                    doc.image(logoBuffer, 470, yPosition, {
                        width: 70,
                        height: 70,
                        fit: [70, 70]
                    });
                    hasLogo = true;
                }
            }
            catch (error) {
                this.logger.error(`Error adding logo to PDF: ${error.message}`);
            }
        }
        doc
            .fontSize(20)
            .font('Helvetica-Bold')
            .fillColor('#2C3E50')
            .text('ORÇAMENTO', { align: 'center' });
        yPosition = doc.y + 10;
        if (!hasLogo) {
            yPosition -= 10;
        }
        doc
            .moveTo(50, yPosition)
            .lineTo(545, yPosition)
            .strokeColor('#34495E')
            .lineWidth(2)
            .stroke();
        yPosition += 20;
        doc.y = yPosition;
        doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#2C3E50')
            .text(company.name, 50, yPosition, { width: 495 });
        yPosition = doc.y + 5;
        doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#34495E')
            .text(`CNPJ: ${company.cnpj}`, 50, yPosition);
        yPosition = doc.y + 3;
        if (company.street || company.number || company.district) {
            doc.text(`${company.street || ''}, ${company.number || ''} - ${company.district || ''}`, 50, yPosition);
            yPosition = doc.y + 3;
        }
        if (company.city || company.state) {
            doc.text(`${company.city || ''} - ${company.state || ''}`, 50, yPosition);
            yPosition = doc.y + 3;
        }
        if (company.phone) {
            doc.text(`Tel: ${company.phone}`, 50, yPosition);
            yPosition = doc.y + 3;
        }
        if (company.email) {
            doc.text(`Email: ${company.email}`, 50, yPosition);
            yPosition = doc.y;
        }
        yPosition += 15;
        doc
            .moveTo(50, yPosition)
            .lineTo(545, yPosition)
            .strokeColor('#BDC3C7')
            .lineWidth(1)
            .stroke();
        yPosition += 20;
        doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#2C3E50')
            .text('INFORMAÇÕES DO ORÇAMENTO', 50, yPosition);
        yPosition = doc.y + 10;
        doc
            .rect(50, yPosition, 495, 45)
            .fillColor('#ECF0F1')
            .fill();
        yPosition += 10;
        doc
            .fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#2C3E50')
            .text(`Orçamento Nº:`, 60, yPosition, { width: 100, continued: true })
            .font('Helvetica')
            .text(`${budget.budgetNumber}`, { width: 150 });
        doc
            .font('Helvetica-Bold')
            .text(`Data:`, 260, yPosition, { width: 80, continued: true })
            .font('Helvetica')
            .text(date, { width: 150 });
        yPosition += 15;
        doc
            .font('Helvetica-Bold')
            .text(`Válido até:`, 60, yPosition, { width: 100, continued: true })
            .font('Helvetica')
            .text(validUntil, { width: 150 });
        doc
            .font('Helvetica-Bold')
            .text(`Status:`, 260, yPosition, { width: 80, continued: true })
            .font('Helvetica')
            .text(this.translateStatus(budget.status), { width: 150 });
        yPosition += 30;
        if (budget.clientName) {
            doc
                .fontSize(11)
                .font('Helvetica-Bold')
                .fillColor('#2C3E50')
                .text('DADOS DO CLIENTE', 50, yPosition);
            yPosition = doc.y + 10;
            let boxHeight = 30;
            if (budget.clientCpfCnpj || budget.clientPhone)
                boxHeight += 15;
            if (budget.clientEmail)
                boxHeight += 15;
            doc
                .rect(50, yPosition, 495, boxHeight)
                .fillColor('#ECF0F1')
                .fill();
            yPosition += 10;
            doc
                .fontSize(9)
                .font('Helvetica-Bold')
                .fillColor('#2C3E50')
                .text(`Nome:`, 60, yPosition, { width: 80 });
            doc
                .font('Helvetica')
                .fillColor('#2C3E50')
                .text(budget.clientName, 145, yPosition, { width: 400 });
            yPosition += 15;
            if (budget.clientCpfCnpj || budget.clientPhone) {
                if (budget.clientCpfCnpj) {
                    doc
                        .font('Helvetica-Bold')
                        .fillColor('#2C3E50')
                        .text(`CPF/CNPJ:`, 60, yPosition, { width: 80 });
                    doc
                        .font('Helvetica')
                        .fillColor('#2C3E50')
                        .text(budget.clientCpfCnpj, 145, yPosition, { width: 130 });
                }
                if (budget.clientPhone) {
                    doc
                        .font('Helvetica-Bold')
                        .fillColor('#2C3E50')
                        .text(`Telefone:`, 290, yPosition, { width: 80 });
                    doc
                        .font('Helvetica')
                        .fillColor('#2C3E50')
                        .text(budget.clientPhone, 365, yPosition, { width: 180 });
                }
                yPosition += 15;
            }
            if (budget.clientEmail) {
                doc
                    .font('Helvetica-Bold')
                    .fillColor('#2C3E50')
                    .text(`Email:`, 60, yPosition, { width: 80 });
                doc
                    .font('Helvetica')
                    .fillColor('#2C3E50')
                    .text(budget.clientEmail, 145, yPosition, { width: 400 });
                yPosition += 15;
            }
            yPosition += 10;
        }
        yPosition += 5;
        doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#2C3E50')
            .text('PRODUTOS', 50, yPosition);
        yPosition = doc.y + 10;
        doc
            .rect(50, yPosition, 495, 25)
            .fillColor('#34495E')
            .fill();
        yPosition += 8;
        doc
            .fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#FFFFFF')
            .text('Item', 60, yPosition, { width: 30 })
            .text('Produto', 95, yPosition, { width: 240 })
            .text('Qtd', 340, yPosition, { width: 40, align: 'center' })
            .text('Valor Unit.', 385, yPosition, { width: 70, align: 'right' })
            .text('Total', 460, yPosition, { width: 75, align: 'right' });
        yPosition += 17;
        items.forEach((item, index) => {
            if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
            }
            if (index % 2 === 0) {
                doc
                    .rect(50, yPosition, 495, 20)
                    .fillColor('#F8F9FA')
                    .fill();
            }
            yPosition += 6;
            doc
                .fontSize(8)
                .font('Helvetica')
                .fillColor('#2C3E50')
                .text(`${index + 1}`, 60, yPosition, { width: 30 })
                .text(item.product.name.substring(0, 50), 95, yPosition, { width: 240 })
                .text(`${item.quantity}`, 340, yPosition, { width: 40, align: 'center' })
                .text(`R$ ${Number(item.unitPrice).toFixed(2)}`, 385, yPosition, { width: 70, align: 'right' })
                .text(`R$ ${Number(item.totalPrice).toFixed(2)}`, 460, yPosition, { width: 75, align: 'right' });
            yPosition += 14;
        });
        doc
            .moveTo(50, yPosition)
            .lineTo(545, yPosition)
            .strokeColor('#BDC3C7')
            .lineWidth(1)
            .stroke();
        yPosition += 15;
        doc
            .rect(370, yPosition, 175, 35)
            .fillColor('#27AE60')
            .fill();
        yPosition += 10;
        doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#FFFFFF')
            .text('TOTAL:', 380, yPosition, { width: 80 })
            .text(`R$ ${Number(budget.total).toFixed(2)}`, 450, yPosition, { width: 85, align: 'right' });
        yPosition += 30;
        if (budget.notes) {
            yPosition += 10;
            doc
                .fontSize(11)
                .font('Helvetica-Bold')
                .fillColor('#2C3E50')
                .text('OBSERVAÇÕES', 50, yPosition);
            yPosition = doc.y + 10;
            doc
                .rect(50, yPosition, 495, 60)
                .fillColor('#FFF9E6')
                .fill();
            yPosition += 10;
            doc
                .fontSize(9)
                .font('Helvetica')
                .fillColor('#2C3E50')
                .text(budget.notes, 60, yPosition, { width: 475, align: 'left' });
            yPosition = doc.y + 10;
        }
        yPosition = 750;
        doc
            .moveTo(50, yPosition)
            .lineTo(545, yPosition)
            .strokeColor('#BDC3C7')
            .lineWidth(1)
            .stroke();
        yPosition += 10;
        doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#7F8C8D')
            .text(`Documento gerado em ${new Date().toLocaleString('pt-BR')}`, 50, yPosition, { align: 'center', width: 495 });
        if (budget.seller) {
            yPosition = doc.y + 5;
            doc.text(`Vendedor(a): ${budget.seller.name}`, 50, yPosition, { align: 'center', width: 495 });
        }
    }
    translateStatus(status) {
        const statusMap = {
            pending: 'Pendente',
            approved: 'Aprovado',
            rejected: 'Rejeitado',
            expired: 'Expirado',
        };
        return statusMap[status] || status;
    }
    async convertToSale(id, companyId, sellerId) {
        const budget = await this.findOne(id, companyId);
        if (budget.status !== 'pending' && budget.status !== 'approved') {
            throw new common_1.BadRequestException('Apenas orçamentos pendentes ou aprovados podem ser convertidos em vendas');
        }
        await this.prisma.budget.update({
            where: { id },
            data: { status: 'approved' },
        });
        this.logger.log(`Budget ${id} marked as approved for conversion to sale`);
        return {
            message: 'Orçamento aprovado. Use os dados para criar uma venda.',
            budgetData: {
                items: budget.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                })),
                clientName: budget.clientName,
                clientCpfCnpj: budget.clientCpfCnpj,
            },
        };
    }
};
exports.BudgetService = BudgetService;
exports.BudgetService = BudgetService = BudgetService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => sale_service_1.SaleService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        printer_service_1.PrinterService,
        sale_service_1.SaleService])
], BudgetService);
//# sourceMappingURL=budget.service.js.map
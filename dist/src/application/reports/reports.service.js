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
var ReportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const generate_report_dto_1 = require("./dto/generate-report.dto");
const ExcelJS = require("exceljs");
const xml2js_1 = require("xml2js");
let ReportsService = ReportsService_1 = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ReportsService_1.name);
    }
    async generateReport(companyId, generateReportDto) {
        this.logger.log(`Generating ${generateReportDto.reportType} report for company: ${companyId}`);
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new common_1.NotFoundException('Empresa não encontrada');
        }
        const { reportType, format, startDate, endDate, sellerId } = generateReportDto;
        let reportData;
        switch (reportType) {
            case generate_report_dto_1.ReportType.SALES:
                reportData = await this.generateSalesReport(companyId, startDate, endDate, sellerId);
                break;
            case generate_report_dto_1.ReportType.PRODUCTS:
                reportData = await this.generateProductsReport(companyId);
                break;
            case generate_report_dto_1.ReportType.INVOICES:
                reportData = await this.generateInvoicesReport(companyId, startDate, endDate);
                break;
            case generate_report_dto_1.ReportType.COMPLETE:
                reportData = await this.generateCompleteReport(companyId, startDate, endDate, sellerId);
                break;
        }
        const reportWithCompany = {
            company: {
                id: company.id,
                name: company.name,
                cnpj: company.cnpj,
                email: company.email,
                phone: company.phone,
                stateRegistration: company.stateRegistration,
                municipalRegistration: company.municipalRegistration,
            },
            reportMetadata: {
                type: reportType,
                generatedAt: new Date().toISOString(),
                period: {
                    startDate: startDate || null,
                    endDate: endDate || null,
                },
            },
            data: reportData,
        };
        switch (format) {
            case generate_report_dto_1.ReportFormat.JSON:
                return {
                    contentType: 'application/json',
                    data: reportWithCompany,
                };
            case generate_report_dto_1.ReportFormat.XML:
                return {
                    contentType: 'application/xml',
                    data: await this.convertToXML(reportWithCompany),
                };
            case generate_report_dto_1.ReportFormat.EXCEL:
                return {
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    data: await this.convertToExcel(reportWithCompany, reportType),
                };
        }
    }
    async generateSalesReport(companyId, startDate, endDate, sellerId) {
        const where = { companyId };
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
        const sales = await this.prisma.sale.findMany({
            where,
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                paymentMethods: true,
                seller: true,
            },
            orderBy: {
                saleDate: 'desc',
            },
        });
        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
        const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
        return {
            summary: {
                totalSales,
                totalRevenue,
                averageTicket,
            },
            sales: sales.map((sale) => ({
                id: sale.id,
                saleDate: sale.saleDate,
                total: Number(sale.total),
                clientName: sale.clientName,
                clientCpfCnpj: sale.clientCpfCnpj,
                paymentMethods: sale.paymentMethods,
                change: Number(sale.change),
                isInstallment: sale.isInstallment,
                seller: {
                    id: sale.seller.id,
                    name: sale.seller.name,
                },
                items: sale.items.map((item) => ({
                    productName: item.product.name,
                    barcode: item.product.barcode,
                    quantity: item.quantity,
                    unitPrice: Number(item.unitPrice),
                    totalPrice: Number(item.totalPrice),
                })),
            })),
        };
    }
    async generateProductsReport(companyId) {
        const products = await this.prisma.product.findMany({
            where: { companyId },
            include: {
                saleItems: {
                    select: {
                        quantity: true,
                        totalPrice: true,
                    },
                },
            },
        });
        const productsWithStats = products.map((product) => {
            const totalSold = product.saleItems.reduce((sum, item) => sum + item.quantity, 0);
            const totalRevenue = product.saleItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
            return {
                id: product.id,
                name: product.name,
                barcode: product.barcode,
                category: product.category,
                price: Number(product.price),
                stockQuantity: product.stockQuantity,
                totalSold,
                totalRevenue,
            };
        });
        return {
            summary: {
                totalProducts: products.length,
                totalStockValue: products.reduce((sum, p) => sum + Number(p.price) * p.stockQuantity, 0),
            },
            products: productsWithStats,
        };
    }
    async generateInvoicesReport(companyId, startDate, endDate) {
        const where = { companyId };
        if (startDate || endDate) {
            where.emissionDate = {};
            if (startDate) {
                where.emissionDate.gte = new Date(startDate);
            }
            if (endDate) {
                where.emissionDate.lte = new Date(endDate);
            }
        }
        const invoices = await this.prisma.fiscalDocument.findMany({
            where,
            orderBy: {
                emissionDate: 'desc',
            },
        });
        return {
            summary: {
                totalInvoices: invoices.length,
            },
            invoices: invoices.map((invoice) => ({
                id: invoice.id,
                documentType: invoice.documentType,
                documentNumber: invoice.documentNumber,
                accessKey: invoice.accessKey,
                status: invoice.status,
                emissionDate: invoice.emissionDate,
                xmlContent: invoice.xmlContent,
            })),
        };
    }
    async generateCompleteReport(companyId, startDate, endDate, sellerId) {
        const [salesReport, productsReport, invoicesReport, billsToPay, cashClosures, commissions] = await Promise.all([
            this.generateSalesReport(companyId, startDate, endDate, sellerId),
            this.generateProductsReport(companyId),
            this.generateInvoicesReport(companyId, startDate, endDate),
            this.getBillsToPay(companyId, startDate, endDate),
            this.getCashClosures(companyId, startDate, endDate),
            this.getCommissionsReport(companyId, startDate, endDate),
        ]);
        return {
            sales: salesReport,
            products: productsReport,
            invoices: invoicesReport,
            billsToPay,
            cashClosures,
            commissions,
        };
    }
    async getBillsToPay(companyId, startDate, endDate) {
        const where = { companyId };
        if (startDate || endDate) {
            where.dueDate = {};
            if (startDate) {
                where.dueDate.gte = new Date(startDate);
            }
            if (endDate) {
                where.dueDate.lte = new Date(endDate);
            }
        }
        const bills = await this.prisma.billToPay.findMany({
            where,
            orderBy: {
                dueDate: 'asc',
            },
        });
        return {
            summary: {
                totalBills: bills.length,
                paidBills: bills.filter((b) => b.isPaid).length,
                totalAmount: bills.reduce((sum, b) => sum + Number(b.amount), 0),
            },
            bills: bills.map((bill) => ({
                id: bill.id,
                title: bill.title,
                dueDate: bill.dueDate,
                amount: Number(bill.amount),
                isPaid: bill.isPaid,
            })),
        };
    }
    async getCashClosures(companyId, startDate, endDate) {
        const where = { companyId };
        if (startDate || endDate) {
            where.openingDate = {};
            if (startDate) {
                where.openingDate.gte = new Date(startDate);
            }
            if (endDate) {
                where.openingDate.lte = new Date(endDate);
            }
        }
        const closures = await this.prisma.cashClosure.findMany({
            where,
            orderBy: {
                openingDate: 'desc',
            },
        });
        return {
            summary: {
                totalClosures: closures.length,
                totalSales: closures.reduce((sum, c) => sum + Number(c.totalSales), 0),
            },
            closures: closures.map((closure) => ({
                id: closure.id,
                openingDate: closure.openingDate,
                closingDate: closure.closingDate,
                totalSales: Number(closure.totalSales),
                isClosed: closure.isClosed,
            })),
        };
    }
    async getCommissionsReport(companyId, startDate, endDate) {
        const sellers = await this.prisma.seller.findMany({
            where: { companyId },
            select: {
                id: true,
                name: true,
                cpf: true,
                commissionRate: true,
            },
        });
        const commissionsData = await Promise.all(sellers.map(async (seller) => {
            const where = {
                sellerId: seller.id,
                companyId,
            };
            if (startDate || endDate) {
                where.saleDate = {};
                if (startDate) {
                    where.saleDate.gte = new Date(startDate);
                }
                if (endDate) {
                    where.saleDate.lte = new Date(endDate);
                }
            }
            const sales = await this.prisma.sale.findMany({
                where,
                select: {
                    total: true,
                    change: true,
                },
            });
            const totalSales = sales.length;
            const totalRevenue = sales.reduce((sum, sale) => {
                return sum + (Number(sale.total) - Number(sale.change));
            }, 0);
            const commissionRate = Number(seller.commissionRate);
            const commissionAmount = (totalRevenue * commissionRate) / 100;
            return {
                sellerId: seller.id,
                sellerName: seller.name,
                sellerCpf: seller.cpf,
                commissionRate,
                totalSales,
                totalRevenue,
                commissionAmount,
            };
        }));
        const totalCommissions = commissionsData.reduce((sum, c) => sum + c.commissionAmount, 0);
        return {
            summary: {
                totalSellers: sellers.length,
                totalCommissions,
            },
            commissions: commissionsData,
        };
    }
    async convertToXML(data) {
        const builder = new xml2js_1.Builder({
            xmldec: { version: '1.0', encoding: 'UTF-8' },
            renderOpts: { pretty: true, indent: '  ', newline: '\n' },
        });
        return builder.buildObject({ report: data });
    }
    async convertToExcel(data, reportType) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'API Lojas SaaS';
        workbook.created = new Date();
        const companySheet = workbook.addWorksheet('Empresa');
        this.addCompanyInfo(companySheet, data.company);
        if (reportType === generate_report_dto_1.ReportType.SALES || reportType === generate_report_dto_1.ReportType.COMPLETE) {
            this.addSalesSheet(workbook, data.data.sales || data.data);
        }
        if (reportType === generate_report_dto_1.ReportType.PRODUCTS || reportType === generate_report_dto_1.ReportType.COMPLETE) {
            this.addProductsSheet(workbook, data.data.products || data.data);
        }
        if (reportType === generate_report_dto_1.ReportType.INVOICES || reportType === generate_report_dto_1.ReportType.COMPLETE) {
            this.addInvoicesSheet(workbook, data.data.invoices || data.data);
        }
        if (reportType === generate_report_dto_1.ReportType.COMPLETE) {
            this.addBillsSheet(workbook, data.data.billsToPay);
            this.addCashClosuresSheet(workbook, data.data.cashClosures);
            this.addCommissionsSheet(workbook, data.data.commissions);
        }
        return (await workbook.xlsx.writeBuffer());
    }
    addCompanyInfo(sheet, company) {
        sheet.columns = [
            { header: 'Campo', key: 'field', width: 30 },
            { header: 'Valor', key: 'value', width: 50 },
        ];
        sheet.addRow({ field: 'Nome', value: company.name });
        sheet.addRow({ field: 'CNPJ', value: company.cnpj });
        sheet.addRow({ field: 'Email', value: company.email });
        sheet.addRow({ field: 'Telefone', value: company.phone });
        sheet.getRow(1).font = { bold: true };
    }
    addSalesSheet(workbook, salesData) {
        const sheet = workbook.addWorksheet('Vendas');
        sheet.columns = [
            { header: 'Data', key: 'saleDate', width: 20 },
            { header: 'Total', key: 'total', width: 15 },
            { header: 'Cliente', key: 'clientName', width: 30 },
            { header: 'Vendedor', key: 'sellerName', width: 30 },
            { header: 'Pagamento', key: 'paymentMethods', width: 30 },
        ];
        (salesData?.sales || []).forEach((sale) => {
            sheet.addRow({
                saleDate: sale.saleDate,
                total: sale.total,
                clientName: sale.clientName,
                sellerName: sale.seller.name,
                paymentMethods: sale.paymentMethods.join(', '),
            });
        });
        sheet.getRow(1).font = { bold: true };
    }
    addProductsSheet(workbook, productsData) {
        const sheet = workbook.addWorksheet('Produtos');
        sheet.columns = [
            { header: 'Nome', key: 'name', width: 30 },
            { header: 'Código', key: 'barcode', width: 20 },
            { header: 'Preço', key: 'price', width: 15 },
            { header: 'Estoque', key: 'stockQuantity', width: 15 },
            { header: 'Vendidos', key: 'totalSold', width: 15 },
        ];
        (productsData?.products || []).forEach((product) => {
            sheet.addRow(product);
        });
        sheet.getRow(1).font = { bold: true };
    }
    addInvoicesSheet(workbook, invoicesData) {
        const sheet = workbook.addWorksheet('Notas Fiscais');
        sheet.columns = [
            { header: 'Tipo', key: 'documentType', width: 15 },
            { header: 'Número', key: 'documentNumber', width: 20 },
            { header: 'Chave', key: 'accessKey', width: 50 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Emissão', key: 'emissionDate', width: 20 },
        ];
        invoicesData.invoices.forEach((invoice) => {
            sheet.addRow(invoice);
        });
        sheet.getRow(1).font = { bold: true };
    }
    addBillsSheet(workbook, billsData) {
        const sheet = workbook.addWorksheet('Contas a Pagar');
        sheet.columns = [
            { header: 'Título', key: 'title', width: 30 },
            { header: 'Vencimento', key: 'dueDate', width: 20 },
            { header: 'Valor', key: 'amount', width: 15 },
            { header: 'Pago', key: 'isPaid', width: 10 },
        ];
        billsData.bills.forEach((bill) => {
            sheet.addRow({
                ...bill,
                isPaid: bill.isPaid ? 'Sim' : 'Não',
            });
        });
        sheet.getRow(1).font = { bold: true };
    }
    addCashClosuresSheet(workbook, closuresData) {
        const sheet = workbook.addWorksheet('Fechamentos');
        sheet.columns = [
            { header: 'Abertura', key: 'openingDate', width: 20 },
            { header: 'Fechamento', key: 'closingDate', width: 20 },
            { header: 'Total Vendas', key: 'totalSales', width: 20 },
            { header: 'Fechado', key: 'isClosed', width: 15 },
        ];
        closuresData.closures.forEach((closure) => {
            sheet.addRow({
                ...closure,
                isClosed: closure.isClosed ? 'Sim' : 'Não',
            });
        });
        sheet.getRow(1).font = { bold: true };
    }
    addCommissionsSheet(workbook, commissionsData) {
        const sheet = workbook.addWorksheet('Comissões');
        sheet.columns = [
            { header: 'Vendedor', key: 'sellerName', width: 30 },
            { header: 'CPF', key: 'sellerCpf', width: 20 },
            { header: 'Taxa de Comissão (%)', key: 'commissionRate', width: 20 },
            { header: 'Nº de Vendas', key: 'totalSales', width: 15 },
            { header: 'Faturamento Total', key: 'totalRevenue', width: 20 },
            { header: 'Valor da Comissão', key: 'commissionAmount', width: 20 },
        ];
        commissionsData.commissions.forEach((commission) => {
            sheet.addRow({
                sellerName: commission.sellerName,
                sellerCpf: commission.sellerCpf || 'N/A',
                commissionRate: commission.commissionRate,
                totalSales: commission.totalSales,
                totalRevenue: commission.totalRevenue.toFixed(2),
                commissionAmount: commission.commissionAmount.toFixed(2),
            });
        });
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        const totalRow = sheet.addRow({
            sellerName: 'TOTAL',
            sellerCpf: '',
            commissionRate: '',
            totalSales: commissionsData.commissions.reduce((sum, c) => sum + c.totalSales, 0),
            totalRevenue: commissionsData.commissions.reduce((sum, c) => sum + c.totalRevenue, 0).toFixed(2),
            commissionAmount: commissionsData.summary.totalCommissions.toFixed(2),
        });
        totalRow.font = { bold: true };
        totalRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFEB3B' },
        };
        sheet.getColumn('totalRevenue').numFmt = 'R$ #,##0.00';
        sheet.getColumn('commissionAmount').numFmt = 'R$ #,##0.00';
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = ReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map
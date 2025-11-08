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
const archiver_1 = require("archiver");
const stream_1 = require("stream");
const client_time_util_1 = require("../../shared/utils/client-time.util");
const fiscal_service_1 = require("../fiscal/fiscal.service");
let ReportsService = ReportsService_1 = class ReportsService {
    constructor(prisma, fiscalService) {
        this.prisma = prisma;
        this.fiscalService = fiscalService;
        this.logger = new common_1.Logger(ReportsService_1.name);
    }
    async generateReport(companyId, generateReportDto, clientTimeInfo) {
        this.logger.log(`Generating ${generateReportDto.reportType} report for company: ${companyId}`);
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new common_1.NotFoundException('Empresa não encontrada');
        }
        const { reportType, format, startDate, endDate, sellerId, includeDocuments } = generateReportDto;
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
                generatedAt: (0, client_time_util_1.getClientNow)(clientTimeInfo).toISOString(),
                period: {
                    startDate: startDate || null,
                    endDate: endDate || null,
                },
                clientTimeInfo: clientTimeInfo
                    ? {
                        timeZone: clientTimeInfo.timeZone,
                        locale: clientTimeInfo.locale,
                        utcOffsetMinutes: clientTimeInfo.utcOffsetMinutes,
                        currentDate: clientTimeInfo.currentDate?.toISOString(),
                    }
                    : undefined,
            },
            data: reportData,
        };
        const timestamp = (0, client_time_util_1.getClientNow)(clientTimeInfo).toISOString().replace(/[:.]/g, '-');
        const reportBaseName = `relatorio-${reportType}-${timestamp}`;
        const reportFile = await this.generateReportFile(reportWithCompany, reportType, format, clientTimeInfo, reportBaseName);
        if (!includeDocuments) {
            return {
                contentType: reportFile.contentType,
                data: reportFile.buffer,
                filename: reportFile.filename,
            };
        }
        let invoicesData;
        if (reportType === generate_report_dto_1.ReportType.INVOICES) {
            invoicesData = reportData;
        }
        else if (reportType === generate_report_dto_1.ReportType.COMPLETE) {
            invoicesData = reportData?.invoices;
        }
        else {
            invoicesData = await this.generateInvoicesReport(companyId, startDate, endDate);
        }
        const invoices = Array.isArray(invoicesData?.invoices) ? invoicesData.invoices : [];
        const zipBuffer = await this.buildZipPackage(reportFile, invoices, timestamp, companyId);
        return {
            contentType: 'application/zip',
            data: zipBuffer,
            filename: `${reportBaseName}.zip`,
        };
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
                pdfUrl: invoice.pdfUrl,
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
    async convertToExcel(data, reportType, clientTimeInfo) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'API Lojas SaaS';
        workbook.created = (0, client_time_util_1.getClientNow)(clientTimeInfo);
        const companySheet = workbook.addWorksheet('Empresa');
        this.addCompanyInfo(companySheet, data.company);
        if (reportType === generate_report_dto_1.ReportType.SALES || reportType === generate_report_dto_1.ReportType.COMPLETE) {
            this.addSalesSheet(workbook, data.data.sales || data.data, clientTimeInfo);
        }
        if (reportType === generate_report_dto_1.ReportType.PRODUCTS || reportType === generate_report_dto_1.ReportType.COMPLETE) {
            this.addProductsSheet(workbook, data.data.products || data.data);
        }
        if (reportType === generate_report_dto_1.ReportType.INVOICES || reportType === generate_report_dto_1.ReportType.COMPLETE) {
            this.addInvoicesSheet(workbook, data.data.invoices || data.data, clientTimeInfo);
        }
        if (reportType === generate_report_dto_1.ReportType.COMPLETE) {
            this.addBillsSheet(workbook, data.data.billsToPay, clientTimeInfo);
            this.addCashClosuresSheet(workbook, data.data.cashClosures, clientTimeInfo);
            this.addCommissionsSheet(workbook, data.data.commissions);
        }
        const arrayBuffer = await workbook.xlsx.writeBuffer();
        return Buffer.isBuffer(arrayBuffer) ? arrayBuffer : Buffer.from(arrayBuffer);
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
    addSalesSheet(workbook, salesData, clientTimeInfo) {
        const sheet = workbook.addWorksheet('Vendas');
        sheet.columns = [
            { header: 'Data', key: 'saleDate', width: 20 },
            { header: 'Total', key: 'total', width: 15 },
            { header: 'Cliente', key: 'clientName', width: 30 },
            { header: 'Vendedor', key: 'sellerName', width: 30 },
            { header: 'Pagamento', key: 'paymentMethods', width: 30 },
        ];
        const sales = Array.isArray(salesData) ? salesData : salesData?.sales || [];
        sales.forEach((sale) => {
            const paymentLabels = Array.isArray(sale.paymentMethods)
                ? sale.paymentMethods.map((pm) => pm.method ?? pm).filter(Boolean).join(', ')
                : '';
            sheet.addRow({
                saleDate: (0, client_time_util_1.formatClientDate)(sale.saleDate, clientTimeInfo),
                total: sale.total,
                clientName: sale.clientName,
                sellerName: sale.seller?.name || '-',
                paymentMethods: paymentLabels || 'Não informado',
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
    addInvoicesSheet(workbook, invoicesData, clientTimeInfo) {
        const sheet = workbook.addWorksheet('Notas Fiscais');
        sheet.columns = [
            { header: 'Tipo', key: 'documentType', width: 15 },
            { header: 'Número', key: 'documentNumber', width: 20 },
            { header: 'Chave', key: 'accessKey', width: 50 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Emissão', key: 'emissionDate', width: 20 },
        ];
        const invoices = Array.isArray(invoicesData) ? invoicesData : invoicesData?.invoices || [];
        invoices.forEach((invoice) => {
            sheet.addRow({
                ...invoice,
                emissionDate: (0, client_time_util_1.formatClientDate)(invoice.emissionDate, clientTimeInfo),
            });
        });
        sheet.getRow(1).font = { bold: true };
    }
    addBillsSheet(workbook, billsData, clientTimeInfo) {
        const sheet = workbook.addWorksheet('Contas a Pagar');
        sheet.columns = [
            { header: 'Título', key: 'title', width: 30 },
            { header: 'Vencimento', key: 'dueDate', width: 20 },
            { header: 'Valor', key: 'amount', width: 15 },
            { header: 'Pago', key: 'isPaid', width: 10 },
        ];
        const bills = Array.isArray(billsData) ? billsData : billsData?.bills || [];
        bills.forEach((bill) => {
            sheet.addRow({
                ...bill,
                dueDate: (0, client_time_util_1.formatClientDateOnly)(bill.dueDate, clientTimeInfo),
                isPaid: bill.isPaid ? 'Sim' : 'Não',
            });
        });
        sheet.getRow(1).font = { bold: true };
    }
    addCashClosuresSheet(workbook, closuresData, clientTimeInfo) {
        const sheet = workbook.addWorksheet('Fechamentos');
        sheet.columns = [
            { header: 'Abertura', key: 'openingDate', width: 20 },
            { header: 'Fechamento', key: 'closingDate', width: 20 },
            { header: 'Total Vendas', key: 'totalSales', width: 20 },
            { header: 'Fechado', key: 'isClosed', width: 15 },
        ];
        const closures = Array.isArray(closuresData) ? closuresData : closuresData?.closures || [];
        closures.forEach((closure) => {
            sheet.addRow({
                ...closure,
                openingDate: (0, client_time_util_1.formatClientDate)(closure.openingDate, clientTimeInfo),
                closingDate: closure.closingDate ? (0, client_time_util_1.formatClientDate)(closure.closingDate, clientTimeInfo) : '',
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
    async generateReportFile(reportWithCompany, reportType, format, clientTimeInfo, reportBaseName) {
        switch (format) {
            case generate_report_dto_1.ReportFormat.JSON: {
                const jsonContent = JSON.stringify(reportWithCompany, null, 2);
                return {
                    buffer: Buffer.from(jsonContent, 'utf8'),
                    filename: `${reportBaseName}.json`,
                    contentType: 'application/json',
                };
            }
            case generate_report_dto_1.ReportFormat.XML: {
                const xmlContent = await this.convertToXML(reportWithCompany);
                return {
                    buffer: Buffer.from(xmlContent, 'utf8'),
                    filename: `${reportBaseName}.xml`,
                    contentType: 'application/xml',
                };
            }
            case generate_report_dto_1.ReportFormat.EXCEL: {
                const excelBuffer = await this.convertToExcel(reportWithCompany, reportType, clientTimeInfo);
                return {
                    buffer: excelBuffer,
                    filename: `${reportBaseName}.xlsx`,
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                };
            }
            default: {
                const fallbackContent = JSON.stringify(reportWithCompany, null, 2);
                return {
                    buffer: Buffer.from(fallbackContent, 'utf8'),
                    filename: `${reportBaseName}.json`,
                    contentType: 'application/json',
                };
            }
        }
    }
    async buildZipPackage(reportFile, invoices, timestamp, companyId) {
        const archive = (0, archiver_1.create)('zip', { zlib: { level: 9 } });
        const stream = new stream_1.PassThrough();
        const chunks = [];
        const zipPromise = new Promise((resolve, reject) => {
            stream.on('data', (chunk) => {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            });
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
            archive.on('error', reject);
        });
        archive.pipe(stream);
        archive.append(reportFile.buffer, {
            name: `relatorio/${reportFile.filename}`,
        });
        const folderUsage = {
            'notas-fiscais': false,
            nfc: false,
            'notas-fiscais-entrada': false,
        };
        for (const invoice of invoices) {
            const folder = this.resolveInvoiceFolder(invoice.documentType);
            if (invoice?.xmlContent) {
                folderUsage[folder] = true;
                const xmlFileName = this.buildInvoiceFilename(invoice, timestamp, 'xml');
                archive.append(invoice.xmlContent, {
                    name: `${folder}/${xmlFileName}`,
                });
            }
            const pdfFile = await this.tryGetInvoicePdf(invoice, timestamp, companyId);
            if (pdfFile) {
                folderUsage[folder] = true;
                archive.append(pdfFile.buffer, {
                    name: `${folder}/${pdfFile.filename}`,
                });
            }
        }
        const placeholderContent = 'Nao ha documentos XML deste tipo para o periodo selecionado.';
        Object.entries(folderUsage).forEach(([folder, hasFiles]) => {
            if (!hasFiles) {
                archive.append(placeholderContent, {
                    name: `${folder}/LEIA-ME.txt`,
                });
            }
        });
        await archive.finalize();
        return zipPromise;
    }
    resolveInvoiceFolder(documentType) {
        const normalized = (documentType || '').toLowerCase();
        if (normalized.includes('entrada') ||
            normalized.includes('inbound') ||
            normalized.includes('compra')) {
            return 'notas-fiscais-entrada';
        }
        if (normalized.includes('nfce') ||
            normalized.includes('nfc-e') ||
            normalized.includes('nfc')) {
            return 'nfc';
        }
        return 'notas-fiscais';
    }
    buildInvoiceFilename(invoice, timestamp, extension = 'xml') {
        const parts = [];
        if (invoice.documentType) {
            parts.push(this.sanitizeFileName(String(invoice.documentType)));
        }
        if (invoice.documentNumber) {
            parts.push(this.sanitizeFileName(String(invoice.documentNumber)));
        }
        if (invoice.accessKey) {
            parts.push(this.sanitizeFileName(String(invoice.accessKey)));
        }
        if (parts.length === 0) {
            parts.push(invoice.id ? this.sanitizeFileName(String(invoice.id)) : 'documento');
        }
        parts.push(this.sanitizeFileName(timestamp));
        const baseName = parts.filter(Boolean).join('-') || `documento-${timestamp}`;
        return `${baseName}.${extension}`;
    }
    sanitizeFileName(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9-_]/g, '_');
    }
    async tryGetInvoicePdf(invoice, timestamp, companyId) {
        if (!invoice?.id) {
            return null;
        }
        try {
            const result = await this.fiscalService.downloadFiscalDocument(invoice.id, 'pdf', companyId);
            if (result.content !== undefined) {
                const buffer = this.mapContentToBuffer(result.content);
                const filename = result.filename || this.buildInvoiceFilename(invoice, timestamp, 'pdf');
                return { buffer, filename };
            }
        }
        catch (error) {
            this.logger.warn(`Unable to include PDF for invoice ${invoice.id}: ${error?.message || error}`);
        }
        return null;
    }
    mapContentToBuffer(content) {
        if (Buffer.isBuffer(content)) {
            return content;
        }
        if (typeof content === 'string') {
            return Buffer.from(content);
        }
        if (content instanceof ArrayBuffer) {
            return Buffer.from(content);
        }
        if (ArrayBuffer.isView(content)) {
            return Buffer.from(content.buffer);
        }
        throw new Error('Formato de conteúdo não suportado para relatório');
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = ReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        fiscal_service_1.FiscalService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map
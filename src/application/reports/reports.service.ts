import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { GenerateReportDto, ReportType, ReportFormat } from './dto/generate-report.dto';
import * as ExcelJS from 'exceljs';
import { Builder } from 'xml2js';
import archiver from 'archiver';
import axios from 'axios';
import { PassThrough } from 'stream';
import {
  ClientTimeInfo,
  formatClientDate,
  formatClientDateOnly,
  getClientNow,
} from '../../shared/utils/client-time.util';
import { FiscalService } from '../fiscal/fiscal.service';

type GeneratedReportFile = {
  buffer: Buffer;
  filename: string;
  contentType: string;
};

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fiscalService: FiscalService,
  ) {}

  async generateReport(
    companyId: string,
    generateReportDto: GenerateReportDto,
    clientTimeInfo?: ClientTimeInfo,
  ) {
    this.logger.log(`Generating ${generateReportDto.reportType} report for company: ${companyId}`);

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const { reportType, format, startDate, endDate, sellerId, includeDocuments } =
      generateReportDto;

    let reportData: any;

    switch (reportType) {
      case ReportType.SALES:
        reportData = await this.generateSalesReport(companyId, startDate, endDate, sellerId);
        break;
      case ReportType.PRODUCTS:
        reportData = await this.generateProductsReport(companyId);
        break;
      case ReportType.INVOICES:
        reportData = await this.generateInvoicesReport(companyId, startDate, endDate);
        break;
      case ReportType.COMPLETE:
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
        generatedAt: getClientNow(clientTimeInfo).toISOString(),
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

    const timestamp = getClientNow(clientTimeInfo).toISOString().replace(/[:.]/g, '-');
    const reportBaseName = `relatorio-${reportType}-${timestamp}`;

    const reportFile = await this.generateReportFile(
      reportWithCompany,
      reportType,
      format,
      clientTimeInfo,
      reportBaseName,
    );

    if (!includeDocuments) {
      return {
        contentType: reportFile.contentType,
        data: reportFile.buffer,
        filename: reportFile.filename,
      };
    }

    let invoicesData: any;
    if (reportType === ReportType.INVOICES) {
      invoicesData = reportData;
    } else if (reportType === ReportType.COMPLETE) {
      invoicesData = reportData?.invoices;
    } else {
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

  private async generateSalesReport(
    companyId: string,
    startDate?: string,
    endDate?: string,
    sellerId?: string,
  ) {
    const where: any = { companyId };

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

  private async generateProductsReport(companyId: string) {
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

  private async generateInvoicesReport(companyId: string, startDate?: string, endDate?: string) {
    const where: any = { companyId };

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

  private async generateCompleteReport(
    companyId: string,
    startDate?: string,
    endDate?: string,
    sellerId?: string,
  ) {
    const [salesReport, productsReport, invoicesReport, billsToPay, cashClosures, commissions] =
      await Promise.all([
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

  private async getBillsToPay(companyId: string, startDate?: string, endDate?: string) {
    const where: any = { companyId };

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

  private async getCashClosures(companyId: string, startDate?: string, endDate?: string) {
    const where: any = { companyId };

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

  private async getCommissionsReport(companyId: string, startDate?: string, endDate?: string) {
    // Buscar todos os vendedores da empresa
    const sellers = await this.prisma.seller.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        cpf: true,
        commissionRate: true,
      },
    });

    // Buscar vendas de cada vendedor no período
    const commissionsData = await Promise.all(
      sellers.map(async (seller) => {
        const where: any = {
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
          // Receita = total - troco
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
      })
    );

    const totalCommissions = commissionsData.reduce((sum, c) => sum + c.commissionAmount, 0);

    return {
      summary: {
        totalSellers: sellers.length,
        totalCommissions,
      },
      commissions: commissionsData,
    };
  }

  private async convertToXML(data: any): Promise<string> {
    const builder = new Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      renderOpts: { pretty: true, indent: '  ', newline: '\n' },
    });
    return builder.buildObject({ report: data });
  }

  private async convertToExcel(
    data: any,
    reportType: ReportType,
    clientTimeInfo?: ClientTimeInfo,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'API Lojas SaaS';
    workbook.created = getClientNow(clientTimeInfo);

    const companySheet = workbook.addWorksheet('Empresa');
    this.addCompanyInfo(companySheet, data.company);

    if (reportType === ReportType.SALES || reportType === ReportType.COMPLETE) {
      this.addSalesSheet(workbook, data.data.sales || data.data, clientTimeInfo);
    }

    if (reportType === ReportType.PRODUCTS || reportType === ReportType.COMPLETE) {
      this.addProductsSheet(workbook, data.data.products || data.data);
    }

    if (reportType === ReportType.INVOICES || reportType === ReportType.COMPLETE) {
      this.addInvoicesSheet(workbook, data.data.invoices || data.data, clientTimeInfo);
    }

    if (reportType === ReportType.COMPLETE) {
      this.addBillsSheet(workbook, data.data.billsToPay, clientTimeInfo);
      this.addCashClosuresSheet(workbook, data.data.cashClosures, clientTimeInfo);
      this.addCommissionsSheet(workbook, data.data.commissions);
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.isBuffer(arrayBuffer) ? arrayBuffer : Buffer.from(arrayBuffer);
  }

  private addCompanyInfo(sheet: ExcelJS.Worksheet, company: any) {
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

  private addSalesSheet(workbook: ExcelJS.Workbook, salesData: any, clientTimeInfo?: ClientTimeInfo) {
    const sheet = workbook.addWorksheet('Vendas');
    sheet.columns = [
      { header: 'Data', key: 'saleDate', width: 20 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Cliente', key: 'clientName', width: 30 },
      { header: 'Vendedor', key: 'sellerName', width: 30 },
      { header: 'Pagamento', key: 'paymentMethods', width: 30 },
    ];

    const sales = Array.isArray(salesData) ? salesData : salesData?.sales || [];

    sales.forEach((sale: any) => {
      const paymentLabels = Array.isArray(sale.paymentMethods)
        ? sale.paymentMethods.map((pm: any) => pm.method ?? pm).filter(Boolean).join(', ')
        : '';

      sheet.addRow({
        saleDate: formatClientDate(sale.saleDate, clientTimeInfo),
        total: sale.total,
        clientName: sale.clientName,
        sellerName: sale.seller?.name || '-',
        paymentMethods: paymentLabels || 'Não informado',
      });
    });

    sheet.getRow(1).font = { bold: true };
  }

  private addProductsSheet(workbook: ExcelJS.Workbook, productsData: any) {
    const sheet = workbook.addWorksheet('Produtos');
    sheet.columns = [
      { header: 'Nome', key: 'name', width: 30 },
      { header: 'Código', key: 'barcode', width: 20 },
      { header: 'Preço', key: 'price', width: 15 },
      { header: 'Estoque', key: 'stockQuantity', width: 15 },
      { header: 'Vendidos', key: 'totalSold', width: 15 },
    ];

  (productsData?.products || []).forEach((product: any) => {
      sheet.addRow(product);
    });

    sheet.getRow(1).font = { bold: true };
  }

  private addInvoicesSheet(workbook: ExcelJS.Workbook, invoicesData: any, clientTimeInfo?: ClientTimeInfo) {
    const sheet = workbook.addWorksheet('Notas Fiscais');
    sheet.columns = [
      { header: 'Tipo', key: 'documentType', width: 15 },
      { header: 'Número', key: 'documentNumber', width: 20 },
      { header: 'Chave', key: 'accessKey', width: 50 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Emissão', key: 'emissionDate', width: 20 },
    ];

    const invoices = Array.isArray(invoicesData) ? invoicesData : invoicesData?.invoices || [];

    invoices.forEach((invoice: any) => {
      sheet.addRow({
        ...invoice,
        emissionDate: formatClientDate(invoice.emissionDate, clientTimeInfo),
      });
    });

    sheet.getRow(1).font = { bold: true };
  }

  private addBillsSheet(workbook: ExcelJS.Workbook, billsData: any, clientTimeInfo?: ClientTimeInfo) {
    const sheet = workbook.addWorksheet('Contas a Pagar');
    sheet.columns = [
      { header: 'Título', key: 'title', width: 30 },
      { header: 'Vencimento', key: 'dueDate', width: 20 },
      { header: 'Valor', key: 'amount', width: 15 },
      { header: 'Pago', key: 'isPaid', width: 10 },
    ];

    const bills = Array.isArray(billsData) ? billsData : billsData?.bills || [];

    bills.forEach((bill: any) => {
      sheet.addRow({
        ...bill,
        dueDate: formatClientDateOnly(bill.dueDate, clientTimeInfo),
        isPaid: bill.isPaid ? 'Sim' : 'Não',
      });
    });

    sheet.getRow(1).font = { bold: true };
  }

  private addCashClosuresSheet(workbook: ExcelJS.Workbook, closuresData: any, clientTimeInfo?: ClientTimeInfo) {
    const sheet = workbook.addWorksheet('Fechamentos');
    sheet.columns = [
      { header: 'Abertura', key: 'openingDate', width: 20 },
      { header: 'Fechamento', key: 'closingDate', width: 20 },
      { header: 'Total Vendas', key: 'totalSales', width: 20 },
      { header: 'Fechado', key: 'isClosed', width: 15 },
    ];

    const closures = Array.isArray(closuresData) ? closuresData : closuresData?.closures || [];

    closures.forEach((closure: any) => {
      sheet.addRow({
        ...closure,
        openingDate: formatClientDate(closure.openingDate, clientTimeInfo),
        closingDate: closure.closingDate ? formatClientDate(closure.closingDate, clientTimeInfo) : '',
        isClosed: closure.isClosed ? 'Sim' : 'Não',
      });
    });

    sheet.getRow(1).font = { bold: true };
  }

  private addCommissionsSheet(workbook: ExcelJS.Workbook, commissionsData: any) {
    const sheet = workbook.addWorksheet('Comissões');
    
    // Adicionar cabeçalho
    sheet.columns = [
      { header: 'Vendedor', key: 'sellerName', width: 30 },
      { header: 'CPF', key: 'sellerCpf', width: 20 },
      { header: 'Taxa de Comissão (%)', key: 'commissionRate', width: 20 },
      { header: 'Nº de Vendas', key: 'totalSales', width: 15 },
      { header: 'Faturamento Total', key: 'totalRevenue', width: 20 },
      { header: 'Valor da Comissão', key: 'commissionAmount', width: 20 },
    ];

    // Adicionar dados
    commissionsData.commissions.forEach((commission: any) => {
      sheet.addRow({
        sellerName: commission.sellerName,
        sellerCpf: commission.sellerCpf || 'N/A',
        commissionRate: commission.commissionRate,
        totalSales: commission.totalSales,
        totalRevenue: commission.totalRevenue.toFixed(2),
        commissionAmount: commission.commissionAmount.toFixed(2),
      });
    });

    // Formatar cabeçalho
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Adicionar linha de total
    const totalRow = sheet.addRow({
      sellerName: 'TOTAL',
      sellerCpf: '',
      commissionRate: '',
      totalSales: commissionsData.commissions.reduce((sum: number, c: any) => sum + c.totalSales, 0),
      totalRevenue: commissionsData.commissions.reduce((sum: number, c: any) => sum + c.totalRevenue, 0).toFixed(2),
      commissionAmount: commissionsData.summary.totalCommissions.toFixed(2),
    });

    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFEB3B' },
    };

    // Formatar colunas numéricas como moeda
    sheet.getColumn('totalRevenue').numFmt = 'R$ #,##0.00';
    sheet.getColumn('commissionAmount').numFmt = 'R$ #,##0.00';
  }

  private async generateReportFile(
    reportWithCompany: any,
    reportType: ReportType,
    format: ReportFormat,
    clientTimeInfo: ClientTimeInfo | undefined,
    reportBaseName: string,
  ): Promise<GeneratedReportFile> {
    switch (format) {
      case ReportFormat.JSON: {
        const jsonContent = JSON.stringify(reportWithCompany, null, 2);
        return {
          buffer: Buffer.from(jsonContent, 'utf8'),
          filename: `${reportBaseName}.json`,
          contentType: 'application/json',
        };
      }
      case ReportFormat.XML: {
        const xmlContent = await this.convertToXML(reportWithCompany);
        return {
          buffer: Buffer.from(xmlContent, 'utf8'),
          filename: `${reportBaseName}.xml`,
          contentType: 'application/xml',
        };
      }
      case ReportFormat.EXCEL: {
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

  private async buildZipPackage(
    reportFile: GeneratedReportFile,
    invoices: Array<{
      documentType?: string | null;
      documentNumber?: string | null;
      accessKey?: string | null;
      xmlContent?: string | null;
      id?: string;
      pdfUrl?: string | null;
    }>,
    timestamp: string,
    companyId: string,
  ): Promise<Buffer> {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    const zipPromise = new Promise<Buffer>((resolve, reject) => {
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

    const folderUsage: Record<string, boolean> = {
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

    const placeholderContent =
      'Nao ha documentos XML deste tipo para o periodo selecionado.';
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

  private resolveInvoiceFolder(documentType?: string | null): string {
    const normalized = (documentType || '').toLowerCase();

    if (
      normalized.includes('entrada') ||
      normalized.includes('inbound') ||
      normalized.includes('compra')
    ) {
      return 'notas-fiscais-entrada';
    }

    if (
      normalized.includes('nfce') ||
      normalized.includes('nfc-e') ||
      normalized.includes('nfc')
    ) {
      return 'nfc';
    }

    return 'notas-fiscais';
  }

  private buildInvoiceFilename(
    invoice: {
      documentType?: string | null;
      documentNumber?: string | null;
      accessKey?: string | null;
      id?: string;
    },
    timestamp: string,
    extension: 'xml' | 'pdf' = 'xml',
  ): string {
    const parts: string[] = [];

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
      parts.push(
        invoice.id ? this.sanitizeFileName(String(invoice.id)) : 'documento',
      );
    }

    parts.push(this.sanitizeFileName(timestamp));

    const baseName = parts.filter(Boolean).join('-') || `documento-${timestamp}`;
    return `${baseName}.${extension}`;
  }

  private sanitizeFileName(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_');
  }

  private async tryGetInvoicePdf(
    invoice: {
      id?: string;
      documentType?: string | null;
      documentNumber?: string | null;
      accessKey?: string | null;
      pdfUrl?: string | null;
    },
    timestamp: string,
    companyId: string,
  ): Promise<{ buffer: Buffer; filename: string } | null> {
    if (!invoice?.id) {
      return null;
    }

    try {
      const result = await this.fiscalService.downloadFiscalDocument(
        invoice.id,
        'pdf',
        companyId,
      );

      if (result.isExternal && result.url) {
        const response = await axios.get(result.url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        const filename = result.filename || this.buildInvoiceFilename(invoice, timestamp, 'pdf');
        return { buffer, filename };
      }

      if (result.content) {
        const buffer = Buffer.isBuffer(result.content)
          ? result.content
          : Buffer.from(result.content);
        const filename = result.filename || this.buildInvoiceFilename(invoice, timestamp, 'pdf');
        return { buffer, filename };
      }
    } catch (error: any) {
      this.logger.warn(
        `Unable to include PDF for invoice ${invoice.id}: ${error?.message || error}`,
      );
    }

    return null;
  }
}

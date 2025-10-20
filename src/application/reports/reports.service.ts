import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { GenerateReportDto, ReportType, ReportFormat } from './dto/generate-report.dto';
import * as ExcelJS from 'exceljs';
import { Builder } from 'xml2js';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateReport(companyId: string, generateReportDto: GenerateReportDto) {
    this.logger.log(`Generating ${generateReportDto.reportType} report for company: ${companyId}`);

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const { reportType, format, startDate, endDate, sellerId } = generateReportDto;

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
        generatedAt: new Date().toISOString(),
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
      data: reportData,
    };

    switch (format) {
      case ReportFormat.JSON:
        return {
          contentType: 'application/json',
          data: reportWithCompany,
        };
      case ReportFormat.XML:
        return {
          contentType: 'application/xml',
          data: await this.convertToXML(reportWithCompany),
        };
      case ReportFormat.EXCEL:
        return {
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          data: await this.convertToExcel(reportWithCompany, reportType),
        };
    }
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
      })),
    };
  }

  private async generateCompleteReport(
    companyId: string,
    startDate?: string,
    endDate?: string,
    sellerId?: string,
  ) {
    const [salesReport, productsReport, invoicesReport, billsToPay, cashClosures] =
      await Promise.all([
        this.generateSalesReport(companyId, startDate, endDate, sellerId),
        this.generateProductsReport(companyId),
        this.generateInvoicesReport(companyId, startDate, endDate),
        this.getBillsToPay(companyId, startDate, endDate),
        this.getCashClosures(companyId, startDate, endDate),
      ]);

    return {
      sales: salesReport,
      products: productsReport,
      invoices: invoicesReport,
      billsToPay,
      cashClosures,
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

  private async convertToXML(data: any): Promise<string> {
    const builder = new Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      renderOpts: { pretty: true, indent: '  ', newline: '\n' },
    });
    return builder.buildObject({ report: data });
  }

  private async convertToExcel(data: any, reportType: ReportType): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'API Lojas SaaS';
    workbook.created = new Date();

    const companySheet = workbook.addWorksheet('Empresa');
    this.addCompanyInfo(companySheet, data.company);

    if (reportType === ReportType.SALES || reportType === ReportType.COMPLETE) {
      this.addSalesSheet(workbook, data.data.sales || data.data);
    }

    if (reportType === ReportType.PRODUCTS || reportType === ReportType.COMPLETE) {
      this.addProductsSheet(workbook, data.data.products || data.data);
    }

    if (reportType === ReportType.INVOICES || reportType === ReportType.COMPLETE) {
      this.addInvoicesSheet(workbook, data.data.invoices || data.data);
    }

    if (reportType === ReportType.COMPLETE) {
      this.addBillsSheet(workbook, data.data.billsToPay);
      this.addCashClosuresSheet(workbook, data.data.cashClosures);
    }

    return (await workbook.xlsx.writeBuffer()) as any;
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

  private addSalesSheet(workbook: ExcelJS.Workbook, salesData: any) {
    const sheet = workbook.addWorksheet('Vendas');
    sheet.columns = [
      { header: 'Data', key: 'saleDate', width: 20 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Cliente', key: 'clientName', width: 30 },
      { header: 'Vendedor', key: 'sellerName', width: 30 },
      { header: 'Pagamento', key: 'paymentMethods', width: 30 },
    ];

  (salesData?.sales || []).forEach((sale: any) => {
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

  private addInvoicesSheet(workbook: ExcelJS.Workbook, invoicesData: any) {
    const sheet = workbook.addWorksheet('Notas Fiscais');
    sheet.columns = [
      { header: 'Tipo', key: 'documentType', width: 15 },
      { header: 'Número', key: 'documentNumber', width: 20 },
      { header: 'Chave', key: 'accessKey', width: 50 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Emissão', key: 'emissionDate', width: 20 },
    ];

    invoicesData.invoices.forEach((invoice: any) => {
      sheet.addRow(invoice);
    });

    sheet.getRow(1).font = { bold: true };
  }

  private addBillsSheet(workbook: ExcelJS.Workbook, billsData: any) {
    const sheet = workbook.addWorksheet('Contas a Pagar');
    sheet.columns = [
      { header: 'Título', key: 'title', width: 30 },
      { header: 'Vencimento', key: 'dueDate', width: 20 },
      { header: 'Valor', key: 'amount', width: 15 },
      { header: 'Pago', key: 'isPaid', width: 10 },
    ];

    billsData.bills.forEach((bill: any) => {
      sheet.addRow({
        ...bill,
        isPaid: bill.isPaid ? 'Sim' : 'Não',
      });
    });

    sheet.getRow(1).font = { bold: true };
  }

  private addCashClosuresSheet(workbook: ExcelJS.Workbook, closuresData: any) {
    const sheet = workbook.addWorksheet('Fechamentos');
    sheet.columns = [
      { header: 'Abertura', key: 'openingDate', width: 20 },
      { header: 'Fechamento', key: 'closingDate', width: 20 },
      { header: 'Total Vendas', key: 'totalSales', width: 20 },
      { header: 'Fechado', key: 'isClosed', width: 15 },
    ];

    closuresData.closures.forEach((closure: any) => {
      sheet.addRow({
        ...closure,
        isClosed: closure.isClosed ? 'Sim' : 'Não',
      });
    });

    sheet.getRow(1).font = { bold: true };
  }
}

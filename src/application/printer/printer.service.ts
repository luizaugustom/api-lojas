import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface PrinterConfig {
  type: 'usb' | 'network' | 'bluetooth';
  connectionInfo: string;
  name: string;
}

export interface ReceiptData {
  company: {
    name: string;
    cnpj: string;
    address?: string;
  };
  sale: {
    id: string;
    date: Date;
    total: number;
    paymentMethods: string[];
    change: number;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  seller: {
    name: string;
  };
  client?: {
    name?: string;
    cpfCnpj?: string;
  };
}

export interface CashClosureReportData {
  company: {
    name: string;
    cnpj: string;
  };
  closure: {
    openingDate: Date;
    closingDate: Date;
    openingAmount: number;
    closingAmount: number;
    totalSales: number;
    totalWithdrawals: number;
  };
  sales: Array<{
    id: string;
    date: Date;
    total: number;
    seller: string;
    paymentMethods: string[];
  }>;
}

@Injectable()
export class PrinterService {
  private readonly logger = new Logger(PrinterService.name);
  private readonly printerTimeout: number;
  private readonly printerRetryAttempts: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.printerTimeout = this.configService.get('PRINTER_TIMEOUT', 5000);
    this.printerRetryAttempts = this.configService.get('PRINTER_RETRY_ATTEMPTS', 3);
  }

  async discoverPrinters(): Promise<PrinterConfig[]> {
    const printers: PrinterConfig[] = [];

    try {
      // Discover USB printers
      const usbPrinters = await this.discoverUsbPrinters();
      printers.push(...usbPrinters);

      // Discover network printers
      const networkPrinters = await this.discoverNetworkPrinters();
      printers.push(...networkPrinters);

      // Discover Bluetooth printers
      const bluetoothPrinters = await this.discoverBluetoothPrinters();
      printers.push(...bluetoothPrinters);

      this.logger.log(`Discovered ${printers.length} printers`);
      return printers;
    } catch (error) {
      this.logger.error('Error discovering printers:', error);
      return [];
    }
  }

  private async discoverUsbPrinters(): Promise<PrinterConfig[]> {
    try {
      // This would use escpos-usb to discover USB printers
      // For now, return mock data
      return [
        {
          type: 'usb',
          name: 'USB Thermal Printer',
          connectionInfo: 'usb://vendor=1234;product=5678',
        },
      ];
    } catch (error) {
      this.logger.warn('Error discovering USB printers:', error);
      return [];
    }
  }

  private async discoverNetworkPrinters(): Promise<PrinterConfig[]> {
    try {
      // This would scan common network printer ports
      // For now, return mock data
      return [
        {
          type: 'network',
          name: 'Network Thermal Printer',
          connectionInfo: 'tcp://192.168.1.100:9100',
        },
      ];
    } catch (error) {
      this.logger.warn('Error discovering network printers:', error);
      return [];
    }
  }

  private async discoverBluetoothPrinters(): Promise<PrinterConfig[]> {
    try {
      // This would use node-bluetooth to discover Bluetooth printers
      // For now, return mock data
      return [
        {
          type: 'bluetooth',
          name: 'Bluetooth Thermal Printer',
          connectionInfo: 'bluetooth://00:11:22:33:44:55',
        },
      ];
    } catch (error) {
      this.logger.warn('Error discovering Bluetooth printers:', error);
      return [];
    }
  }

  async addPrinter(companyId: string, printerConfig: PrinterConfig) {
    try {
      const printer = await this.prisma.printer.create({
        data: {
          name: printerConfig.name,
          type: printerConfig.type,
          connectionInfo: printerConfig.connectionInfo,
          companyId,
        },
      });

      this.logger.log(`Printer added: ${printer.id} for company: ${companyId}`);
      return printer;
    } catch (error) {
      this.logger.error('Error adding printer:', error);
      throw error;
    }
  }

  async getPrinters(companyId?: string) {
    const where = companyId ? { companyId } : {};
    
    return this.prisma.printer.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updatePrinterStatus(id: string, status: { isConnected: boolean; paperStatus: string }) {
    return this.prisma.printer.update({
      where: { id },
      data: {
        isConnected: status.isConnected,
        paperStatus: status.paperStatus,
        lastStatusCheck: new Date(),
      },
    });
  }

  async printReceipt(receiptData: ReceiptData): Promise<boolean> {
    try {
      const receipt = this.generateReceiptContent(receiptData);
      const success = await this.sendToPrinter(receipt);
      
      if (success) {
        this.logger.log(`Receipt printed successfully for sale: ${receiptData.sale.id}`);
      }
      
      return success;
    } catch (error) {
      this.logger.error('Error printing receipt:', error);
      return false;
    }
  }

  async printCashClosureReport(reportData: CashClosureReportData): Promise<boolean> {
    try {
      const report = this.generateCashClosureReport(reportData);
      const success = await this.sendToPrinter(report);
      
      if (success) {
        this.logger.log('Cash closure report printed successfully');
      }
      
      return success;
    } catch (error) {
      this.logger.error('Error printing cash closure report:', error);
      return false;
    }
  }

  private generateReceiptContent(data: ReceiptData): string {
    const { company, sale, items, seller, client } = data;
    
    let receipt = '';
    
    // Header
    receipt += this.centerText(company.name) + '\n';
    receipt += this.centerText(`CNPJ: ${company.cnpj}`) + '\n';
    if (company.address) {
      receipt += this.centerText(company.address) + '\n';
    }
    receipt += this.centerText('--------------------------------') + '\n';
    receipt += this.centerText('CUPOM FISCAL') + '\n';
    receipt += this.centerText('--------------------------------') + '\n';
    
    // Sale info
    receipt += `Venda: ${sale.id}\n`;
    receipt += `Data: ${this.formatDate(sale.date)}\n`;
    receipt += `Vendedor: ${seller.name}\n`;
    
    if (client?.name) {
      receipt += `Cliente: ${client.name}\n`;
    }
    if (client?.cpfCnpj) {
      receipt += `CPF/CNPJ: ${client.cpfCnpj}\n`;
    }
    
    receipt += this.centerText('--------------------------------') + '\n';
    
    // Items
    receipt += 'ITEM DESCRIÇÃO           QTD  V.UNIT  TOTAL\n';
    receipt += '----------------------------------------\n';
    
    items.forEach((item, index) => {
      const itemNumber = (index + 1).toString().padStart(3);
      const description = item.name.substring(0, 20).padEnd(20);
      const quantity = item.quantity.toString().padStart(3);
      const unitPrice = this.formatCurrency(item.unitPrice).padStart(7);
      const total = this.formatCurrency(item.totalPrice).padStart(8);
      
      receipt += `${itemNumber} ${description} ${quantity} ${unitPrice} ${total}\n`;
    });
    
    receipt += '----------------------------------------\n';
    
    // Totals
    receipt += `TOTAL: ${this.formatCurrency(sale.total).padStart(40)}\n`;
    
    // Payment methods
    receipt += 'FORMAS DE PAGAMENTO:\n';
    sale.paymentMethods.forEach(method => {
      receipt += `- ${this.getPaymentMethodName(method)}\n`;
    });
    
    if (sale.change > 0) {
      receipt += `TROCO: ${this.formatCurrency(sale.change)}\n`;
    }
    
    receipt += this.centerText('--------------------------------') + '\n';
    receipt += this.centerText('OBRIGADO PELA PREFERÊNCIA!') + '\n';
    receipt += this.centerText('--------------------------------') + '\n\n\n';
    
    return receipt;
  }

  private generateCashClosureReport(data: CashClosureReportData): string {
    const { company, closure, sales } = data;
    
    let report = '';
    
    // Header
    report += this.centerText(company.name) + '\n';
    report += this.centerText(`CNPJ: ${company.cnpj}`) + '\n';
    report += this.centerText('--------------------------------') + '\n';
    report += this.centerText('RELATÓRIO DE FECHAMENTO') + '\n';
    report += this.centerText('--------------------------------') + '\n';
    
    // Closure info
    report += `Abertura: ${this.formatDate(closure.openingDate)}\n`;
    report += `Fechamento: ${this.formatDate(closure.closingDate)}\n`;
    report += `Valor inicial: ${this.formatCurrency(closure.openingAmount)}\n`;
    report += `Valor final: ${this.formatCurrency(closure.closingAmount)}\n`;
    report += `Total vendas: ${this.formatCurrency(closure.totalSales)}\n`;
    report += `Total saques: ${this.formatCurrency(closure.totalWithdrawals)}\n`;
    
    report += this.centerText('--------------------------------') + '\n';
    
    // Sales summary
    report += `Total de vendas: ${sales.length}\n`;
    
    // Payment methods summary
    const paymentSummary = sales.reduce((acc, sale) => {
      sale.paymentMethods.forEach(method => {
        acc[method] = (acc[method] || 0) + sale.total;
      });
      return acc;
    }, {});
    
    report += '\nRESUMO POR FORMA DE PAGAMENTO:\n';
    Object.entries(paymentSummary).forEach(([method, total]) => {
      report += `${this.getPaymentMethodName(method)}: ${this.formatCurrency(total as number)}\n`;
    });
    
    // Sellers summary
    const sellerSummary = sales.reduce((acc, sale) => {
      acc[sale.seller] = (acc[sale.seller] || 0) + sale.total;
      return acc;
    }, {});
    
    report += '\nRESUMO POR VENDEDOR:\n';
    Object.entries(sellerSummary).forEach(([seller, total]) => {
      report += `${seller}: ${this.formatCurrency(total as number)}\n`;
    });
    
    report += this.centerText('--------------------------------') + '\n';
    report += this.centerText('RELATÓRIO GERADO EM:') + '\n';
    report += this.centerText(this.formatDate(new Date())) + '\n';
    report += this.centerText('--------------------------------') + '\n\n\n';
    
    return report;
  }

  private async sendToPrinter(content: string): Promise<boolean> {
    // This would send the content to the actual printer
    // For now, just log the content
    this.logger.log('Printing content:');
    this.logger.log(content);
    
    // Simulate printing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  }

  private centerText(text: string, width = 32): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  private formatDate(date: Date): string {
    return date.toLocaleString('pt-BR');
  }

  private formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  private getPaymentMethodName(method: string): string {
    const methods = {
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'cash': 'Dinheiro',
      'pix': 'PIX',
      'installment': 'A Prazo',
    };
    
    return methods[method] || method;
  }

  async testPrinter(id: string): Promise<boolean> {
    try {
      const printer = await this.prisma.printer.findUnique({
        where: { id },
      });

      if (!printer) {
        throw new BadRequestException('Impressora não encontrada');
      }

      const testContent = this.generateTestContent();
      const success = await this.sendToPrinter(testContent);
      
      if (success) {
        await this.updatePrinterStatus(id, {
          isConnected: true,
          paperStatus: 'OK',
        });
      }
      
      return success;
    } catch (error) {
      this.logger.error('Error testing printer:', error);
      return false;
    }
  }

  private generateTestContent(): string {
    let content = '';
    content += this.centerText('--------------------------------') + '\n';
    content += this.centerText('TESTE DE IMPRESSÃO') + '\n';
    content += this.centerText('--------------------------------') + '\n';
    content += 'Esta é uma impressão de teste.\n';
    content += 'Se você está lendo isso, a impressora\n';
    content += 'está funcionando corretamente.\n';
    content += this.centerText('--------------------------------') + '\n';
    content += this.centerText('TESTE CONCLUÍDO') + '\n';
    content += this.centerText('--------------------------------') + '\n\n\n';
    return content;
  }

  async getPrinterStatus(id: string) {
    const printer = await this.prisma.printer.findUnique({
      where: { id },
    });

    if (!printer) {
      throw new BadRequestException('Impressora não encontrada');
    }

    return {
      id: printer.id,
      name: printer.name,
      type: printer.type,
      isConnected: printer.isConnected,
      paperStatus: printer.paperStatus,
      lastStatusCheck: printer.lastStatusCheck,
    };
  }
}

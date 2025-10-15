import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface N8nWebhookData {
  event: string;
  data: any;
  timestamp: Date;
  source: string;
}

@Injectable()
export class N8nService {
  private readonly logger = new Logger(N8nService.name);
  private readonly n8nWebhookUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.n8nWebhookUrl = this.configService.get('N8N_WEBHOOK_URL', 'https://your-n8n-instance.com/webhook');
  }

  async sendWebhook(webhookData: N8nWebhookData): Promise<boolean> {
    try {
      this.logger.log(`Sending webhook to N8N: ${webhookData.event}`);

      // Send webhook to N8N
      const response = await axios.post(this.n8nWebhookUrl, webhookData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      if (response.status === 200 || response.status === 201) {
        this.logger.log('Webhook sent successfully to N8N');
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Error sending webhook to N8N:', error.message);
      return false;
    }
  }

  async notifySaleCreated(saleData: any): Promise<boolean> {
    const webhookData: N8nWebhookData = {
      event: 'sale.created',
      data: {
        id: saleData.id,
        companyId: saleData.companyId,
        total: saleData.total,
        clientName: saleData.clientName,
        clientCpfCnpj: saleData.clientCpfCnpj,
        paymentMethods: saleData.paymentMethods,
        saleDate: saleData.saleDate,
        items: saleData.items,
        seller: saleData.seller,
      },
      timestamp: new Date(),
      source: 'api-lojas-saas',
    };

    return this.sendWebhook(webhookData);
  }

  async notifyProductLowStock(productData: any): Promise<boolean> {
    const webhookData: N8nWebhookData = {
      event: 'product.low_stock',
      data: {
        id: productData.id,
        companyId: productData.companyId,
        name: productData.name,
        barcode: productData.barcode,
        stockQuantity: productData.stockQuantity,
        category: productData.category,
      },
      timestamp: new Date(),
      source: 'api-lojas-saas',
    };

    return this.sendWebhook(webhookData);
  }

  async notifyBillDueSoon(billData: any): Promise<boolean> {
    const webhookData: N8nWebhookData = {
      event: 'bill.due_soon',
      data: {
        id: billData.id,
        companyId: billData.companyId,
        title: billData.title,
        amount: billData.amount,
        dueDate: billData.dueDate,
        barcode: billData.barcode,
      },
      timestamp: new Date(),
      source: 'api-lojas-saas',
    };

    return this.sendWebhook(webhookData);
  }

  async notifyCashClosureClosed(closureData: any): Promise<boolean> {
    const webhookData: N8nWebhookData = {
      event: 'cash_closure.closed',
      data: {
        id: closureData.id,
        companyId: closureData.companyId,
        openingDate: closureData.openingDate,
        closingDate: closureData.closingDate,
        openingAmount: closureData.openingAmount,
        closingAmount: closureData.closingAmount,
        totalSales: closureData.totalSales,
        totalWithdrawals: closureData.totalWithdrawals,
        salesCount: closureData.sales?.length || 0,
      },
      timestamp: new Date(),
      source: 'api-lojas-saas',
    };

    return this.sendWebhook(webhookData);
  }

  async notifyFiscalDocumentGenerated(documentData: any): Promise<boolean> {
    const webhookData: N8nWebhookData = {
      event: 'fiscal_document.generated',
      data: {
        id: documentData.id,
        companyId: documentData.companyId,
        documentType: documentData.documentType,
        documentNumber: documentData.documentNumber,
        accessKey: documentData.accessKey,
        status: documentData.status,
        emissionDate: documentData.emissionDate,
        pdfUrl: documentData.pdfUrl,
      },
      timestamp: new Date(),
      source: 'api-lojas-saas',
    };

    return this.sendWebhook(webhookData);
  }

  async notifyCustomerCreated(customerData: any): Promise<boolean> {
    const webhookData: N8nWebhookData = {
      event: 'customer.created',
      data: {
        id: customerData.id,
        companyId: customerData.companyId,
        name: customerData.name,
        phone: customerData.phone,
        cpfCnpj: customerData.cpfCnpj,
        email: customerData.email,
        createdAt: customerData.createdAt,
      },
      timestamp: new Date(),
      source: 'api-lojas-saas',
    };

    return this.sendWebhook(webhookData);
  }

  async notifySellerCreated(sellerData: any): Promise<boolean> {
    const webhookData: N8nWebhookData = {
      event: 'seller.created',
      data: {
        id: sellerData.id,
        companyId: sellerData.companyId,
        name: sellerData.name,
        email: sellerData.email,
        phone: sellerData.phone,
        createdAt: sellerData.createdAt,
      },
      timestamp: new Date(),
      source: 'api-lojas-saas',
    };

    return this.sendWebhook(webhookData);
  }

  async notifyCompanyCreated(companyData: any): Promise<boolean> {
    const webhookData: N8nWebhookData = {
      event: 'company.created',
      data: {
        id: companyData.id,
        name: companyData.name,
        cnpj: companyData.cnpj,
        email: companyData.email,
        phone: companyData.phone,
        city: companyData.city,
        state: companyData.state,
        createdAt: companyData.createdAt,
      },
      timestamp: new Date(),
      source: 'api-lojas-saas',
    };

    return this.sendWebhook(webhookData);
  }

  async testWebhook(): Promise<boolean> {
    const webhookData: N8nWebhookData = {
      event: 'test',
      data: {
        message: 'Test webhook from API Lojas SaaS',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
      source: 'api-lojas-saas',
    };

    return this.sendWebhook(webhookData);
  }

  getWebhookUrl(): string {
    return this.n8nWebhookUrl;
  }

  async getWebhookStatus(): Promise<{ status: string; url: string; lastTest?: Date }> {
    // In a real implementation, you might want to store the last test time
    return {
      status: 'configured',
      url: this.n8nWebhookUrl,
    };
  }
}

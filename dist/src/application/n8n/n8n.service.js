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
var N8nService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let N8nService = N8nService_1 = class N8nService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(N8nService_1.name);
        this.n8nWebhookUrl = this.configService.get('N8N_WEBHOOK_URL', 'https://your-n8n-instance.com/webhook');
    }
    async sendWebhook(webhookData) {
        try {
            this.logger.log(`Sending webhook to N8N: ${webhookData.event}`);
            const response = await axios_1.default.post(this.n8nWebhookUrl, webhookData, {
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
        }
        catch (error) {
            this.logger.error('Error sending webhook to N8N:', error.message);
            return false;
        }
    }
    async notifySaleCreated(saleData) {
        const webhookData = {
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
    async notifyProductLowStock(productData) {
        const webhookData = {
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
    async notifyBillDueSoon(billData) {
        const webhookData = {
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
    async notifyCashClosureClosed(closureData) {
        const webhookData = {
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
    async notifyFiscalDocumentGenerated(documentData) {
        const webhookData = {
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
    async notifyCustomerCreated(customerData) {
        const webhookData = {
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
    async notifySellerCreated(sellerData) {
        const webhookData = {
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
    async notifyCompanyCreated(companyData) {
        const webhookData = {
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
    async testWebhook() {
        const webhookData = {
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
    getWebhookUrl() {
        return this.n8nWebhookUrl;
    }
    async getWebhookStatus() {
        return {
            status: 'configured',
            url: this.n8nWebhookUrl,
        };
    }
};
exports.N8nService = N8nService;
exports.N8nService = N8nService = N8nService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], N8nService);
//# sourceMappingURL=n8n.service.js.map
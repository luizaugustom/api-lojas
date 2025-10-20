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
var PrinterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrinterService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
let PrinterService = PrinterService_1 = class PrinterService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(PrinterService_1.name);
        this.printerTimeout = this.configService.get('PRINTER_TIMEOUT', 5000);
        this.printerRetryAttempts = this.configService.get('PRINTER_RETRY_ATTEMPTS', 3);
    }
    async discoverPrinters() {
        const printers = [];
        try {
            const usbPrinters = await this.discoverUsbPrinters();
            printers.push(...usbPrinters);
            const networkPrinters = await this.discoverNetworkPrinters();
            printers.push(...networkPrinters);
            const bluetoothPrinters = await this.discoverBluetoothPrinters();
            printers.push(...bluetoothPrinters);
            this.logger.log(`Discovered ${printers.length} printers`);
            return printers;
        }
        catch (error) {
            this.logger.error('Error discovering printers:', error);
            return [];
        }
    }
    async discoverUsbPrinters() {
        try {
            return [
                {
                    type: 'usb',
                    name: 'USB Thermal Printer',
                    connectionInfo: 'usb://vendor=1234;product=5678',
                },
            ];
        }
        catch (error) {
            this.logger.warn('Error discovering USB printers:', error);
            return [];
        }
    }
    async discoverNetworkPrinters() {
        try {
            return [
                {
                    type: 'network',
                    name: 'Network Thermal Printer',
                    connectionInfo: 'tcp://192.168.1.100:9100',
                },
            ];
        }
        catch (error) {
            this.logger.warn('Error discovering network printers:', error);
            return [];
        }
    }
    async discoverBluetoothPrinters() {
        try {
            return [
                {
                    type: 'bluetooth',
                    name: 'Bluetooth Thermal Printer',
                    connectionInfo: 'bluetooth://00:11:22:33:44:55',
                },
            ];
        }
        catch (error) {
            this.logger.warn('Error discovering Bluetooth printers:', error);
            return [];
        }
    }
    async addPrinter(companyId, printerConfig) {
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
        }
        catch (error) {
            this.logger.error('Error adding printer:', error);
            throw error;
        }
    }
    async getPrinters(companyId) {
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
    async updatePrinterStatus(id, status) {
        return this.prisma.printer.update({
            where: { id },
            data: {
                isConnected: status.isConnected,
                paperStatus: status.paperStatus,
                lastStatusCheck: new Date(),
            },
        });
    }
    async printReceipt(receiptData) {
        try {
            const receipt = this.generateReceiptContent(receiptData);
            const success = await this.sendToPrinter(receipt);
            if (success) {
                this.logger.log(`Receipt printed successfully for sale: ${receiptData.sale.id}`);
            }
            return success;
        }
        catch (error) {
            this.logger.error('Error printing receipt:', error);
            return false;
        }
    }
    async printCashClosureReport(reportData) {
        try {
            const report = this.generateCashClosureReport(reportData);
            const success = await this.sendToPrinter(report);
            if (success) {
                this.logger.log('Cash closure report printed successfully');
            }
            return success;
        }
        catch (error) {
            this.logger.error('Error printing cash closure report:', error);
            return false;
        }
    }
    async printNFCe(nfceData) {
        try {
            const nfce = this.generateNFCeContent(nfceData);
            const success = await this.sendToPrinter(nfce);
            if (success) {
                this.logger.log(`NFCe printed successfully for sale: ${nfceData.sale.id}`);
            }
            return success;
        }
        catch (error) {
            this.logger.error('Error printing NFCe:', error);
            return false;
        }
    }
    generateReceiptContent(data) {
        const { company, sale, items, seller, client } = data;
        let receipt = '';
        receipt += this.centerText(company.name) + '\n';
        receipt += this.centerText(`CNPJ: ${company.cnpj}`) + '\n';
        if (company.address) {
            receipt += this.centerText(company.address) + '\n';
        }
        receipt += this.centerText('--------------------------------') + '\n';
        receipt += this.centerText('CUPOM FISCAL') + '\n';
        receipt += this.centerText('--------------------------------') + '\n';
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
        receipt += `TOTAL: ${this.formatCurrency(sale.total).padStart(40)}\n`;
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
    generateCashClosureReport(data) {
        const { company, closure, sales } = data;
        let report = '';
        report += this.centerText(company.name) + '\n';
        report += this.centerText(`CNPJ: ${company.cnpj}`) + '\n';
        report += this.centerText('--------------------------------') + '\n';
        report += this.centerText('RELATÓRIO DE FECHAMENTO') + '\n';
        report += this.centerText('--------------------------------') + '\n';
        report += `Abertura: ${this.formatDate(closure.openingDate)}\n`;
        report += `Fechamento: ${this.formatDate(closure.closingDate)}\n`;
        report += `Valor inicial: ${this.formatCurrency(closure.openingAmount)}\n`;
        report += `Valor final: ${this.formatCurrency(closure.closingAmount)}\n`;
        report += `Total vendas: ${this.formatCurrency(closure.totalSales)}\n`;
        report += `Total saques: ${this.formatCurrency(closure.totalWithdrawals)}\n`;
        report += this.centerText('--------------------------------') + '\n';
        report += `Total de vendas: ${sales.length}\n`;
        const paymentSummary = sales.reduce((acc, sale) => {
            sale.paymentMethods.forEach(method => {
                acc[method] = (acc[method] || 0) + sale.total;
            });
            return acc;
        }, {});
        report += '\nRESUMO POR FORMA DE PAGAMENTO:\n';
        Object.entries(paymentSummary).forEach(([method, total]) => {
            report += `${this.getPaymentMethodName(method)}: ${this.formatCurrency(total)}\n`;
        });
        const sellerSummary = sales.reduce((acc, sale) => {
            acc[sale.seller] = (acc[sale.seller] || 0) + sale.total;
            return acc;
        }, {});
        report += '\nRESUMO POR VENDEDOR:\n';
        Object.entries(sellerSummary).forEach(([seller, total]) => {
            report += `${seller}: ${this.formatCurrency(total)}\n`;
        });
        report += this.centerText('--------------------------------') + '\n';
        report += this.centerText('RELATÓRIO GERADO EM:') + '\n';
        report += this.centerText(this.formatDate(new Date())) + '\n';
        report += this.centerText('--------------------------------') + '\n\n\n';
        return report;
    }
    generateNFCeContent(data) {
        const { company, fiscal, sale, items, customFooter } = data;
        let nfce = '';
        nfce += this.centerText(company.name) + '\n';
        nfce += this.centerText(`CNPJ: ${company.cnpj}`) + '\n';
        if (company.address) {
            nfce += this.centerText(company.address) + '\n';
        }
        if (company.phone) {
            nfce += this.centerText(`Tel: ${company.phone}`) + '\n';
        }
        if (company.email) {
            nfce += this.centerText(`Email: ${company.email}`) + '\n';
        }
        nfce += this.centerText('--------------------------------') + '\n';
        nfce += this.centerText('NOTA FISCAL DO CONSUMIDOR') + '\n';
        nfce += this.centerText('ELETRÔNICA - NFCe') + '\n';
        nfce += this.centerText('--------------------------------') + '\n';
        nfce += `Número: ${fiscal.documentNumber}\n`;
        nfce += `Chave de Acesso:\n${fiscal.accessKey}\n`;
        nfce += `Data/Hora Emissão: ${this.formatDate(fiscal.emissionDate)}\n`;
        nfce += `Status: ${fiscal.status}\n`;
        nfce += this.centerText('--------------------------------') + '\n';
        nfce += `Venda: ${sale.id}\n`;
        nfce += `Data: ${this.formatDate(sale.saleDate)}\n`;
        nfce += `Vendedor: ${sale.sellerName}\n`;
        if (sale.clientName) {
            nfce += `Cliente: ${sale.clientName}\n`;
        }
        if (sale.clientCpfCnpj) {
            nfce += `CPF/CNPJ: ${sale.clientCpfCnpj}\n`;
        }
        nfce += this.centerText('--------------------------------') + '\n';
        nfce += 'ITEM DESCRIÇÃO           QTD  V.UNIT  TOTAL\n';
        nfce += '----------------------------------------\n';
        items.forEach((item, index) => {
            const itemNumber = (index + 1).toString().padStart(3);
            const description = item.productName.substring(0, 20).padEnd(20);
            const quantity = item.quantity.toString().padStart(3);
            const unitPrice = this.formatCurrency(item.unitPrice).padStart(7);
            const totalPrice = this.formatCurrency(item.totalPrice).padStart(8);
            nfce += `${itemNumber} ${description} ${quantity} ${unitPrice} ${totalPrice}\n`;
            if (item.barcode) {
                nfce += `     Código: ${item.barcode}\n`;
            }
        });
        nfce += this.centerText('--------------------------------') + '\n';
        nfce += 'FORMA DE PAGAMENTO:\n';
        sale.paymentMethod.forEach(method => {
            nfce += `- ${this.getPaymentMethodName(method)}\n`;
        });
        if (sale.change > 0) {
            nfce += `Troco: ${this.formatCurrency(sale.change)}\n`;
        }
        nfce += this.centerText('--------------------------------') + '\n';
        nfce += `TOTAL: ${this.formatCurrency(sale.total)}\n`;
        nfce += this.centerText('--------------------------------') + '\n';
        nfce += this.centerText('CONSULTE A CHAVE DE ACESSO') + '\n';
        nfce += this.centerText('NO SITE DA RECEITA FEDERAL') + '\n';
        nfce += this.centerText('OU USE O QR CODE ABAIXO') + '\n';
        nfce += this.centerText('--------------------------------') + '\n';
        if (customFooter) {
            nfce += this.centerText('--------------------------------') + '\n';
            nfce += this.centerText(customFooter) + '\n';
            nfce += this.centerText('--------------------------------') + '\n';
        }
        nfce += this.centerText('OBRIGADO PELA PREFERÊNCIA!') + '\n';
        nfce += this.centerText('VOLTE SEMPRE!') + '\n';
        nfce += this.centerText('--------------------------------') + '\n';
        nfce += this.centerText(this.formatDate(new Date())) + '\n';
        nfce += this.centerText('--------------------------------') + '\n\n\n';
        return nfce;
    }
    async sendToPrinter(content) {
        this.logger.log('Printing content:');
        this.logger.log(content);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
    }
    centerText(text, width = 32) {
        const padding = Math.max(0, Math.floor((width - text.length) / 2));
        return ' '.repeat(padding) + text;
    }
    formatDate(date) {
        return date.toLocaleString('pt-BR');
    }
    formatCurrency(value) {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }
    getPaymentMethodName(method) {
        const methods = {
            'credit_card': 'Cartão de Crédito',
            'debit_card': 'Cartão de Débito',
            'cash': 'Dinheiro',
            'pix': 'PIX',
            'installment': 'A Prazo',
        };
        return methods[method] || method;
    }
    async testPrinter(id) {
        try {
            const printer = await this.prisma.printer.findUnique({
                where: { id },
            });
            if (!printer) {
                throw new common_1.BadRequestException('Impressora não encontrada');
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
        }
        catch (error) {
            this.logger.error('Error testing printer:', error);
            return false;
        }
    }
    generateTestContent() {
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
    async getPrinterStatus(id) {
        const printer = await this.prisma.printer.findUnique({
            where: { id },
        });
        if (!printer) {
            throw new common_1.BadRequestException('Impressora não encontrada');
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
    async updateCustomFooter(companyId, customFooter) {
        try {
            await this.prisma.company.update({
                where: { id: companyId },
                data: { customFooter },
            });
            this.logger.log(`Custom footer updated for company: ${companyId}`);
        }
        catch (error) {
            this.logger.error('Error updating custom footer:', error);
            throw new common_1.BadRequestException('Erro ao atualizar footer personalizado');
        }
    }
    async getCustomFooter(companyId) {
        try {
            const company = await this.prisma.company.findUnique({
                where: { id: companyId },
                select: { customFooter: true },
            });
            return company?.customFooter || null;
        }
        catch (error) {
            this.logger.error('Error getting custom footer:', error);
            return null;
        }
    }
};
exports.PrinterService = PrinterService;
exports.PrinterService = PrinterService = PrinterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], PrinterService);
//# sourceMappingURL=printer.service.js.map
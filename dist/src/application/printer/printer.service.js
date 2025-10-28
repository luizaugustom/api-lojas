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
const printer_driver_service_1 = require("../../shared/services/printer-driver.service");
const thermal_printer_service_1 = require("../../shared/services/thermal-printer.service");
const QRCode = require("qrcode");
let PrinterService = PrinterService_1 = class PrinterService {
    constructor(configService, prisma, driverService, thermalPrinter) {
        this.configService = configService;
        this.prisma = prisma;
        this.driverService = driverService;
        this.thermalPrinter = thermalPrinter;
        this.logger = new common_1.Logger(PrinterService_1.name);
        this.lastPrinterCheck = null;
        this.availablePrinters = [];
        this.printerTimeout = this.configService.get('PRINTER_TIMEOUT', 5000);
        this.printerRetryAttempts = this.configService.get('PRINTER_RETRY_ATTEMPTS', 3);
        this.initializePrinters();
    }
    async initializePrinters() {
        try {
            this.logger.log('Inicializando sistema de impressão...');
            this.availablePrinters = await this.driverService.detectSystemPrinters();
            this.lastPrinterCheck = new Date();
            this.logger.log(`${this.availablePrinters.length} impressora(s) detectada(s)`);
            const drivers = await this.driverService.checkThermalPrinterDrivers();
            const installedDrivers = drivers.filter(d => d.installed);
            this.logger.log(`${installedDrivers.length} driver(s) de impressora térmica instalado(s)`);
            await this.syncPrintersWithDatabase();
        }
        catch (error) {
            this.logger.error('Erro ao inicializar impressoras:', error);
        }
    }
    async syncPrintersWithDatabase() {
        try {
            for (const sysPrinter of this.availablePrinters) {
                const existing = await this.prisma.printer.findFirst({
                    where: {
                        name: sysPrinter.name,
                    },
                });
                if (!existing) {
                    this.logger.log(`Nova impressora detectada: ${sysPrinter.name}`);
                }
                else {
                    await this.prisma.printer.update({
                        where: { id: existing.id },
                        data: {
                            isConnected: sysPrinter.status === 'online',
                            paperStatus: sysPrinter.status === 'paper-empty' ? 'EMPTY' : 'OK',
                            lastStatusCheck: new Date(),
                        },
                    });
                }
            }
        }
        catch (error) {
            this.logger.error('Erro ao sincronizar impressoras:', error);
        }
    }
    async checkPrintersStatus() {
        try {
            this.logger.debug('Verificando status das impressoras...');
            this.availablePrinters = await this.driverService.detectSystemPrinters();
            this.lastPrinterCheck = new Date();
            const dbPrinters = await this.prisma.printer.findMany();
            for (const dbPrinter of dbPrinters) {
                const sysPrinter = this.availablePrinters.find(p => p.name === dbPrinter.name);
                if (sysPrinter) {
                    const status = await this.thermalPrinter.checkPrinterStatus(dbPrinter.name);
                    await this.prisma.printer.update({
                        where: { id: dbPrinter.id },
                        data: {
                            isConnected: status.online,
                            paperStatus: status.paperOk ? 'OK' : status.error ? 'ERROR' : 'LOW',
                            lastStatusCheck: new Date(),
                        },
                    });
                }
                else {
                    await this.prisma.printer.update({
                        where: { id: dbPrinter.id },
                        data: {
                            isConnected: false,
                            paperStatus: 'ERROR',
                            lastStatusCheck: new Date(),
                        },
                    });
                }
            }
            this.logger.debug('Verificação de impressoras concluída');
        }
        catch (error) {
            this.logger.error('Erro ao verificar status das impressoras:', error);
        }
    }
    async discoverPrinters() {
        try {
            this.logger.log('Descobrindo impressoras no sistema...');
            const systemPrinters = await this.driverService.detectSystemPrinters();
            this.availablePrinters = systemPrinters;
            this.lastPrinterCheck = new Date();
            const printers = systemPrinters.map(sp => ({
                name: sp.name,
                type: sp.connection,
                connectionInfo: sp.port,
            }));
            this.logger.log(`${printers.length} impressora(s) descoberta(s)`);
            return printers;
        }
        catch (error) {
            this.logger.error('Erro ao descobrir impressoras:', error);
            return [];
        }
    }
    async getAvailablePrinters() {
        if (!this.lastPrinterCheck ||
            (new Date().getTime() - this.lastPrinterCheck.getTime()) > 60000) {
            this.availablePrinters = await this.driverService.detectSystemPrinters();
            this.lastPrinterCheck = new Date();
        }
        return this.availablePrinters;
    }
    async checkDrivers() {
        try {
            this.logger.log('Verificando drivers de impressora...');
            const drivers = await this.driverService.checkThermalPrinterDrivers();
            const missingDrivers = drivers.filter(d => !d.installed);
            if (missingDrivers.length === 0) {
                return {
                    allInstalled: true,
                    drivers,
                    message: 'Todos os drivers necessários estão instalados',
                };
            }
            return {
                allInstalled: false,
                drivers,
                message: `${missingDrivers.length} driver(s) faltando`,
            };
        }
        catch (error) {
            this.logger.error('Erro ao verificar drivers:', error);
            return {
                allInstalled: false,
                drivers: [],
                message: 'Erro ao verificar drivers',
            };
        }
    }
    async installDrivers() {
        try {
            this.logger.log('Instalando drivers de impressora...');
            const installResult = await this.driverService.installThermalPrinterDrivers();
            return {
                success: installResult.success,
                message: installResult.message,
                errors: installResult.errors,
            };
        }
        catch (error) {
            this.logger.error('Erro ao instalar drivers:', error);
            return {
                success: false,
                message: 'Erro ao instalar drivers',
                errors: [error.message],
            };
        }
    }
    async checkAndInstallDrivers() {
        try {
            this.logger.log('Verificando drivers de impressora...');
            const drivers = await this.driverService.checkThermalPrinterDrivers();
            const missingDrivers = drivers.filter(d => !d.installed);
            if (missingDrivers.length === 0) {
                return {
                    driversInstalled: true,
                    message: 'Todos os drivers necessários estão instalados',
                    errors: [],
                };
            }
            this.logger.log(`${missingDrivers.length} driver(s) faltando. Tentando instalar...`);
            const installResult = await this.driverService.installThermalPrinterDrivers();
            return {
                driversInstalled: installResult.success,
                message: installResult.message,
                errors: installResult.errors,
            };
        }
        catch (error) {
            this.logger.error('Erro ao verificar/instalar drivers:', error);
            return {
                driversInstalled: false,
                message: 'Erro ao verificar drivers',
                errors: [error.message],
            };
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
    async printReceipt(receiptData, companyId) {
        try {
            const receipt = this.generateReceiptContent(receiptData);
            const success = await this.sendToPrinter(receipt, companyId);
            if (success) {
                this.logger.log(`Receipt printed successfully for sale: ${receiptData.sale.id}`);
            }
            else {
                this.logger.warn(`Receipt printing failed for sale: ${receiptData.sale.id}`);
            }
            return success;
        }
        catch (error) {
            this.logger.error('Error printing receipt:', error);
            return false;
        }
    }
    async printCashClosureReport(reportData, companyId) {
        try {
            const report = this.generateCashClosureReport(reportData);
            const success = await this.sendToPrinter(report, companyId);
            if (success) {
                this.logger.log('Cash closure report printed successfully');
            }
            else {
                this.logger.warn('Cash closure report printing failed');
            }
            return success;
        }
        catch (error) {
            this.logger.error('Error printing cash closure report:', error);
            return false;
        }
    }
    async printNFCe(nfceData, companyId) {
        try {
            this.logger.log(`Iniciando impressão de NFCe para venda: ${nfceData.sale.id}`);
            const nfce = await this.generateNFCeContent(nfceData);
            const success = await this.sendToPrinter(nfce, companyId);
            if (success) {
                this.logger.log(`✅ NFCe impressa com sucesso para venda: ${nfceData.sale.id}`);
            }
            else {
                this.logger.warn(`⚠️ Falha ao imprimir NFCe para venda: ${nfceData.sale.id}. Verifique status da impressora.`);
            }
            return success;
        }
        catch (error) {
            this.logger.error(`❌ Erro ao imprimir NFCe para venda ${nfceData.sale.id}:`, error);
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
        receipt += this.centerText('MONT TECNOLOGIA, SEU PARCEIRO') + '\n';
        receipt += this.centerText('DE SUCESSO !! 🚀🚀') + '\n';
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
    async generateNFCeContent(data) {
        const { company, fiscal, sale, items, customFooter } = data;
        let nfce = '';
        nfce += this.centerText(company.name.toUpperCase()) + '\n';
        nfce += this.centerText(`CNPJ: ${this.formatCnpj(company.cnpj)}`) + '\n';
        if (company.inscricaoEstadual) {
            nfce += this.centerText(`IE: ${company.inscricaoEstadual}`) + '\n';
        }
        if (company.address) {
            nfce += this.centerText(company.address) + '\n';
        }
        if (company.phone) {
            nfce += this.centerText(`Tel: ${company.phone}`) + '\n';
        }
        if (company.email) {
            nfce += this.centerText(`Email: ${company.email}`) + '\n';
        }
        nfce += this.centerText('================================') + '\n';
        nfce += this.centerText('DOCUMENTO AUXILIAR DA NOTA') + '\n';
        nfce += this.centerText('FISCAL DE CONSUMIDOR ELETRONICA') + '\n';
        nfce += this.centerText('NFC-e') + '\n';
        nfce += this.centerText('================================') + '\n';
        nfce += this.centerText('NÃO PERMITE APROVEITAMENTO') + '\n';
        nfce += this.centerText('DE CRÉDITO FISCAL DE ICMS') + '\n';
        nfce += this.centerText('================================') + '\n\n';
        nfce += `Nº: ${fiscal.documentNumber}`;
        if (fiscal.serieNumber) {
            nfce += ` Série: ${fiscal.serieNumber}`;
        }
        nfce += '\n';
        nfce += `Emissão: ${this.formatDate(fiscal.emissionDate)}\n`;
        nfce += '\n';
        nfce += this.centerText('CHAVE DE ACESSO') + '\n';
        nfce += this.formatAccessKey(fiscal.accessKey) + '\n';
        nfce += '\n';
        if (fiscal.qrCodeUrl) {
            nfce += this.centerText('CONSULTE PELA CHAVE DE ACESSO EM') + '\n';
            nfce += this.centerText('www.nfce.fazenda.gov.br/consultanfce') + '\n';
            nfce += this.centerText('OU UTILIZE O QR CODE ABAIXO:') + '\n';
            nfce += '\n';
            try {
                const qrCodeAscii = await this.generateQRCodeAscii(fiscal.qrCodeUrl);
                nfce += qrCodeAscii + '\n';
            }
            catch (error) {
                this.logger.warn('Erro ao gerar QR Code, usando placeholder:', error);
                nfce += this.centerText('[QR CODE]') + '\n';
                nfce += this.centerText(fiscal.qrCodeUrl.substring(0, 32)) + '\n';
            }
            nfce += '\n';
        }
        if (sale.clientName || sale.clientCpfCnpj) {
            nfce += this.centerText('================================') + '\n';
            nfce += this.centerText('CONSUMIDOR') + '\n';
            nfce += this.centerText('================================') + '\n';
            if (sale.clientName) {
                nfce += `Nome: ${sale.clientName}\n`;
            }
            if (sale.clientCpfCnpj) {
                nfce += `CPF/CNPJ: ${this.formatCpfCnpj(sale.clientCpfCnpj)}\n`;
            }
        }
        nfce += '\n';
        nfce += this.centerText('================================') + '\n';
        nfce += this.centerText('PRODUTOS/SERVIÇOS') + '\n';
        nfce += this.centerText('================================') + '\n';
        nfce += 'COD  DESCRICAO         QTD  VL.UNIT  VL.TOTAL\n';
        nfce += '----------------------------------------\n';
        items.forEach((item, index) => {
            const itemNumber = (index + 1).toString().padStart(3);
            const description = item.productName.substring(0, 17).padEnd(17);
            const quantity = item.quantity.toString().padStart(3);
            const unitPrice = this.formatCurrency(item.unitPrice).padStart(8);
            const totalPrice = this.formatCurrency(item.totalPrice).padStart(9);
            nfce += `${itemNumber}  ${description}${quantity} ${unitPrice} ${totalPrice}\n`;
            if (item.barcode) {
                nfce += `     EAN: ${item.barcode}`;
                if (item.ncm) {
                    nfce += ` NCM: ${item.ncm}`;
                }
                nfce += '\n';
            }
            if (item.cfop) {
                nfce += `     CFOP: ${item.cfop}\n`;
            }
        });
        nfce += '----------------------------------------\n';
        nfce += `Qtd. Total de Itens: ${items.length}\n`;
        nfce += '\n';
        nfce += `VALOR TOTAL: ${this.formatCurrency(sale.total).padStart(30)}\n`;
        nfce += '\n';
        nfce += this.centerText('================================') + '\n';
        nfce += this.centerText('FORMA DE PAGAMENTO') + '\n';
        nfce += this.centerText('================================') + '\n';
        sale.paymentMethod.forEach(method => {
            nfce += `${this.getPaymentMethodName(method)}\n`;
        });
        if (sale.change > 0) {
            nfce += '\n';
            nfce += `Valor Recebido: ${this.formatCurrency(sale.total + sale.change).padStart(22)}\n`;
            nfce += `Troco: ${this.formatCurrency(sale.change).padStart(33)}\n`;
        }
        nfce += '\n';
        nfce += this.centerText('================================') + '\n';
        nfce += this.centerText('INFORMAÇÃO DOS TRIBUTOS') + '\n';
        nfce += this.centerText('================================') + '\n';
        const estimatedTaxes = sale.totalTaxes || (sale.total * 0.1665);
        nfce += `Valor Aproximado dos Tributos:\n`;
        nfce += `${this.formatCurrency(estimatedTaxes).padStart(40)}\n`;
        nfce += `(${((estimatedTaxes / sale.total) * 100).toFixed(2)}% do valor)\n`;
        nfce += '\n';
        nfce += 'Fonte: IBPT - Instituto Brasileiro de\n';
        nfce += 'Planejamento e Tributação\n';
        nfce += 'Lei 12.741/2012 - Lei da Transparência\n';
        nfce += '\n';
        nfce += this.centerText('================================') + '\n';
        if (fiscal.protocol) {
            nfce += this.centerText('NFC-e AUTORIZADA') + '\n';
            nfce += `Protocolo: ${fiscal.protocol}\n`;
            nfce += `Data Autorização: ${this.formatDate(fiscal.emissionDate)}\n`;
        }
        else {
            nfce += this.centerText(`STATUS: ${fiscal.status}`) + '\n';
        }
        nfce += this.centerText('================================') + '\n';
        nfce += '\n';
        if (customFooter) {
            nfce += this.centerText('--------------------------------') + '\n';
            nfce += this.wrapText(customFooter, 32);
            nfce += this.centerText('--------------------------------') + '\n';
        }
        nfce += '\n';
        nfce += `Vendedor: ${sale.sellerName}\n`;
        nfce += `ID Venda: ${sale.id}\n`;
        nfce += '\n';
        nfce += this.centerText('================================') + '\n';
        nfce += this.centerText('OBRIGADO PELA PREFERÊNCIA!') + '\n';
        nfce += this.centerText('VOLTE SEMPRE!') + '\n';
        nfce += this.centerText('================================') + '\n';
        nfce += this.centerText('Sistema: MontShop') + '\n';
        nfce += this.centerText(this.formatDate(new Date())) + '\n';
        nfce += '\n\n\n';
        return nfce;
    }
    async sendToPrinter(content, companyId) {
        try {
            let printerName = null;
            let printerSource = 'não encontrada';
            if (companyId) {
                const dbPrinter = await this.prisma.printer.findFirst({
                    where: {
                        companyId,
                        isConnected: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                });
                if (dbPrinter) {
                    printerName = dbPrinter.name;
                    printerSource = 'banco de dados (empresa)';
                    this.logger.log(`Impressora encontrada no banco: ${printerName}`);
                }
            }
            if (!printerName) {
                this.logger.log('Buscando impressora padrão do sistema...');
                const systemPrinters = await this.getAvailablePrinters();
                if (systemPrinters.length === 0) {
                    this.logger.warn('⚠️ Nenhuma impressora detectada no sistema');
                    return false;
                }
                const defaultPrinter = systemPrinters.find(p => p.isDefault && p.status === 'online');
                const anyOnlinePrinter = systemPrinters.find(p => p.status === 'online');
                if (defaultPrinter) {
                    printerName = defaultPrinter.name;
                    printerSource = 'impressora padrão do sistema';
                }
                else if (anyOnlinePrinter) {
                    printerName = anyOnlinePrinter.name;
                    printerSource = 'primeira impressora online';
                }
            }
            if (!printerName) {
                this.logger.error('❌ Nenhuma impressora disponível para impressão');
                this.logger.warn('💡 Dica: Cadastre uma impressora em Impressoras ou conecte uma impressora ao sistema');
                return false;
            }
            this.logger.log(`📄 Enviando para impressora: ${printerName} (${printerSource})`);
            const status = await this.thermalPrinter.checkPrinterStatus(printerName);
            if (!status.online) {
                this.logger.warn(`⚠️ Impressora ${printerName} está offline: ${status.message}`);
                return false;
            }
            if (!status.paperOk) {
                this.logger.warn(`⚠️ Problema com papel na impressora ${printerName}`);
            }
            this.logger.log('🖨️ Enviando comando de impressão...');
            const success = await this.thermalPrinter.print(printerName, content, true);
            if (success) {
                this.logger.log('✅ Impressão enviada com sucesso!');
                if (companyId) {
                    await this.prisma.printer.updateMany({
                        where: { name: printerName, companyId },
                        data: { lastStatusCheck: new Date() },
                    }).catch(err => this.logger.warn('Erro ao atualizar timestamp:', err));
                }
            }
            else {
                this.logger.error('❌ Falha ao enviar impressão');
            }
            return success;
        }
        catch (error) {
            this.logger.error('❌ Erro ao enviar para impressora:', error);
            this.logger.error('Stack:', error.stack);
            return false;
        }
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
    formatCnpj(cnpj) {
        const numbers = cnpj.replace(/\D/g, '');
        if (cnpj.includes('.') || cnpj.includes('/')) {
            return cnpj;
        }
        if (numbers.length === 14) {
            return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
        }
        return cnpj;
    }
    formatCpfCnpj(value) {
        const numbers = value.replace(/\D/g, '');
        if (value.includes('.') || value.includes('/') || value.includes('-')) {
            return value;
        }
        if (numbers.length === 11) {
            return numbers.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
        }
        if (numbers.length === 14) {
            return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
        }
        return value;
    }
    formatAccessKey(key) {
        const numbers = key.replace(/\D/g, '');
        const chunks = numbers.match(/.{1,4}/g) || [];
        return chunks.join(' ');
    }
    wrapText(text, width = 32) {
        const words = text.split(' ');
        let lines = [];
        let currentLine = '';
        words.forEach(word => {
            if ((currentLine + word).length <= width) {
                currentLine += (currentLine ? ' ' : '') + word;
            }
            else {
                if (currentLine)
                    lines.push(this.centerText(currentLine, width));
                currentLine = word;
            }
        });
        if (currentLine) {
            lines.push(this.centerText(currentLine, width));
        }
        return lines.join('\n') + '\n';
    }
    async generateQRCodeAscii(url) {
        try {
            const qrAscii = await QRCode.toString(url, {
                type: 'terminal',
                small: true,
                errorCorrectionLevel: 'M',
            });
            const lines = qrAscii.split('\n');
            const centeredLines = lines.map(line => this.centerText(line, 32));
            return centeredLines.join('\n');
        }
        catch (error) {
            this.logger.error('Erro ao gerar QR Code ASCII:', error);
            throw error;
        }
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
    async openCashDrawer(printerId) {
        try {
            const printer = await this.prisma.printer.findUnique({
                where: { id: printerId },
            });
            if (!printer) {
                throw new common_1.BadRequestException('Impressora não encontrada');
            }
            this.logger.log(`Abrindo gaveta de dinheiro na impressora: ${printer.name}`);
            return await this.thermalPrinter.openCashDrawer(printer.name);
        }
        catch (error) {
            this.logger.error('Erro ao abrir gaveta:', error);
            return false;
        }
    }
    async getPrintQueue(printerId) {
        try {
            const printer = await this.prisma.printer.findUnique({
                where: { id: printerId },
            });
            if (!printer) {
                throw new common_1.BadRequestException('Impressora não encontrada');
            }
            return await this.thermalPrinter.getPrintQueue(printer.name);
        }
        catch (error) {
            this.logger.error('Erro ao obter fila de impressão:', error);
            return [];
        }
    }
    async printBudget(data) {
        try {
            this.logger.log(`Printing budget: ${data.budget.id}`);
            const content = this.generateBudgetContent(data);
            const success = await this.sendToPrinter(content, data.company.id);
            if (success) {
                this.logger.log(`Budget ${data.budget.id} printed successfully`);
            }
            else {
                this.logger.warn(`Failed to print budget ${data.budget.id}`);
            }
            return success;
        }
        catch (error) {
            this.logger.error('Error printing budget:', error);
            return false;
        }
    }
    generateBudgetContent(data) {
        const { company, budget, client, items, seller } = data;
        let content = '';
        content += '\n';
        content += this.centerText('================================') + '\n';
        content += this.centerText('*** ORÇAMENTO ***') + '\n';
        content += this.centerText('================================') + '\n';
        content += this.centerText(company.name.toUpperCase()) + '\n';
        content += this.centerText(`CNPJ: ${this.formatCnpj(company.cnpj)}`) + '\n';
        if (company.address) {
            content += this.centerText(company.address) + '\n';
        }
        if (company.phone) {
            content += this.centerText(`Tel: ${company.phone}`) + '\n';
        }
        if (company.email) {
            content += this.centerText(`Email: ${company.email}`) + '\n';
        }
        content += '\n';
        content += this.centerText('================================') + '\n';
        content += `ORÇAMENTO Nº: ${budget.budgetNumber.toString().padStart(6, '0')}\n`;
        content += `Data: ${this.formatDate(new Date(budget.budgetDate))}\n`;
        content += `Validade: ${this.formatDate(new Date(budget.validUntil))}\n`;
        content += `Status: ${this.getBudgetStatus(budget.status)}\n`;
        if (client) {
            content += '\n';
            content += this.centerText('================================') + '\n';
            content += this.centerText('DADOS DO CLIENTE') + '\n';
            content += this.centerText('================================') + '\n';
            if (client.name) {
                content += `Nome: ${client.name}\n`;
            }
            if (client.cpfCnpj) {
                content += `CPF/CNPJ: ${this.formatCpfCnpj(client.cpfCnpj)}\n`;
            }
            if (client.phone) {
                content += `Telefone: ${client.phone}\n`;
            }
            if (client.email) {
                content += `Email: ${client.email}\n`;
            }
        }
        content += '\n';
        content += this.centerText('================================') + '\n';
        content += this.centerText('PRODUTOS') + '\n';
        content += this.centerText('================================') + '\n';
        content += 'ITEM DESCRICAO     QTD  VL.UNIT  VL.TOTAL\n';
        content += '----------------------------------------\n';
        items.forEach((item, index) => {
            const itemNumber = (index + 1).toString().padStart(3);
            const description = item.productName.substring(0, 13).padEnd(13);
            const quantity = item.quantity.toString().padStart(3);
            const unitPrice = this.formatCurrency(item.unitPrice).padStart(8);
            const totalPrice = this.formatCurrency(item.totalPrice).padStart(9);
            content += `${itemNumber}  ${description}${quantity} ${unitPrice} ${totalPrice}\n`;
            if (item.barcode) {
                content += `     Cód: ${item.barcode}\n`;
            }
        });
        content += '----------------------------------------\n';
        content += `Qtd. Total de Itens: ${items.length}\n`;
        content += '\n';
        content += `VALOR TOTAL: ${this.formatCurrency(budget.total).padStart(30)}\n`;
        if (budget.notes) {
            content += '\n';
            content += this.centerText('================================') + '\n';
            content += this.centerText('OBSERVAÇÕES') + '\n';
            content += this.centerText('================================') + '\n';
            content += this.wrapText(budget.notes, 40);
        }
        if (seller) {
            content += '\n';
            content += `Vendedor: ${seller.name}\n`;
        }
        content += '\n';
        content += this.centerText('================================') + '\n';
        content += this.centerText('ORÇAMENTO SEM VALOR FISCAL') + '\n';
        content += this.centerText('NÃO É DOCUMENTO FISCAL') + '\n';
        content += this.centerText('================================') + '\n';
        content += this.centerText('Este orçamento tem validade até') + '\n';
        content += this.centerText(this.formatDate(new Date(budget.validUntil))) + '\n';
        content += '\n';
        content += this.centerText('OBRIGADO PELA PREFERÊNCIA!') + '\n';
        content += this.centerText('================================') + '\n';
        content += this.centerText('Sistema: MontShop') + '\n';
        content += this.centerText(this.formatDate(new Date())) + '\n';
        content += '\n\n\n';
        return content;
    }
    getBudgetStatus(status) {
        const statusMap = {
            pending: 'Pendente',
            approved: 'Aprovado',
            rejected: 'Rejeitado',
            expired: 'Expirado',
        };
        return statusMap[status] || status;
    }
};
exports.PrinterService = PrinterService;
exports.PrinterService = PrinterService = PrinterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        printer_driver_service_1.PrinterDriverService,
        thermal_printer_service_1.ThermalPrinterService])
], PrinterService);
//# sourceMappingURL=printer.service.js.map
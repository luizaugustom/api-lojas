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
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const thermal_printer_service_1 = require("../../shared/services/thermal-printer.service");
const QRCode = require("qrcode");
let PrinterService = PrinterService_1 = class PrinterService {
    constructor(prisma, thermalPrinter) {
        this.prisma = prisma;
        this.thermalPrinter = thermalPrinter;
        this.logger = new common_1.Logger(PrinterService_1.name);
        this.clientDevices = new Map();
    }
    async registerClientDevices(computerId, printers, companyId) {
        try {
            const systemPrinters = printers.map((p) => ({
                name: p.name || p.Name || 'Impressora Desconhecida',
                driver: p.driver || p.DriverName || 'Unknown',
                port: p.port || p.PortName || p.connectionInfo || 'Unknown',
                status: p.status === 'online' || p.PrinterStatus === 0 ? 'online' : 'offline',
                isDefault: p.isDefault || false,
                connection: (p.connection || p.type || 'usb'),
            }));
            this.clientDevices.set(computerId, {
                printers: systemPrinters,
                lastUpdate: new Date(),
            });
            let printersCreated = 0;
            if (companyId) {
                for (const printer of systemPrinters) {
                    try {
                        const existing = await this.prisma.printer.findFirst({
                            where: {
                                name: printer.name,
                                companyId,
                            },
                        });
                        if (!existing) {
                            await this.prisma.printer.create({
                                data: {
                                    name: printer.name,
                                    type: printer.connection,
                                    connectionInfo: printer.port,
                                    companyId,
                                    isConnected: printer.status === 'online',
                                    paperStatus: printer.status === 'online' ? 'OK' : 'ERROR',
                                },
                            });
                            printersCreated++;
                            this.logger.log(`Impressora "${printer.name}" salva no banco de dados para empresa ${companyId}`);
                        }
                        else {
                            await this.prisma.printer.update({
                                where: { id: existing.id },
                                data: {
                                    isConnected: printer.status === 'online',
                                    paperStatus: printer.status === 'online' ? 'OK' : 'ERROR',
                                    lastStatusCheck: new Date(),
                                    connectionInfo: printer.port,
                                },
                            });
                            this.logger.log(`Status da impressora "${printer.name}" atualizado no banco`);
                        }
                    }
                    catch (dbError) {
                        this.logger.warn(`Erro ao salvar impressora "${printer.name}" no banco:`, dbError);
                    }
                }
            }
            this.logger.log(`Dispositivos registrados para computador ${computerId}: ${systemPrinters.length} impressora(s)${companyId ? `, ${printersCreated} nova(s) salva(s) no banco` : ''}`);
            return {
                success: true,
                message: `${systemPrinters.length} impressora(s) registrada(s)${companyId ? `. ${printersCreated} nova(s) salva(s) no banco de dados` : ' em memória'}`,
                printersCreated,
            };
        }
        catch (error) {
            this.logger.error('Erro ao registrar dispositivos do cliente:', error);
            return {
                success: false,
                message: 'Erro ao registrar dispositivos',
            };
        }
    }
    async getAvailablePrinters(computerId, companyId) {
        try {
            if (computerId) {
                const clientData = this.clientDevices.get(computerId);
                if (clientData && clientData.printers.length > 0) {
                    this.logger.log(`Retornando ${clientData.printers.length} impressora(s) do computador ${computerId}`);
                    return clientData.printers.map(p => ({
                        name: p.name,
                        isDefault: p.isDefault,
                        status: p.status,
                    }));
                }
                this.logger.warn(`Nenhuma impressora encontrada para o computador ${computerId}`);
                return [];
            }
            if (companyId) {
                const dbPrinters = await this.prisma.printer.findMany({
                    where: {
                        companyId,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                });
                if (dbPrinters.length > 0) {
                    return dbPrinters.map(p => ({
                        name: p.name,
                        isDefault: false,
                        status: p.isConnected ? 'online' : 'offline',
                    }));
                }
            }
            return [];
        }
        catch (error) {
            this.logger.error('Erro ao obter impressoras disponíveis:', error);
            return [];
        }
    }
    async checkDrivers() {
        try {
            this.logger.log('Verificando drivers de impressora...');
            return {
                allInstalled: true,
                drivers: [],
                message: 'Funcionalidade de verificação de drivers não implementada',
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
            return {
                success: false,
                message: 'Funcionalidade de instalação de drivers não implementada',
                errors: ['Funcionalidade não disponível'],
            };
        }
        catch (error) {
            this.logger.error('Erro ao instalar drivers:', error);
            return {
                success: false,
                message: 'Erro ao instalar drivers',
                errors: [error instanceof Error ? error.message : String(error)],
            };
        }
    }
    async checkAndInstallDrivers() {
        try {
            this.logger.log('Verificando drivers de impressora...');
            return {
                driversInstalled: true,
                message: 'Funcionalidade de verificação de drivers não implementada',
                errors: [],
            };
        }
        catch (error) {
            this.logger.error('Erro ao verificar/instalar drivers:', error);
            return {
                driversInstalled: false,
                message: 'Erro ao verificar drivers',
                errors: [error instanceof Error ? error.message : String(error)],
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
    async deletePrinter(user, id) {
        const printer = await this.prisma.printer.findUnique({ where: { id } });
        if (!printer) {
            throw new common_1.BadRequestException('Impressora não encontrada');
        }
        if (user.role !== 'ADMIN' && printer.companyId !== user.companyId) {
            throw new common_1.BadRequestException('Sem permissão para excluir esta impressora');
        }
        const deleted = await this.prisma.printer.delete({ where: { id } });
        this.logger.log(`Printer deleted: ${id} by user: ${user.id}`);
        return deleted;
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
    async printReceipt(receiptData, companyId, computerId, clientTimeInfo) {
        try {
            const receipt = this.generateReceiptContent(receiptData, clientTimeInfo);
            const result = await this.sendToPrinter(receipt, companyId, computerId);
            if (result.success) {
                this.logger.log(`Receipt printed successfully for sale: ${receiptData.sale.id}`);
            }
            else {
                this.logger.warn(`Receipt printing failed for sale: ${receiptData.sale.id}: ${result.error}`);
            }
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Error printing receipt:', error);
            return {
                success: false,
                error: `Erro ao imprimir cupom: ${errorMessage}`,
                details: {
                    reason: `Erro inesperado durante a impressão do cupom: ${errorMessage}`,
                },
            };
        }
    }
    async printCashClosureReport(reportData, companyId, computerId, preGeneratedContent, clientTimeInfo) {
        const report = preGeneratedContent ?? this.generateCashClosureReport(reportData, clientTimeInfo);
        try {
            const result = await this.sendToPrinter(report, companyId, computerId);
            if (result.success) {
                this.logger.log('Cash closure report printed successfully');
            }
            else {
                this.logger.warn(`Cash closure report printing failed: ${result.error}`);
            }
            return {
                ...result,
                content: report,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Error printing cash closure report:', error);
            return {
                success: false,
                error: `Erro ao imprimir relatório: ${errorMessage}`,
                details: {
                    reason: `Erro inesperado durante a impressão do relatório de fechamento: ${errorMessage}`,
                },
                content: report,
            };
        }
    }
    async printNonFiscalReceipt(receiptData, companyId, isMocked = false, computerId, clientTimeInfo) {
        try {
            this.logger.log(`Iniciando impressão de cupom não fiscal para venda: ${receiptData.sale.id}${isMocked ? ' (DADOS MOCKADOS)' : ''}${computerId ? ` (computador: ${computerId})` : ''}`);
            const receipt = this.generateNonFiscalReceiptContent(receiptData, isMocked, clientTimeInfo);
            const result = await this.sendToPrinter(receipt, companyId, computerId);
            if (result.success) {
                this.logger.log(`✅ Cupom não fiscal impresso com sucesso para venda: ${receiptData.sale.id}`);
            }
            else {
                this.logger.warn(`⚠️ Falha ao imprimir cupom não fiscal para venda: ${receiptData.sale.id}. ${result.error}`);
            }
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`❌ Erro ao imprimir cupom não fiscal para venda ${receiptData.sale.id}:`, error);
            return {
                success: false,
                error: `Erro ao imprimir cupom não fiscal: ${errorMessage}`,
                details: {
                    reason: `Erro inesperado durante a impressão do cupom não fiscal: ${errorMessage}`,
                },
            };
        }
    }
    async getNFCeContent(nfceData, clientTimeInfo) {
        try {
            this.logger.log(`Gerando conteúdo de NFCe para venda: ${nfceData.sale.id}`);
            const isMock = nfceData.fiscal.status === 'MOCK' || nfceData.fiscal.isMock === true;
            if (isMock) {
                this.logger.warn(`⚠️ NFCe mockada detectada. Gerando cupom não fiscal para venda: ${nfceData.sale.id}`);
                const receiptData = {
                    company: {
                        name: nfceData.company.name,
                        cnpj: nfceData.company.cnpj,
                        address: nfceData.company.address,
                    },
                    sale: {
                        id: nfceData.sale.id,
                        date: nfceData.sale.saleDate,
                        total: nfceData.sale.total,
                        paymentMethods: nfceData.sale.paymentMethod,
                        change: nfceData.sale.change,
                    },
                    items: nfceData.items.map(item => ({
                        name: item.productName,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                    })),
                    seller: {
                        name: nfceData.sale.sellerName,
                    },
                    client: {
                        name: nfceData.sale.clientName,
                        cpfCnpj: nfceData.sale.clientCpfCnpj,
                    },
                };
                return this.generateNonFiscalReceiptContent(receiptData, true, clientTimeInfo);
            }
            return await this.generateNFCeContent(nfceData, clientTimeInfo);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`❌ Erro ao gerar conteúdo de NFCe para venda ${nfceData.sale.id}:`, error);
            throw new Error(`Erro ao gerar conteúdo NFC-e: ${errorMessage}`);
        }
    }
    async printNFCe(nfceData, companyId, computerId, clientTimeInfo) {
        try {
            this.logger.log(`Iniciando impressão de NFCe para venda: ${nfceData.sale.id}${computerId ? ` (computador: ${computerId})` : ''}`);
            const isMock = nfceData.fiscal.status === 'MOCK' || nfceData.fiscal.isMock === true;
            if (isMock) {
                this.logger.warn(`⚠️ NFCe mockada detectada. Imprimindo cupom não fiscal para venda: ${nfceData.sale.id}`);
                const receiptData = {
                    company: {
                        name: nfceData.company.name,
                        cnpj: nfceData.company.cnpj,
                        address: nfceData.company.address,
                    },
                    sale: {
                        id: nfceData.sale.id,
                        date: nfceData.sale.saleDate,
                        total: nfceData.sale.total,
                        paymentMethods: nfceData.sale.paymentMethod,
                        change: nfceData.sale.change,
                    },
                    items: nfceData.items.map(item => ({
                        name: item.productName,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                    })),
                    seller: {
                        name: nfceData.sale.sellerName,
                    },
                    client: {
                        name: nfceData.sale.clientName,
                        cpfCnpj: nfceData.sale.clientCpfCnpj,
                    },
                };
                return await this.printNonFiscalReceipt(receiptData, companyId, true, computerId, clientTimeInfo);
            }
            const nfce = await this.generateNFCeContent(nfceData, clientTimeInfo);
            const result = await this.sendToPrinter(nfce, companyId, computerId);
            if (result.success) {
                this.logger.log(`✅ NFCe impressa com sucesso para venda: ${nfceData.sale.id}`);
            }
            else {
                this.logger.warn(`⚠️ Falha ao imprimir NFCe para venda: ${nfceData.sale.id}. ${result.error}`);
            }
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`❌ Erro ao imprimir NFCe para venda ${nfceData.sale.id}:`, error);
            return {
                success: false,
                error: `Erro ao imprimir NFC-e: ${errorMessage}`,
                details: {
                    reason: `Erro inesperado durante a impressão da NFC-e: ${errorMessage}`,
                },
            };
        }
    }
    generateReceiptContent(data, clientTimeInfo) {
        const { company, sale, items, seller, client } = data;
        const timeInfo = clientTimeInfo ?? data.metadata?.clientTimeInfo;
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
        receipt += `Data: ${this.formatDate(sale.date, timeInfo)}\n`;
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
        receipt += this.centerText('--------------------------------') + '\n\n\n';
        return receipt;
    }
    generateNonFiscalReceiptContent(data, isMocked = false, clientTimeInfo) {
        const { company, sale, items, seller, client } = data;
        const timeInfo = clientTimeInfo ?? data.metadata?.clientTimeInfo;
        let receipt = '';
        receipt += this.centerText(company.name) + '\n';
        receipt += this.centerText(`CNPJ: ${company.cnpj}`) + '\n';
        if (company.address) {
            receipt += this.centerText(company.address) + '\n';
        }
        receipt += this.centerText('================================') + '\n';
        receipt += this.centerText('CUPOM NÃO FISCAL') + '\n';
        receipt += this.centerText('================================') + '\n';
        receipt += `Venda: ${sale.id}\n`;
        receipt += `Data: ${this.formatDate(sale.date, timeInfo)}\n`;
        receipt += `Vendedor: ${seller.name}\n`;
        if (client?.name) {
            receipt += `Cliente: ${client.name}\n`;
        }
        if (client?.cpfCnpj) {
            receipt += `CPF/CNPJ: ${client.cpfCnpj}\n`;
        }
        receipt += this.centerText('================================') + '\n';
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
        receipt += this.centerText('================================') + '\n';
        receipt += this.centerText(`OBRIGADO POR ESCOLHER ${company.name.toUpperCase()}!`) + '\n';
        receipt += this.centerText('VOLTE SEMPRE!') + '\n';
        receipt += this.centerText('================================') + '\n';
        receipt += this.centerText('🚀SISTEMA MONTSHOP! 🚀') + '\n';
        receipt += this.centerText('==========') + '\n';
        receipt += '\n\n\n';
        return receipt;
    }
    generateCashClosureReport(data, clientTimeInfo) {
        const { company, closure, paymentSummary, sellers, includeSaleDetails } = data;
        const timeInfo = clientTimeInfo ?? data.metadata?.clientTimeInfo;
        let report = '';
        report += this.centerText(company.name) + '\n';
        report += this.centerText(`CNPJ: ${company.cnpj}`) + '\n';
        if (company.address) {
            report += this.centerText(company.address) + '\n';
        }
        report += this.centerText('================================') + '\n';
        report += this.centerText('RELATÓRIO DE FECHAMENTO DE CAIXA') + '\n';
        report += this.centerText('================================') + '\n';
        report += `Fechamento: ${closure.id}\n`;
        report += closure.seller
            ? `Caixa: Individual - ${closure.seller.name}\n`
            : 'Caixa: Compartilhado\n';
        report += `Abertura: ${this.formatDate(closure.openingDate, timeInfo)}\n`;
        report += `Fechamento: ${this.formatDate(closure.closingDate, timeInfo)}\n`;
        report += `Valor inicial: ${this.formatCurrency(closure.openingAmount)}\n`;
        report += `Total vendas: ${this.formatCurrency(closure.totalSales)}\n`;
        report += `Retiradas: ${this.formatCurrency(closure.totalWithdrawals)}\n`;
        report += `Troco concedido: ${this.formatCurrency(closure.totalChange)}\n`;
        report += `Vendas em dinheiro: ${this.formatCurrency(closure.totalCashSales)}\n`;
        report += `Saldo esperado: ${this.formatCurrency(closure.expectedClosing)}\n`;
        report += `Valor informado: ${this.formatCurrency(closure.closingAmount)}\n`;
        const diff = closure.difference;
        const diffLabel = Math.abs(diff) < 0.01 ? 'OK' : diff > 0 ? 'SOBRA' : 'FALTA';
        report += `Diferença: ${this.formatCurrency(diff)} (${diffLabel})\n`;
        report += `Qtde de vendas: ${closure.salesCount}\n`;
        report += this.centerText('--------------------------------') + '\n';
        report += 'RESUMO POR FORMA DE PAGAMENTO:\n';
        if (paymentSummary.length === 0) {
            report += 'Nenhuma venda registrada.\n';
        }
        else {
            paymentSummary.forEach(({ method, total }) => {
                report += `${this.getPaymentMethodName(method)}: ${this.formatCurrency(total)}\n`;
            });
        }
        report += '\nRESUMO POR VENDEDOR:\n';
        if (sellers.length === 0) {
            report += 'Nenhuma venda registrada.\n';
        }
        else {
            sellers.forEach((seller) => {
                report += `${seller.name}: ${this.formatCurrency(seller.totalSales)} `;
                report += `(Troco: ${this.formatCurrency(seller.totalChange)})\n`;
            });
        }
        if (includeSaleDetails) {
            sellers.forEach((seller) => {
                report += '\n' + this.centerText('--------------------------------') + '\n';
                report += this.centerText(`Vendedor: ${seller.name}`) + '\n';
                report += `Total vendido: ${this.formatCurrency(seller.totalSales)}\n`;
                report += `Troco concedido: ${this.formatCurrency(seller.totalChange)}\n`;
                report += `Vendas registradas: ${seller.sales.length}\n`;
                report += this.centerText('--------------------------------') + '\n';
                seller.sales.forEach((sale, index) => {
                    report += `#${(index + 1).toString().padStart(2, '0')} ${this.formatDate(sale.date, timeInfo)}\n`;
                    report += `Venda: ${sale.id}\n`;
                    report += `Total: ${this.formatCurrency(sale.total)}\n`;
                    if (sale.clientName) {
                        report += `Cliente: ${sale.clientName}\n`;
                    }
                    report += 'Pagamentos:\n';
                    sale.paymentMethods.forEach((payment) => {
                        report += `  - ${this.getPaymentMethodName(payment.method)}: ${this.formatCurrency(payment.amount)}\n`;
                    });
                    if (sale.change > 0) {
                        report += `  Troco: ${this.formatCurrency(sale.change)}\n`;
                    }
                    report += this.centerText('--------------------------------') + '\n';
                });
            });
        }
        else {
            report += '\nDETALHES INDIVIDUAIS NÃO INCLUÍDOS NESTE RELATÓRIO\n';
            report += this.centerText('--------------------------------') + '\n';
        }
        report += this.centerText('RELATÓRIO GERADO EM:') + '\n';
        report += this.centerText(this.formatDate(new Date(), timeInfo)) + '\n';
        report += this.centerText('================================') + '\n\n\n';
        return report;
    }
    async generateNFCeContent(data, clientTimeInfo) {
        const { company, fiscal, sale, items, customFooter } = data;
        const timeInfo = clientTimeInfo ?? data.metadata?.clientTimeInfo;
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
        nfce += `Emissão: ${this.formatDate(fiscal.emissionDate, timeInfo)}\n`;
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
            nfce += `Data Autorização: ${this.formatDate(fiscal.emissionDate, timeInfo)}\n`;
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
        nfce += this.centerText(`OBRIGADO POR ESCOLHER ${company.name.toUpperCase()}!`) + '\n';
        nfce += this.centerText('VOLTE SEMPRE!') + '\n';
        nfce += this.centerText('================================') + '\n';
        nfce += this.centerText('🚀SISTEMA MONTSHOP! 🚀') + '\n';
        nfce += this.centerText('==========') + '\n';
        nfce += this.centerText(this.formatDate(new Date(), timeInfo)) + '\n';
        nfce += '\n\n\n';
        return nfce;
    }
    async sendToPrinter(content, companyId, computerId) {
        try {
            let printerName = null;
            let printerSource = 'não encontrada';
            if (computerId) {
                this.logger.log(`🔍 Buscando impressoras do computador do cliente: ${computerId}`);
                const clientPrinters = await this.getAvailablePrinters(computerId, companyId);
                if (clientPrinters.length > 0) {
                    const defaultPrinter = clientPrinters.find(p => p.isDefault && p.status === 'online');
                    const anyOnlinePrinter = clientPrinters.find(p => p.status === 'online');
                    if (defaultPrinter) {
                        printerName = defaultPrinter.name;
                        printerSource = `impressora padrão do computador ${computerId}`;
                        this.logger.log(`✅ Usando impressora padrão do cliente: ${printerName}`);
                    }
                    else if (anyOnlinePrinter) {
                        printerName = anyOnlinePrinter.name;
                        printerSource = `impressora do computador ${computerId}`;
                        this.logger.log(`✅ Usando impressora do cliente: ${printerName}`);
                    }
                }
                else {
                    this.logger.warn(`⚠️ Nenhuma impressora encontrada no computador ${computerId}. Tentando outras fontes...`);
                }
            }
            if (!printerName && companyId) {
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
                    this.logger.log(`✅ Impressora encontrada no banco: ${printerName}`);
                }
            }
            if (!printerName) {
                this.logger.log('🔍 Buscando impressora padrão do sistema...');
                const systemPrinters = await this.getAvailablePrinters(null, companyId);
                if (systemPrinters.length === 0) {
                    this.logger.warn('⚠️ Nenhuma impressora detectada no sistema');
                    return {
                        success: false,
                        error: 'Nenhuma impressora detectada no sistema',
                        details: {
                            reason: 'Nenhuma impressora foi encontrada no sistema operacional. Verifique se a impressora está conectada e instalada corretamente. Se estiver usando o aplicativo desktop, certifique-se de ter feito a descoberta de impressoras.',
                        },
                    };
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
                return {
                    success: false,
                    error: 'Nenhuma impressora disponível',
                    details: {
                        reason: 'Nenhuma impressora online foi encontrada. Verifique se existe uma impressora cadastrada no sistema ou conecte uma impressora ao computador.',
                    },
                };
            }
            this.logger.log(`📄 Enviando para impressora: ${printerName} (${printerSource})`);
            const status = await this.thermalPrinter.checkPrinterStatus(printerName);
            if (!status.online) {
                const errorMessage = status.message || 'Status desconhecido';
                this.logger.warn(`⚠️ Impressora ${printerName} está offline: ${errorMessage}`);
                return {
                    success: false,
                    error: `Impressora "${printerName}" está offline`,
                    details: {
                        printerName,
                        printerSource,
                        status: 'offline',
                        reason: `A impressora "${printerName}" não está disponível. Verifique se ela está ligada, conectada ao computador e configurada corretamente. Erro: ${errorMessage}`,
                    },
                };
            }
            if (!status.paperOk && status.error) {
                this.logger.warn(`⚠️ Problema com papel na impressora ${printerName}`);
                return {
                    success: false,
                    error: `Problema detectado na impressora "${printerName}"`,
                    details: {
                        printerName,
                        printerSource,
                        status: 'paper-error',
                        reason: `A impressora "${printerName}" está reportando problemas com papel ou erro de hardware. Verifique se há papel suficiente e se a impressora não está com tampa aberta ou outro erro.`,
                    },
                };
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
                return {
                    success: true,
                    details: {
                        printerName,
                        printerSource,
                        status: 'printed',
                    },
                };
            }
            else {
                this.logger.error('❌ Falha ao enviar impressão');
                return {
                    success: false,
                    error: `Falha ao enviar comando de impressão para "${printerName}"`,
                    details: {
                        printerName,
                        printerSource,
                        status: 'print-failed',
                        reason: `O comando de impressão falhou. Pode ser um problema de driver, permissões ou comunicação com a impressora "${printerName}". Verifique se o driver da impressora está instalado corretamente.`,
                    },
                };
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('❌ Erro ao enviar para impressora:', error);
            this.logger.error('Stack:', error instanceof Error ? error.stack : '');
            return {
                success: false,
                error: `Erro inesperado ao imprimir: ${errorMessage}`,
                details: {
                    reason: `Ocorreu um erro inesperado durante a impressão: ${errorMessage}. Verifique os logs do sistema para mais detalhes.`,
                },
            };
        }
    }
    centerText(text, width = 32) {
        const padding = Math.max(0, Math.floor((width - text.length) / 2));
        return ' '.repeat(padding) + text;
    }
    formatDate(dateInput, clientTimeInfo, options = {}) {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        if (Number.isNaN(date.getTime())) {
            return '';
        }
        const locale = clientTimeInfo?.locale ?? 'pt-BR';
        const baseOptions = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            ...options,
        };
        if (clientTimeInfo?.timeZone) {
            baseOptions.timeZone = clientTimeInfo.timeZone;
        }
        try {
            return new Intl.DateTimeFormat(locale, baseOptions).format(date);
        }
        catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                this.logger.warn(`Falha ao formatar data com timezone ${clientTimeInfo?.timeZone}: ${error}`);
            }
            return date.toLocaleString(locale);
        }
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
    async testPrinter(id, computerId) {
        try {
            const printer = await this.prisma.printer.findUnique({
                where: { id },
            });
            if (!printer) {
                throw new common_1.BadRequestException('Impressora não encontrada');
            }
            const testContent = this.generateTestContent();
            const result = await this.sendToPrinter(testContent, printer.companyId, computerId);
            if (result.success) {
                await this.updatePrinterStatus(id, {
                    isConnected: true,
                    paperStatus: 'OK',
                });
            }
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Error testing printer:', error);
            return {
                success: false,
                error: `Erro ao testar impressora: ${errorMessage}`,
                details: {
                    reason: `Erro ao executar teste de impressão: ${errorMessage}`,
                },
            };
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
    async getPrinterLogs(printerId) {
        try {
            const printer = await this.prisma.printer.findUnique({
                where: { id: printerId },
            });
            if (!printer) {
                throw new common_1.BadRequestException('Impressora não encontrada');
            }
            return [];
        }
        catch (error) {
            this.logger.error('Erro ao obter logs da impressora:', error);
            return [];
        }
    }
    async printBudget(data, computerId, clientTimeInfo) {
        try {
            this.logger.log(`Printing budget: ${data.budget.id}${computerId ? ` (computador: ${computerId})` : ''}`);
            const content = this.generateBudgetContent(data, clientTimeInfo);
            const result = await this.sendToPrinter(content, data.company?.id, computerId);
            if (result.success) {
                this.logger.log(`Budget ${data.budget.id} printed successfully`);
            }
            else {
                this.logger.warn(`Failed to print budget ${data.budget.id}`);
            }
            return result.success;
        }
        catch (error) {
            this.logger.error('Error printing budget:', error);
            return false;
        }
    }
    generateBudgetContent(data, clientTimeInfo) {
        const { company, budget, client, items, seller } = data;
        const timeInfo = clientTimeInfo ?? data.metadata?.clientTimeInfo;
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
        content += `Data: ${this.formatDate(budget.budgetDate, timeInfo, { day: '2-digit', month: '2-digit', year: 'numeric' })}\n`;
        content += `Validade: ${this.formatDate(budget.validUntil, timeInfo, { day: '2-digit', month: '2-digit', year: 'numeric' })}\n`;
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
        content += this.centerText(`OBRIGADO POR ESCOLHER ${company.name.toUpperCase()}!`) + '\n';
        content += this.centerText('VOLTE SEMPRE!') + '\n';
        content += this.centerText('================================') + '\n';
        content += this.centerText('🚀SISTEMA MONTSHOP! 🚀') + '\n';
        content += this.centerText('==========') + '\n';
        content += this.centerText(this.formatDate(new Date(), timeInfo)) + '\n';
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
    async generatePrintContent(nfceData, companyId, clientTimeInfo) {
        try {
            const content = await this.generateNFCeContent(nfceData, clientTimeInfo);
            return content;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Erro ao gerar conteúdo de impressão:', error);
            throw new Error(`Erro ao gerar conteúdo de impressão: ${errorMessage}`);
        }
    }
    async getNonFiscalReceiptContent(receiptData, isMocked = false, clientTimeInfo) {
        try {
            return this.generateNonFiscalReceiptContent(receiptData, isMocked, clientTimeInfo);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Erro ao gerar conteúdo de cupom não fiscal:', error);
            throw new Error(`Erro ao gerar conteúdo de cupom não fiscal: ${errorMessage}`);
        }
    }
    generateCashClosureReportContent(reportData, clientTimeInfo) {
        return this.generateCashClosureReport(reportData, clientTimeInfo);
    }
};
exports.PrinterService = PrinterService;
exports.PrinterService = PrinterService = PrinterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        thermal_printer_service_1.ThermalPrinterService])
], PrinterService);
//# sourceMappingURL=printer.service.js.map
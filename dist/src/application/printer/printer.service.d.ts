import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ThermalPrinterService } from '../../shared/services/thermal-printer.service';
import { ClientTimeInfo } from '../../shared/utils/client-time.util';
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
    metadata?: {
        clientTimeInfo?: ClientTimeInfo;
    };
}
export interface NFCePrintData {
    company: {
        name: string;
        cnpj: string;
        address?: string;
        phone?: string;
        email?: string;
        inscricaoEstadual?: string;
    };
    fiscal: {
        documentNumber: string;
        accessKey: string;
        emissionDate: Date;
        status: string;
        protocol?: string;
        qrCodeUrl?: string;
        serieNumber?: string;
        isMock?: boolean;
    };
    sale: {
        id: string;
        total: number;
        clientName?: string;
        clientCpfCnpj?: string;
        paymentMethod: string[];
        change: number;
        saleDate: Date;
        sellerName: string;
        totalTaxes?: number;
    };
    items: Array<{
        productName: string;
        barcode: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        ncm?: string;
        cfop?: string;
    }>;
    customFooter?: string;
    metadata?: {
        clientTimeInfo?: ClientTimeInfo;
    };
}
export interface CashClosureReportData {
    company: {
        name: string;
        cnpj: string;
        address?: string;
    };
    closure: {
        id: string;
        openingDate: Date;
        closingDate: Date;
        openingAmount: number;
        closingAmount: number;
        totalSales: number;
        totalWithdrawals: number;
        totalChange: number;
        totalCashSales: number;
        expectedClosing: number;
        difference: number;
        salesCount: number;
        seller?: {
            id: string;
            name: string;
        } | null;
    };
    paymentSummary: Array<{
        method: string;
        total: number;
    }>;
    sellers: Array<{
        id: string;
        name: string;
        totalSales: number;
        totalChange: number;
        sales: Array<{
            id: string;
            date: Date;
            total: number;
            change: number;
            clientName?: string | null;
            paymentMethods: Array<{
                method: string;
                amount: number;
            }>;
        }>;
    }>;
    includeSaleDetails: boolean;
    metadata?: {
        clientTimeInfo?: ClientTimeInfo;
    };
}
export interface PrintResult {
    success: boolean;
    error?: string;
    details?: {
        printerName?: string;
        printerSource?: string;
        status?: string;
        reason?: string;
    };
    content?: string;
}
export declare class PrinterService {
    private readonly prisma;
    private readonly thermalPrinter;
    private readonly logger;
    private clientDevices;
    constructor(prisma: PrismaService, thermalPrinter: ThermalPrinterService);
    registerClientDevices(computerId: string, printers: any[], companyId?: string): Promise<{
        success: boolean;
        message: string;
        printersCreated?: number;
    }>;
    private getAvailablePrinters;
    checkDrivers(): Promise<{
        allInstalled: boolean;
        drivers: any[];
        message: string;
    }>;
    installDrivers(): Promise<{
        success: boolean;
        message: string;
        errors: string[];
    }>;
    checkAndInstallDrivers(): Promise<{
        driversInstalled: boolean;
        message: string;
        errors: string[];
    }>;
    addPrinter(companyId: string, printerConfig: PrinterConfig): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        type: string;
        connectionInfo: string;
        isConnected: boolean;
        paperStatus: string;
        lastStatusCheck: Date | null;
    }>;
    getPrinters(companyId?: string): Promise<({
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        type: string;
        connectionInfo: string;
        isConnected: boolean;
        paperStatus: string;
        lastStatusCheck: Date | null;
    })[]>;
    deletePrinter(user: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        type: string;
        connectionInfo: string;
        isConnected: boolean;
        paperStatus: string;
        lastStatusCheck: Date | null;
    }>;
    updatePrinterStatus(id: string, status: {
        isConnected: boolean;
        paperStatus: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        type: string;
        connectionInfo: string;
        isConnected: boolean;
        paperStatus: string;
        lastStatusCheck: Date | null;
    }>;
    printReceipt(receiptData: ReceiptData, companyId?: string, computerId?: string | null, clientTimeInfo?: ClientTimeInfo): Promise<PrintResult>;
    printCashClosureReport(reportData: CashClosureReportData, companyId?: string, computerId?: string | null, preGeneratedContent?: string, clientTimeInfo?: ClientTimeInfo): Promise<PrintResult>;
    printNonFiscalReceipt(receiptData: ReceiptData, companyId?: string, isMocked?: boolean, computerId?: string | null, clientTimeInfo?: ClientTimeInfo): Promise<PrintResult>;
    getNFCeContent(nfceData: NFCePrintData, clientTimeInfo?: ClientTimeInfo): Promise<string>;
    printNFCe(nfceData: NFCePrintData, companyId?: string, computerId?: string | null, clientTimeInfo?: ClientTimeInfo): Promise<PrintResult>;
    private generateReceiptContent;
    private generateNonFiscalReceiptContent;
    private generateCashClosureReport;
    private generateNFCeContent;
    private sendToPrinter;
    private centerText;
    private formatDate;
    private formatCurrency;
    private getPaymentMethodName;
    private formatCnpj;
    private formatCpfCnpj;
    private formatAccessKey;
    private wrapText;
    private generateQRCodeAscii;
    testPrinter(id: string, computerId?: string | null): Promise<PrintResult>;
    private generateTestContent;
    getPrinterStatus(id: string): Promise<{
        id: string;
        name: string;
        type: string;
        isConnected: boolean;
        paperStatus: string;
        lastStatusCheck: Date;
    }>;
    updateCustomFooter(companyId: string, customFooter: string): Promise<void>;
    getCustomFooter(companyId: string): Promise<string | null>;
    openCashDrawer(printerId: string): Promise<boolean>;
    getPrintQueue(printerId: string): Promise<any[]>;
    getPrinterLogs(printerId: string): Promise<string[]>;
    printBudget(data: any, computerId?: string | null, clientTimeInfo?: ClientTimeInfo): Promise<boolean>;
    private generateBudgetContent;
    private getBudgetStatus;
    generatePrintContent(nfceData: NFCePrintData, companyId?: string, clientTimeInfo?: ClientTimeInfo): Promise<string>;
    getNonFiscalReceiptContent(receiptData: ReceiptData, isMocked?: boolean, clientTimeInfo?: ClientTimeInfo): Promise<string>;
    generateCashClosureReportContent(reportData: CashClosureReportData, clientTimeInfo?: ClientTimeInfo): string;
}

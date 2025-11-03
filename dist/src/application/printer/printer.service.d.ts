import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PrinterDriverService, SystemPrinter } from '../../shared/services/printer-driver.service';
import { ThermalPrinterService } from '../../shared/services/thermal-printer.service';
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
export interface PrintResult {
    success: boolean;
    error?: string;
    details?: {
        printerName?: string;
        printerSource?: string;
        status?: string;
        reason?: string;
    };
}
export declare class PrinterService {
    private readonly configService;
    private readonly prisma;
    private readonly driverService;
    private readonly thermalPrinter;
    private readonly logger;
    private readonly printerTimeout;
    private readonly printerRetryAttempts;
    private lastPrinterCheck;
    private availablePrinters;
    private clientDevices;
    constructor(configService: ConfigService, prisma: PrismaService, driverService: PrinterDriverService, thermalPrinter: ThermalPrinterService);
    private initializePrinters;
    private syncPrintersWithDatabase;
    checkPrintersStatus(): Promise<void>;
    discoverPrinters(): Promise<PrinterConfig[]>;
    getAvailablePrinters(computerId?: string | null, companyId?: string): Promise<SystemPrinter[]>;
    registerClientDevices(computerId: string, printers: any[], companyId?: string): Promise<{
        success: boolean;
        message: string;
        printersCreated?: number;
    }>;
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
    printReceipt(receiptData: ReceiptData, companyId?: string): Promise<PrintResult>;
    printCashClosureReport(reportData: CashClosureReportData, companyId?: string): Promise<PrintResult>;
    printNonFiscalReceipt(receiptData: ReceiptData, companyId?: string, isMocked?: boolean): Promise<PrintResult>;
    printNFCe(nfceData: NFCePrintData, companyId?: string): Promise<PrintResult>;
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
    testPrinter(id: string): Promise<PrintResult>;
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
    printBudget(data: any): Promise<boolean>;
    private generateBudgetContent;
    private getBudgetStatus;
}

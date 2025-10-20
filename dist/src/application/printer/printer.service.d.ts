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
export interface NFCePrintData {
    company: {
        name: string;
        cnpj: string;
        address?: string;
        phone?: string;
        email?: string;
    };
    fiscal: {
        documentNumber: string;
        accessKey: string;
        emissionDate: Date;
        status: string;
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
    };
    items: Array<{
        productName: string;
        barcode: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
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
export declare class PrinterService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private readonly printerTimeout;
    private readonly printerRetryAttempts;
    constructor(configService: ConfigService, prisma: PrismaService);
    discoverPrinters(): Promise<PrinterConfig[]>;
    private discoverUsbPrinters;
    private discoverNetworkPrinters;
    private discoverBluetoothPrinters;
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
    printReceipt(receiptData: ReceiptData): Promise<boolean>;
    printCashClosureReport(reportData: CashClosureReportData): Promise<boolean>;
    printNFCe(nfceData: NFCePrintData): Promise<boolean>;
    private generateReceiptContent;
    private generateCashClosureReport;
    private generateNFCeContent;
    private sendToPrinter;
    private centerText;
    private formatDate;
    private formatCurrency;
    private getPaymentMethodName;
    testPrinter(id: string): Promise<boolean>;
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
}

export interface PrintJob {
    id: string;
    printerName: string;
    content: string;
    type: 'text' | 'escpos';
    status: 'pending' | 'printing' | 'completed' | 'failed';
    error?: string;
    createdAt: Date;
    completedAt?: Date;
}
export declare class ThermalPrinterService {
    private readonly logger;
    private readonly platform;
    private readonly printQueue;
    private readonly ESC;
    private readonly GS;
    print(printerName: string, content: string, useEscPos?: boolean): Promise<boolean>;
    private printWindows;
    private printLinux;
    private printMac;
    private addEscPosCommands;
    private shouldBeBold;
    private shouldBeCentered;
    private shouldBeDoubleHeight;
    printBarcode(printerName: string, code: string, type?: 'EAN13' | 'CODE128' | 'QR'): Promise<boolean>;
    openCashDrawer(printerName: string): Promise<boolean>;
    checkPrinterStatus(printerName: string): Promise<{
        online: boolean;
        paperOk: boolean;
        error: boolean;
        message: string;
    }>;
    private checkWindowsStatus;
    private checkUnixStatus;
    printTestPage(printerName: string): Promise<boolean>;
    getPrintQueue(printerName: string): Promise<any[]>;
    cancelPrintJob(printerName: string, jobId: string): Promise<boolean>;
}

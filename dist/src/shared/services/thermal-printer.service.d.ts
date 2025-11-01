export interface PrinterStatus {
    online: boolean;
    paperOk: boolean;
    error?: boolean;
    message?: string;
}
export declare class ThermalPrinterService {
    private readonly logger;
    private readonly platform;
    checkPrinterStatus(printerName: string): Promise<PrinterStatus>;
    print(printerName: string, content: string, cutPaper?: boolean): Promise<boolean>;
    openCashDrawer(printerName: string): Promise<boolean>;
    getPrintQueue(printerName: string): Promise<any[]>;
}

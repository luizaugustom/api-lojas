export interface SystemPrinter {
    name: string;
    driver: string;
    port: string;
    status: 'online' | 'offline' | 'error' | 'paper-empty';
    isDefault: boolean;
    connection: 'usb' | 'network' | 'bluetooth' | 'local';
}
export interface DriverInfo {
    name: string;
    installed: boolean;
    version?: string;
    compatible: boolean;
}
export declare class PrinterDriverService {
    private readonly logger;
    private readonly platform;
    private readonly driverCache;
    detectSystemPrinters(): Promise<SystemPrinter[]>;
    private detectWindowsPrinters;
    private detectLinuxPrinters;
    private detectMacPrinters;
    checkThermalPrinterDrivers(): Promise<DriverInfo[]>;
    private checkWindowsDrivers;
    private checkLinuxDrivers;
    private checkMacDrivers;
    installThermalPrinterDrivers(): Promise<{
        success: boolean;
        message: string;
        errors: string[];
    }>;
    private installWindowsDrivers;
    private installLinuxDrivers;
    private installMacDrivers;
    private getLinuxPrinterDriver;
    private getMacPrinterDriver;
    private parseWindowsStatus;
    private detectConnectionType;
    testPrinterConnection(printerName: string): Promise<boolean>;
    getPrinterErrorLogs(printerName: string): Promise<string[]>;
}

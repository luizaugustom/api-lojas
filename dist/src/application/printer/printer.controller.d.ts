import { PrinterService, PrinterConfig } from './printer.service';
import { AddPrinterDto } from './dto/add-printer.dto';
import { UpdateCustomFooterDto } from './dto/update-custom-footer.dto';
export declare class PrinterController {
    private readonly printerService;
    constructor(printerService: PrinterService);
    discoverPrinters(): Promise<PrinterConfig[]>;
    addPrinter(user: any, printerConfig: AddPrinterDto): Promise<{
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
    getPrinters(user: any): Promise<({
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
    getPrinterStatus(id: string): Promise<{
        id: string;
        name: string;
        type: string;
        isConnected: boolean;
        paperStatus: string;
        lastStatusCheck: Date;
    }>;
    testPrinter(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateCustomFooter(user: any, updateCustomFooterDto: UpdateCustomFooterDto): Promise<{
        message: string;
    }>;
    getCustomFooter(user: any): Promise<{
        customFooter: string;
    }>;
    getAvailablePrinters(user: any): Promise<import("../../shared/services/printer-driver.service").SystemPrinter[]>;
    registerDevices(user: any, body: {
        computerId: string;
        printers: any[];
    }): Promise<{
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
    openCashDrawer(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getPrintQueue(id: string): Promise<any[]>;
    deletePrinter(user: any, id: string): Promise<{
        success: boolean;
        deletedId: string;
    }>;
}

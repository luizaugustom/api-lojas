import { PrinterService, PrinterConfig } from './printer.service';
import { UpdateCustomFooterDto } from './dto/update-custom-footer.dto';
export declare class PrinterController {
    private readonly printerService;
    constructor(printerService: PrinterService);
    discoverPrinters(): Promise<PrinterConfig[]>;
    addPrinter(user: any, printerConfig: PrinterConfig): Promise<{
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
}

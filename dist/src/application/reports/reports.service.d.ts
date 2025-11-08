import { PrismaService } from '../../infrastructure/database/prisma.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ClientTimeInfo } from '../../shared/utils/client-time.util';
export declare class ReportsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    generateReport(companyId: string, generateReportDto: GenerateReportDto, clientTimeInfo?: ClientTimeInfo): Promise<{
        contentType: string;
        data: Buffer<ArrayBufferLike>;
        filename: string;
    }>;
    private generateSalesReport;
    private generateProductsReport;
    private generateInvoicesReport;
    private generateCompleteReport;
    private getBillsToPay;
    private getCashClosures;
    private getCommissionsReport;
    private convertToXML;
    private convertToExcel;
    private addCompanyInfo;
    private addSalesSheet;
    private addProductsSheet;
    private addInvoicesSheet;
    private addBillsSheet;
    private addCashClosuresSheet;
    private addCommissionsSheet;
    private generateReportFile;
    private buildZipPackage;
    private resolveInvoiceFolder;
    private buildInvoiceFilename;
    private sanitizeFileName;
}

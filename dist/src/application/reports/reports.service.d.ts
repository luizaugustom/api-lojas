import { PrismaService } from '../../infrastructure/database/prisma.service';
import { GenerateReportDto, ReportType } from './dto/generate-report.dto';
export declare class ReportsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    generateReport(companyId: string, generateReportDto: GenerateReportDto): Promise<{
        contentType: string;
        data: {
            company: {
                id: string;
                name: string;
                cnpj: string;
                email: string;
                phone: string;
                stateRegistration: string;
                municipalRegistration: string;
            };
            reportMetadata: {
                type: ReportType;
                generatedAt: string;
                period: {
                    startDate: string;
                    endDate: string;
                };
            };
            data: any;
        };
    } | {
        contentType: string;
        data: string;
    } | {
        contentType: string;
        data: Buffer<ArrayBufferLike>;
    }>;
    private generateSalesReport;
    private generateProductsReport;
    private generateInvoicesReport;
    private generateCompleteReport;
    private getBillsToPay;
    private getCashClosures;
    private convertToXML;
    private convertToExcel;
    private addCompanyInfo;
    private addSalesSheet;
    private addProductsSheet;
    private addInvoicesSheet;
    private addBillsSheet;
    private addCashClosuresSheet;
}

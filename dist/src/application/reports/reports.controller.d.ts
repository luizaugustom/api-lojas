import { Response } from 'express';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    generateReport(user: any, generateReportDto: GenerateReportDto, res: Response): Promise<Response<any, Record<string, any>>>;
}

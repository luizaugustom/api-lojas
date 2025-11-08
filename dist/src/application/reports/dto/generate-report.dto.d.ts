export declare enum ReportType {
    SALES = "sales",
    PRODUCTS = "products",
    INVOICES = "invoices",
    COMPLETE = "complete"
}
export declare enum ReportFormat {
    JSON = "json",
    XML = "xml",
    EXCEL = "excel"
}
export declare class GenerateReportDto {
    reportType: ReportType;
    format: ReportFormat;
    startDate?: string;
    endDate?: string;
    sellerId?: string;
    includeDocuments?: boolean;
}

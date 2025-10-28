import { ConfigService } from '@nestjs/config';
export interface IBPTTaxData {
    ncm: string;
    description: string;
    nacionalFederal: number;
    importadosFederal: number;
    estadual: number;
    municipal: number;
    vigenciaInicio: string;
    vigenciaFim: string;
    chave: string;
    versao: string;
    fonte: string;
}
export interface TaxCalculationResult {
    ncm: string;
    totalTaxPercentage: number;
    federalTaxPercentage: number;
    stateTaxPercentage: number;
    municipalTaxPercentage: number;
    taxValue: number;
    productValue: number;
    source: string;
}
export declare class IBPTService {
    private readonly configService;
    private readonly logger;
    private readonly httpClient;
    private readonly ibptToken;
    private readonly ibptCnpj;
    private readonly defaultStateUf;
    private taxCache;
    private readonly CACHE_TTL;
    constructor(configService: ConfigService);
    calculateProductTax(ncm: string, productValue: number, stateUf?: string): Promise<TaxCalculationResult>;
    private fetchIBPTData;
    private buildTaxResult;
    private calculateEstimatedTax;
    calculateMultipleProductsTax(products: Array<{
        ncm: string;
        value: number;
    }>, stateUf?: string): Promise<TaxCalculationResult[]>;
    clearCache(): void;
    checkIBPTAvailability(): Promise<boolean>;
}

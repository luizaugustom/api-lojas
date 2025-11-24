export declare enum TaxRegime {
    SIMPLES_NACIONAL = "SIMPLES_NACIONAL",
    LUCRO_PRESUMIDO = "LUCRO_PRESUMIDO",
    LUCRO_REAL = "LUCRO_REAL",
    MEI = "MEI"
}
export declare class UpdateFiscalConfigDto {
    taxRegime?: TaxRegime;
    cnae?: string;
    certificatePassword?: string;
    certificateFileUrl?: string;
    nfceSerie?: string;
    municipioIbge?: string;
    csc?: string;
    idTokenCsc?: string;
}

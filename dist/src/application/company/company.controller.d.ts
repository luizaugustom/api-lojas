import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateFiscalConfigDto } from './dto/update-fiscal-config.dto';
import { UpdateCatalogPageDto } from './dto/update-catalog-page.dto';
import { UpdateCompanyDataPeriodDto } from './dto/update-data-period.dto';
import { UpdateFocusNfeConfigDto } from './dto/update-focus-nfe-config.dto';
import { PlanLimitsService } from '../../shared/services/plan-limits.service';
export declare class CompanyController {
    private readonly companyService;
    private readonly planLimitsService;
    constructor(companyService: CompanyService, planLimitsService: PlanLimitsService);
    create(user: any, createCompanyDto: CreateCompanyDto): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        cnpj: string;
        email: string;
        phone: string;
        logoUrl: string;
        brandColor: string;
        plan: import(".prisma/client").$Enums.PlanType;
        isActive: boolean;
        autoMessageAllowed: boolean;
        catalogPageAllowed: boolean;
        maxProducts: number;
        maxCustomers: number;
        maxSellers: number;
        photoUploadEnabled: boolean;
        maxPhotosPerProduct: number;
        nfceEmissionEnabled: boolean;
        nfeEmissionEnabled: boolean;
    }>;
    findAll(user: any): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        cnpj: string;
        email: string;
        phone: string;
        logoUrl: string;
        brandColor: string;
        plan: import(".prisma/client").$Enums.PlanType;
        isActive: boolean;
        autoMessageAllowed: boolean;
        catalogPageAllowed: boolean;
        maxProducts: number;
        maxCustomers: number;
        maxSellers: number;
        photoUploadEnabled: boolean;
        maxPhotosPerProduct: number;
        nfceEmissionEnabled: boolean;
        nfeEmissionEnabled: boolean;
        _count: {
            sellers: number;
            products: number;
            sales: number;
        };
    }[]>;
    findMyCompany(user: any): Promise<{
        number: string;
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        admin: {
            id: string;
            login: string;
        };
        cnpj: string;
        email: string;
        phone: string;
        stateRegistration: string;
        municipalRegistration: string;
        logoUrl: string;
        brandColor: string;
        plan: import(".prisma/client").$Enums.PlanType;
        isActive: boolean;
        zipCode: string;
        state: string;
        city: string;
        district: string;
        street: string;
        complement: string;
        beneficiaryName: string;
        beneficiaryCpfCnpj: string;
        bankCode: string;
        bankName: string;
        agency: string;
        accountNumber: string;
        accountType: string;
        autoMessageAllowed: boolean;
        catalogPageAllowed: boolean;
        defaultDataPeriod: import(".prisma/client").$Enums.DataPeriodFilter;
        maxProducts: number;
        maxCustomers: number;
        maxSellers: number;
        photoUploadEnabled: boolean;
        maxPhotosPerProduct: number;
        nfceEmissionEnabled: boolean;
        nfeEmissionEnabled: boolean;
        _count: {
            sellers: number;
            products: number;
            sales: number;
            customers: number;
        };
    }>;
    getStats(user: any): Promise<{
        totalSalesValue: number | import("@prisma/client/runtime/library").Decimal;
        pendingBillsValue: number | import("@prisma/client/runtime/library").Decimal;
        sellers: number;
        products: number;
        sales: number;
        customers: number;
        billsToPay: number;
    }>;
    getPlanUsage(user: any): Promise<{
        plan: import(".prisma/client").$Enums.PlanType;
        limits: import("../../shared/services/plan-limits.service").PlanLimits;
        usage: {
            products: {
                current: number;
                max: number;
                percentage: number;
                available: number;
            };
            sellers: {
                current: number;
                max: number;
                percentage: number;
                available: number;
            };
            billsToPay: {
                current: number;
                max: number;
                percentage: number;
                available: number;
            };
            customers: {
                current: number;
                max: number;
                percentage: number;
                available: number;
            };
        };
    }>;
    getPlanWarnings(user: any): Promise<{
        nearLimit: boolean;
        warnings: string[];
    }>;
    findOne(id: string): Promise<{
        number: string;
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        admin: {
            id: string;
            login: string;
        };
        cnpj: string;
        email: string;
        phone: string;
        stateRegistration: string;
        municipalRegistration: string;
        logoUrl: string;
        brandColor: string;
        plan: import(".prisma/client").$Enums.PlanType;
        isActive: boolean;
        zipCode: string;
        state: string;
        city: string;
        district: string;
        street: string;
        complement: string;
        beneficiaryName: string;
        beneficiaryCpfCnpj: string;
        bankCode: string;
        bankName: string;
        agency: string;
        accountNumber: string;
        accountType: string;
        autoMessageAllowed: boolean;
        catalogPageAllowed: boolean;
        defaultDataPeriod: import(".prisma/client").$Enums.DataPeriodFilter;
        maxProducts: number;
        maxCustomers: number;
        maxSellers: number;
        photoUploadEnabled: boolean;
        maxPhotosPerProduct: number;
        nfceEmissionEnabled: boolean;
        nfeEmissionEnabled: boolean;
        _count: {
            sellers: number;
            products: number;
            sales: number;
            customers: number;
        };
    }>;
    updateMyCompany(user: any, updateCompanyDto: UpdateCompanyDto): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        cnpj: string;
        email: string;
        phone: string;
        logoUrl: string;
        brandColor: string;
        plan: import(".prisma/client").$Enums.PlanType;
        isActive: boolean;
        autoMessageAllowed: boolean;
        catalogPageAllowed: boolean;
        maxProducts: number;
        maxCustomers: number;
        maxSellers: number;
        photoUploadEnabled: boolean;
        maxPhotosPerProduct: number;
        nfceEmissionEnabled: boolean;
        nfeEmissionEnabled: boolean;
    }>;
    updateDataPeriod(user: any, updateDataPeriodDto: UpdateCompanyDataPeriodDto): Promise<{
        message: string;
        dataPeriod: import(".prisma/client").$Enums.DataPeriodFilter;
    }>;
    activate(id: string): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        cnpj: string;
        email: string;
        phone: string;
        plan: import(".prisma/client").$Enums.PlanType;
        isActive: boolean;
    }>;
    deactivate(id: string): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        cnpj: string;
        email: string;
        phone: string;
        plan: import(".prisma/client").$Enums.PlanType;
        isActive: boolean;
    }>;
    update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        cnpj: string;
        email: string;
        phone: string;
        logoUrl: string;
        brandColor: string;
        plan: import(".prisma/client").$Enums.PlanType;
        isActive: boolean;
        autoMessageAllowed: boolean;
        catalogPageAllowed: boolean;
        maxProducts: number;
        maxCustomers: number;
        maxSellers: number;
        photoUploadEnabled: boolean;
        maxPhotosPerProduct: number;
        nfceEmissionEnabled: boolean;
        nfeEmissionEnabled: boolean;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    updateFiscalConfig(user: any, updateFiscalConfigDto: UpdateFiscalConfigDto): Promise<{
        message: string;
        id: string;
        name: string;
        cnpj: string;
        stateRegistration: string;
        nfceSerie: string;
        municipioIbge: string;
        idTokenCsc: string;
    }>;
    getFiscalConfig(user: any): Promise<{
        id: string;
        name: string;
        cnpj: string;
        stateRegistration: string;
        municipalRegistration: string;
        state: string;
        city: string;
        taxRegime: import(".prisma/client").$Enums.TaxRegime;
        cnae: string;
        hasCertificatePassword: boolean;
        certificatePasswordMasked: string;
        certificateFileUrl: string;
        nfceSerie: string;
        municipioIbge: string;
        hasCsc: boolean;
        cscMasked: string;
        idTokenCsc: string;
        hasFocusNfeApiKey: boolean;
        adminHasFocusNfeApiKey: boolean;
        focusNfeEnvironment: string;
    }>;
    hasValidFiscalConfig(user: any): Promise<{
        hasValidConfig: boolean;
    }>;
    uploadCertificate(user: any, file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        empresaId: string;
        data: any;
        status?: undefined;
        focusNfeResponse?: undefined;
    } | {
        message: string;
        status: string;
        focusNfeResponse: any;
        success?: undefined;
        empresaId?: undefined;
        data?: undefined;
    }>;
    testFocusNfe(user: any): Promise<{
        success: boolean;
        message: string;
        empresaCadastrada?: undefined;
        ambiente?: undefined;
        dados?: undefined;
        detalhe?: undefined;
        status?: undefined;
    } | {
        success: boolean;
        message: string;
        empresaCadastrada: boolean;
        ambiente: string;
        dados: any;
        detalhe?: undefined;
        status?: undefined;
    } | {
        success: boolean;
        message: string;
        detalhe: any;
        status: any;
        empresaCadastrada?: undefined;
        ambiente?: undefined;
        dados?: undefined;
    }>;
    uploadLogo(user: any, file: Express.Multer.File): Promise<{
        success: boolean;
        logoUrl: string;
        message: string;
    }>;
    removeLogo(user: any): Promise<{
        success: boolean;
        message: string;
    }>;
    enableAutoMessages(user: any): Promise<{
        success: boolean;
        autoMessageEnabled: boolean;
        message: string;
    }>;
    disableAutoMessages(user: any): Promise<{
        success: boolean;
        autoMessageEnabled: boolean;
        message: string;
    }>;
    getAutoMessageStatus(user: any): Promise<{
        autoMessageEnabled: boolean;
        totalUnpaidInstallments: number;
        totalMessagesSent: number;
    }>;
    updateCatalogPage(user: any, updateCatalogPageDto: UpdateCatalogPageDto): Promise<{
        message: string;
        id: string;
        name: string;
        catalogPageUrl: string;
        catalogPageEnabled: boolean;
        success: boolean;
    }>;
    getCatalogPageConfig(user: any): Promise<{
        catalogPageUrl: string;
        catalogPageEnabled: boolean;
        catalogPageAllowed: boolean;
        pageUrl: string;
    }>;
    updateFocusNfeConfig(id: string, updateFocusNfeConfigDto: UpdateFocusNfeConfigDto): Promise<{
        id: string;
        name: string;
        hasFocusNfeApiKey: boolean;
        focusNfeApiKey: string;
        focusNfeEnvironment: string;
        hasIbptToken: boolean;
        ibptToken: string;
        message: string;
    }>;
    getFocusNfeConfig(id: string): Promise<{
        id: string;
        name: string;
        hasFocusNfeApiKey: boolean;
        focusNfeApiKey: string;
        focusNfeEnvironment: string;
        isUsingCompanyConfig: boolean;
        isUsingAdminConfig: boolean;
        hasIbptToken: boolean;
        ibptToken: string;
    }>;
    getFiscalConfigForAdmin(id: string): Promise<{
        id: string;
        name: string;
        cnpj: string;
        stateRegistration: string;
        municipalRegistration: string;
        state: string;
        city: string;
        taxRegime: import(".prisma/client").$Enums.TaxRegime;
        cnae: string;
        certificatePassword: string;
        certificateFileUrl: string;
        nfceSerie: string;
        municipioIbge: string;
        csc: string;
        idTokenCsc: string;
        focusNfeApiKey: string;
        focusNfeEnvironment: string;
    }>;
}

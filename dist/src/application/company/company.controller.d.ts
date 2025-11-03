import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateFiscalConfigDto } from './dto/update-fiscal-config.dto';
import { UpdateCatalogPageDto } from './dto/update-catalog-page.dto';
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
        plan: import(".prisma/client").$Enums.PlanType;
        isActive: boolean;
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
        plan: import(".prisma/client").$Enums.PlanType;
        isActive: boolean;
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
        plan: import(".prisma/client").$Enums.PlanType;
        isActive: boolean;
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
        plan: import(".prisma/client").$Enums.PlanType;
        isActive: boolean;
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
        nfceSerie: string;
        municipioIbge: string;
        hasCsc: boolean;
        cscMasked: string;
        idTokenCsc: string;
    }>;
    hasValidFiscalConfig(user: any): Promise<{
        hasValidConfig: boolean;
    }>;
    uploadCertificate(user: any, file: Express.Multer.File): Promise<{
        message: string;
        status: string;
        focusNfeResponse: any;
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
        pageUrl: string;
    }>;
}

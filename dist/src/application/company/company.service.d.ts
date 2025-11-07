import { PrismaService } from '../../infrastructure/database/prisma.service';
import { HashService } from '../../shared/services/hash.service';
import { EncryptionService } from '../../shared/services/encryption.service';
import { ValidationService } from '../../shared/services/validation.service';
import { UploadService } from '../upload/upload.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateFiscalConfigDto } from './dto/update-fiscal-config.dto';
import { UpdateCatalogPageDto } from './dto/update-catalog-page.dto';
import { DataPeriodFilter } from '@prisma/client';
export declare class CompanyService {
    private readonly prisma;
    private readonly hashService;
    private readonly encryptionService;
    private readonly validationService;
    private readonly uploadService;
    private readonly logger;
    constructor(prisma: PrismaService, hashService: HashService, encryptionService: EncryptionService, validationService: ValidationService, uploadService: UploadService);
    create(adminId: string, createCompanyDto: CreateCompanyDto): Promise<{
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
    findAll(adminId?: string): Promise<{
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
        defaultDataPeriod: import(".prisma/client").$Enums.DataPeriodFilter;
        _count: {
            sellers: number;
            products: number;
            sales: number;
            customers: number;
        };
    }>;
    updateDataPeriod(id: string, dataPeriod: DataPeriodFilter): Promise<{
        message: string;
        dataPeriod: import(".prisma/client").$Enums.DataPeriodFilter;
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
    getCompanyStats(id: string): Promise<{
        totalSalesValue: number | import("@prisma/client/runtime/library").Decimal;
        pendingBillsValue: number | import("@prisma/client/runtime/library").Decimal;
        sellers: number;
        products: number;
        sales: number;
        customers: number;
        billsToPay: number;
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
    updateFiscalConfig(companyId: string, updateFiscalConfigDto: UpdateFiscalConfigDto): Promise<{
        message: string;
        id: string;
        name: string;
        cnpj: string;
        stateRegistration: string;
        nfceSerie: string;
        municipioIbge: string;
        idTokenCsc: string;
    }>;
    getFiscalConfig(companyId: string): Promise<{
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
    hasValidFiscalConfig(companyId: string): Promise<boolean>;
    uploadCertificateToFocusNfe(companyId: string, file: Express.Multer.File): Promise<{
        message: string;
        status: string;
        focusNfeResponse: any;
    }>;
    uploadLogo(companyId: string, file: Express.Multer.File): Promise<{
        success: boolean;
        logoUrl: string;
        message: string;
    }>;
    removeLogo(companyId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private validateLogoFile;
    private removeLogoFile;
    toggleAutoMessages(companyId: string, enabled: boolean): Promise<{
        success: boolean;
        autoMessageEnabled: boolean;
        message: string;
    }>;
    getAutoMessageStatus(companyId: string): Promise<{
        autoMessageEnabled: boolean;
        totalUnpaidInstallments: number;
        totalMessagesSent: number;
    }>;
    updateCatalogPage(companyId: string, updateCatalogPageDto: UpdateCatalogPageDto): Promise<{
        message: string;
        id: string;
        name: string;
        catalogPageUrl: string;
        catalogPageEnabled: boolean;
        success: boolean;
    }>;
    getCatalogPageConfig(companyId: string): Promise<{
        catalogPageUrl: string;
        catalogPageEnabled: boolean;
        pageUrl: string;
    }>;
    getPublicCatalogData(url: string): Promise<{
        company: {
            id: string;
            name: string;
            phone: string;
            email: string;
            logoUrl: string;
            brandColor: string;
            address: string;
        };
        products: {
            price: string;
            id: string;
            name: string;
            photos: string[];
            size: string;
            stockQuantity: number;
            category: string;
        }[];
    }>;
}

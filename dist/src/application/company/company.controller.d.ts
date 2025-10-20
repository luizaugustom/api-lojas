import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
export declare class CompanyController {
    private readonly companyService;
    constructor(companyService: CompanyService);
    create(user: any, createCompanyDto: CreateCompanyDto): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        cnpj: string;
        email: string;
        phone: string;
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
        isActive: boolean;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}

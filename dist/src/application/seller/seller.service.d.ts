import { PrismaService } from '../../infrastructure/database/prisma.service';
import { HashService } from '../../shared/services/hash.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
export declare class SellerService {
    private readonly prisma;
    private readonly hashService;
    private readonly logger;
    constructor(prisma: PrismaService, hashService: HashService);
    create(companyId: string, createSellerDto: CreateSellerDto): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string;
        phone: string;
        cpf: string;
    }>;
    findAll(companyId?: string): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string;
        phone: string;
        company: {
            id: string;
            name: string;
        };
        cpf: string;
        _count: {
            sales: number;
        };
    }[]>;
    findOne(id: string, companyId?: string): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string;
        phone: string;
        company: {
            id: string;
            name: string;
        };
        cpf: string;
        birthDate: Date;
        _count: {
            sales: number;
        };
    }>;
    update(id: string, updateSellerDto: UpdateSellerDto, companyId?: string): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string;
        phone: string;
        cpf: string;
    }>;
    remove(id: string, companyId?: string): Promise<{
        message: string;
    }>;
    getSellerStats(id: string, companyId?: string): Promise<{
        totalSales: number;
        totalSalesValue: number | import("@prisma/client/runtime/library").Decimal;
        monthlySales: number;
        monthlySalesValue: number | import("@prisma/client/runtime/library").Decimal;
    }>;
    getSellerSales(id: string, companyId?: string, page?: number, limit?: number): Promise<{
        sales: ({
            items: ({
                product: {
                    id: string;
                    name: string;
                    barcode: string;
                };
            } & {
                id: string;
                createdAt: Date;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                saleId: string;
                productId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            change: import("@prisma/client/runtime/library").Decimal;
            clientCpfCnpj: string | null;
            clientName: string | null;
            isInstallment: boolean;
            saleDate: Date;
            sellerId: string;
            cashClosureId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}

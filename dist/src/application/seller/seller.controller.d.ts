import { SellerService } from './seller.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
export declare class SellerController {
    private readonly sellerService;
    constructor(sellerService: SellerService);
    create(user: any, createSellerDto: CreateSellerDto): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string;
        phone: string;
        cpf: string;
    }>;
    findAll(user: any): Promise<{
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
    findMyProfile(user: any): Promise<{
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
    getMyStats(user: any): Promise<{
        totalSales: number;
        totalSalesValue: number | import("@prisma/client/runtime/library").Decimal;
        monthlySales: number;
        monthlySalesValue: number | import("@prisma/client/runtime/library").Decimal;
    }>;
    getMySales(user: any, page?: number, limit?: number): Promise<{
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
    findOne(id: string, user: any): Promise<{
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
    getStats(id: string, user: any): Promise<{
        totalSales: number;
        totalSalesValue: number | import("@prisma/client/runtime/library").Decimal;
        monthlySales: number;
        monthlySalesValue: number | import("@prisma/client/runtime/library").Decimal;
    }>;
    getSales(id: string, user: any, page?: number, limit?: number): Promise<{
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
    updateMyProfile(user: any, updateSellerDto: UpdateSellerDto): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string;
        phone: string;
        cpf: string;
    }>;
    update(id: string, updateSellerDto: UpdateSellerDto, user: any): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string;
        phone: string;
        cpf: string;
    }>;
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
}

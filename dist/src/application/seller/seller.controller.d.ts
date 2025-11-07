import { SellerService } from './seller.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import { UpdateSellerDataPeriodDto } from './dto/update-seller-data-period.dto';
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
        commissionRate: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAll(user: any): Promise<{
        monthlySalesValue: number | import("@prisma/client/runtime/library").Decimal;
        monthlySalesCount: number;
        totalRevenue: number | import("@prisma/client/runtime/library").Decimal;
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
        commissionRate: import("@prisma/client/runtime/library").Decimal;
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
        commissionRate: import("@prisma/client/runtime/library").Decimal;
        _count: {
            sales: number;
        };
    }>;
    getMyStats(user: any): Promise<{
        totalSales: number;
        totalRevenue: number;
        averageSaleValue: number;
        monthlySales: number;
        monthlySalesValue: number;
        salesByPeriod: {
            date: string;
            total: number;
            revenue: number;
        }[];
        topProducts: {
            productId: string;
            productName: string;
            quantity: number;
            revenue: number;
        }[];
    }>;
    getMySales(user: any, page?: number, limit?: number, startDate?: string, endDate?: string): Promise<{
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
                saleId: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                productId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            sellerId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            change: import("@prisma/client/runtime/library").Decimal;
            clientCpfCnpj: string | null;
            clientName: string | null;
            isInstallment: boolean;
            saleDate: Date;
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
        commissionRate: import("@prisma/client/runtime/library").Decimal;
        _count: {
            sales: number;
        };
    }>;
    getStats(id: string, user: any): Promise<{
        totalSales: number;
        totalRevenue: number;
        averageSaleValue: number;
        monthlySales: number;
        monthlySalesValue: number;
        salesByPeriod: {
            date: string;
            total: number;
            revenue: number;
        }[];
        topProducts: {
            productId: string;
            productName: string;
            quantity: number;
            revenue: number;
        }[];
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
                saleId: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                productId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            sellerId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            change: import("@prisma/client/runtime/library").Decimal;
            clientCpfCnpj: string | null;
            clientName: string | null;
            isInstallment: boolean;
            saleDate: Date;
            cashClosureId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    updateMyProfile(user: any, updateSellerProfileDto: UpdateSellerProfileDto): Promise<{
        id: string;
        login: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string;
        phone: string;
        cpf: string;
        commissionRate: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateMyDataPeriod(user: any, updateDataPeriodDto: UpdateSellerDataPeriodDto): Promise<{
        message: string;
        dataPeriod: import(".prisma/client").$Enums.DataPeriodFilter;
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
        commissionRate: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
}

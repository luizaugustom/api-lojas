import { PrismaService } from '../../infrastructure/database/prisma.service';
import { HashService } from '../../shared/services/hash.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { PlanLimitsService } from '../../shared/services/plan-limits.service';
import { DataPeriodFilter } from '@prisma/client';
export declare class SellerService {
    private readonly prisma;
    private readonly hashService;
    private readonly planLimitsService;
    private readonly logger;
    constructor(prisma: PrismaService, hashService: HashService, planLimitsService: PlanLimitsService);
    create(companyId: string, createSellerDto: CreateSellerDto): Promise<{
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
    findAll(companyId?: string): Promise<{
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
        commissionRate: import("@prisma/client/runtime/library").Decimal;
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
        commissionRate: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateDataPeriod(id: string, dataPeriod: DataPeriodFilter): Promise<{
        message: string;
        dataPeriod: import(".prisma/client").$Enums.DataPeriodFilter;
    }>;
    remove(id: string, companyId?: string): Promise<{
        message: string;
    }>;
    getSellerStats(id: string, companyId?: string): Promise<{
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
    getSellerSales(id: string, companyId?: string, page?: number, limit?: number, startDate?: string, endDate?: string): Promise<{
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
}

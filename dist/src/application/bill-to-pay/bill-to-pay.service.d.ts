import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateBillToPayDto } from './dto/create-bill-to-pay.dto';
import { UpdateBillToPayDto } from './dto/update-bill-to-pay.dto';
import { MarkAsPaidDto } from './dto/mark-as-paid.dto';
import { PlanLimitsService } from '../../shared/services/plan-limits.service';
export declare class BillToPayService {
    private readonly prisma;
    private readonly planLimitsService;
    private readonly logger;
    constructor(prisma: PrismaService, planLimitsService: PlanLimitsService);
    create(companyId: string, createBillToPayDto: CreateBillToPayDto): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        barcode: string | null;
        title: string;
        paymentInfo: string | null;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        paidAt: Date | null;
    }>;
    findAll(companyId?: string, page?: number, limit?: number, isPaid?: boolean, startDate?: string, endDate?: string): Promise<{
        bills: ({
            company: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            barcode: string | null;
            title: string;
            paymentInfo: string | null;
            dueDate: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            isPaid: boolean;
            paidAt: Date | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, companyId?: string): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        barcode: string | null;
        title: string;
        paymentInfo: string | null;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        paidAt: Date | null;
    }>;
    update(id: string, updateBillToPayDto: UpdateBillToPayDto, companyId?: string): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        barcode: string | null;
        title: string;
        paymentInfo: string | null;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        paidAt: Date | null;
    }>;
    remove(id: string, companyId?: string): Promise<{
        message: string;
    }>;
    markAsPaid(id: string, markAsPaidDto: MarkAsPaidDto, companyId?: string): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        barcode: string | null;
        title: string;
        paymentInfo: string | null;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        paidAt: Date | null;
    }>;
    getOverdueBills(companyId?: string): Promise<({
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        barcode: string | null;
        title: string;
        paymentInfo: string | null;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        paidAt: Date | null;
    })[]>;
    getUpcomingBills(companyId?: string, days?: number): Promise<({
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        barcode: string | null;
        title: string;
        paymentInfo: string | null;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        paidAt: Date | null;
    })[]>;
    getBillStats(companyId?: string): Promise<{
        totalBills: number;
        paidBills: number;
        pendingBills: number;
        overdueBills: number;
        totalPendingAmount: number | import("@prisma/client/runtime/library").Decimal;
        totalPaidAmount: number | import("@prisma/client/runtime/library").Decimal;
    }>;
}

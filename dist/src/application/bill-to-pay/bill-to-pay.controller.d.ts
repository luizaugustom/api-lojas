import { BillToPayService } from './bill-to-pay.service';
import { CreateBillToPayDto } from './dto/create-bill-to-pay.dto';
import { UpdateBillToPayDto } from './dto/update-bill-to-pay.dto';
import { MarkAsPaidDto } from './dto/mark-as-paid.dto';
export declare class BillToPayController {
    private readonly billToPayService;
    constructor(billToPayService: BillToPayService);
    create(user: any, createBillToPayDto: CreateBillToPayDto): Promise<{
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
    findAll(user: any, page?: number, limit?: number, isPaid?: boolean, startDate?: string, endDate?: string): Promise<{
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
    getStats(user: any): Promise<{
        totalBills: number;
        paidBills: number;
        pendingBills: number;
        overdueBills: number;
        totalPendingAmount: number | import("@prisma/client/runtime/library").Decimal;
        totalPaidAmount: number | import("@prisma/client/runtime/library").Decimal;
    }>;
    getOverdue(user: any): Promise<({
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
    getUpcoming(user: any, days?: number): Promise<({
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
    findOne(id: string, user: any): Promise<{
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
    update(id: string, updateBillToPayDto: UpdateBillToPayDto, user: any): Promise<{
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
    markAsPaid(id: string, markAsPaidDto: MarkAsPaidDto, user: any): Promise<{
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
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
}

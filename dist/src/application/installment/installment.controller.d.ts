import { InstallmentService } from './installment.service';
import { CreateInstallmentDto } from './dto/create-installment.dto';
import { UpdateInstallmentDto } from './dto/update-installment.dto';
import { PayInstallmentDto } from './dto/pay-installment.dto';
import { BulkPayInstallmentsDto } from './dto/bulk-pay-installments.dto';
export declare class InstallmentController {
    private readonly installmentService;
    constructor(installmentService: InstallmentService);
    create(user: any, createInstallmentDto: CreateInstallmentDto): Promise<{
        customer: {
            id: string;
            name: string;
            cpfCnpj: string;
        };
        sale: {
            id: string;
            total: import("@prisma/client/runtime/library").Decimal;
            saleDate: Date;
        };
        payments: {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            paymentMethod: string;
            paymentDate: Date;
            installmentId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        paidAt: Date | null;
        description: string | null;
        installmentNumber: number;
        totalInstallments: number;
        remainingAmount: import("@prisma/client/runtime/library").Decimal;
        lastMessageSentAt: Date | null;
        messageCount: number;
        saleId: string;
        customerId: string;
    }>;
    findAll(user: any, customerId?: string, isPaid?: string): Promise<({
        customer: {
            id: string;
            name: string;
            email: string;
            phone: string;
            cpfCnpj: string;
        };
        sale: {
            id: string;
            total: import("@prisma/client/runtime/library").Decimal;
            saleDate: Date;
        };
        payments: {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            paymentMethod: string;
            paymentDate: Date;
            installmentId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        paidAt: Date | null;
        description: string | null;
        installmentNumber: number;
        totalInstallments: number;
        remainingAmount: import("@prisma/client/runtime/library").Decimal;
        lastMessageSentAt: Date | null;
        messageCount: number;
        saleId: string;
        customerId: string;
    })[]>;
    findOverdue(user: any, customerId?: string): Promise<({
        customer: {
            id: string;
            name: string;
            email: string;
            phone: string;
            cpfCnpj: string;
        };
        sale: {
            id: string;
            total: import("@prisma/client/runtime/library").Decimal;
            saleDate: Date;
        };
        payments: {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            paymentMethod: string;
            paymentDate: Date;
            installmentId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        paidAt: Date | null;
        description: string | null;
        installmentNumber: number;
        totalInstallments: number;
        remainingAmount: import("@prisma/client/runtime/library").Decimal;
        lastMessageSentAt: Date | null;
        messageCount: number;
        saleId: string;
        customerId: string;
    })[]>;
    getStats(user: any): Promise<{
        totalInstallments: number;
        paidInstallments: number;
        pendingInstallments: number;
        overdueInstallments: number;
        totalReceivable: number;
        overdueAmount: number;
    }>;
    getCustomerDebtSummary(customerId: string, user: any): Promise<{
        totalDebt: number;
        totalInstallments: number;
        overdueInstallments: number;
        overdueAmount: number;
        installments: {
            id: string;
            dueDate: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            installmentNumber: number;
            totalInstallments: number;
            remainingAmount: import("@prisma/client/runtime/library").Decimal;
        }[];
    }>;
    findOne(id: string, user: any): Promise<{
        customer: {
            id: string;
            name: string;
            email: string;
            phone: string;
            cpfCnpj: string;
        };
        sale: {
            id: string;
            total: import("@prisma/client/runtime/library").Decimal;
            saleDate: Date;
        };
        payments: {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            paymentMethod: string;
            paymentDate: Date;
            installmentId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        paidAt: Date | null;
        description: string | null;
        installmentNumber: number;
        totalInstallments: number;
        remainingAmount: import("@prisma/client/runtime/library").Decimal;
        lastMessageSentAt: Date | null;
        messageCount: number;
        saleId: string;
        customerId: string;
    }>;
    update(id: string, updateInstallmentDto: UpdateInstallmentDto, user: any): Promise<{
        customer: {
            id: string;
            name: string;
            cpfCnpj: string;
        };
        sale: {
            id: string;
            total: import("@prisma/client/runtime/library").Decimal;
            saleDate: Date;
        };
        payments: {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            paymentMethod: string;
            paymentDate: Date;
            installmentId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        paidAt: Date | null;
        description: string | null;
        installmentNumber: number;
        totalInstallments: number;
        remainingAmount: import("@prisma/client/runtime/library").Decimal;
        lastMessageSentAt: Date | null;
        messageCount: number;
        saleId: string;
        customerId: string;
    }>;
    pay(id: string, payInstallmentDto: PayInstallmentDto, user: any): Promise<{
        installment: {
            customer: {
                id: string;
                name: string;
                cpfCnpj: string;
            };
            sale: {
                id: string;
                total: import("@prisma/client/runtime/library").Decimal;
                saleDate: Date;
            };
            payments: {
                id: string;
                createdAt: Date;
                amount: import("@prisma/client/runtime/library").Decimal;
                notes: string | null;
                paymentMethod: string;
                paymentDate: Date;
                installmentId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            dueDate: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            isPaid: boolean;
            paidAt: Date | null;
            description: string | null;
            installmentNumber: number;
            totalInstallments: number;
            remainingAmount: import("@prisma/client/runtime/library").Decimal;
            lastMessageSentAt: Date | null;
            messageCount: number;
            saleId: string;
            customerId: string;
        };
        payment: {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            paymentMethod: string;
            paymentDate: Date;
            installmentId: string;
        };
        message: string;
    }>;
    bulkPay(customerId: string, bulkPayInstallmentsDto: BulkPayInstallmentsDto, user: any): Promise<{
        message: string;
        customerId: string;
        totalPaid: number;
        payments: {
            installmentId: string;
            amountPaid: number;
            remainingAmount: number;
            isPaid: boolean;
            dueDate: Date | null;
            message: string;
        }[];
    }>;
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
}

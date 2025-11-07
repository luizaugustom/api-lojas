import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateInstallmentDto } from './dto/create-installment.dto';
import { UpdateInstallmentDto } from './dto/update-installment.dto';
import { PayInstallmentDto } from './dto/pay-installment.dto';
import { BulkPayInstallmentsDto } from './dto/bulk-pay-installments.dto';
export declare class InstallmentService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(companyId: string, createInstallmentDto: CreateInstallmentDto): Promise<{
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
            paymentMethod: string;
            paymentDate: Date;
            notes: string | null;
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
    findAll(companyId?: string, customerId?: string, isPaid?: boolean): Promise<({
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
            paymentMethod: string;
            paymentDate: Date;
            notes: string | null;
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
    findOverdue(companyId?: string, customerId?: string): Promise<({
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
            paymentMethod: string;
            paymentDate: Date;
            notes: string | null;
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
    findOne(id: string, companyId?: string): Promise<{
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
            paymentMethod: string;
            paymentDate: Date;
            notes: string | null;
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
    update(id: string, updateInstallmentDto: UpdateInstallmentDto, companyId?: string): Promise<{
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
            paymentMethod: string;
            paymentDate: Date;
            notes: string | null;
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
    remove(id: string, companyId?: string): Promise<{
        message: string;
    }>;
    payInstallment(id: string, payInstallmentDto: PayInstallmentDto, companyId?: string): Promise<{
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
                paymentMethod: string;
                paymentDate: Date;
                notes: string | null;
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
            paymentMethod: string;
            paymentDate: Date;
            notes: string | null;
            installmentId: string;
        };
        message: string;
    }>;
    payCustomerInstallments(customerId: string, bulkPayInstallmentsDto: BulkPayInstallmentsDto, companyId?: string): Promise<{
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
    getCustomerDebtSummary(customerId: string, companyId?: string): Promise<{
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
    getCompanyStats(companyId: string): Promise<{
        totalInstallments: number;
        paidInstallments: number;
        pendingInstallments: number;
        overdueInstallments: number;
        totalReceivable: number;
        overdueAmount: number;
    }>;
}

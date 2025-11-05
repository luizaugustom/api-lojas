import { Request, Response } from 'express';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
export declare class BudgetController {
    private readonly budgetService;
    constructor(budgetService: BudgetService);
    create(user: any, createBudgetDto: CreateBudgetDto): Promise<{
        company: {
            number: string;
            id: string;
            name: string;
            cnpj: string;
            email: string;
            phone: string;
            logoUrl: string;
            district: string;
            street: string;
        };
        seller: {
            id: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                barcode: string;
                price: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            budgetId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        sellerId: string | null;
        clientEmail: string | null;
        total: import("@prisma/client/runtime/library").Decimal;
        clientCpfCnpj: string | null;
        clientName: string | null;
        status: string;
        notes: string | null;
        validUntil: Date;
        clientPhone: string | null;
        budgetNumber: number;
        budgetDate: Date;
    }>;
    findAll(user: any, status?: string, sellerId?: string): Promise<({
        seller: {
            id: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                barcode: string;
                price: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            budgetId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        sellerId: string | null;
        clientEmail: string | null;
        total: import("@prisma/client/runtime/library").Decimal;
        clientCpfCnpj: string | null;
        clientName: string | null;
        status: string;
        notes: string | null;
        validUntil: Date;
        clientPhone: string | null;
        budgetNumber: number;
        budgetDate: Date;
    })[]>;
    findOne(user: any, id: string): Promise<{
        company: {
            number: string;
            id: string;
            name: string;
            cnpj: string;
            email: string;
            phone: string;
            logoUrl: string;
            state: string;
            city: string;
            district: string;
            street: string;
        };
        seller: {
            id: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                barcode: string;
                price: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            budgetId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        sellerId: string | null;
        clientEmail: string | null;
        total: import("@prisma/client/runtime/library").Decimal;
        clientCpfCnpj: string | null;
        clientName: string | null;
        status: string;
        notes: string | null;
        validUntil: Date;
        clientPhone: string | null;
        budgetNumber: number;
        budgetDate: Date;
    }>;
    update(user: any, id: string, updateBudgetDto: UpdateBudgetDto): Promise<{
        seller: {
            id: string;
            login: string;
            password: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            email: string | null;
            phone: string | null;
            cpf: string | null;
            birthDate: Date | null;
            commissionRate: import("@prisma/client/runtime/library").Decimal;
            hasIndividualCash: boolean;
            companyId: string;
        };
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                companyId: string;
                barcode: string;
                photos: string[];
                size: string | null;
                stockQuantity: number;
                price: import("@prisma/client/runtime/library").Decimal;
                category: string | null;
                expirationDate: Date | null;
                ncm: string | null;
                cfop: string | null;
                unitOfMeasure: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            budgetId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        sellerId: string | null;
        clientEmail: string | null;
        total: import("@prisma/client/runtime/library").Decimal;
        clientCpfCnpj: string | null;
        clientName: string | null;
        status: string;
        notes: string | null;
        validUntil: Date;
        clientPhone: string | null;
        budgetNumber: number;
        budgetDate: Date;
    }>;
    remove(user: any, id: string): Promise<{
        message: string;
    }>;
    print(user: any, id: string, req: Request): Promise<{
        message: string;
    }>;
    generatePdf(user: any, id: string, res: Response): Promise<Response<any, Record<string, any>>>;
    convertToSale(user: any, id: string): Promise<{
        message: string;
        budgetData: {
            items: {
                productId: string;
                quantity: number;
            }[];
            clientName: string;
            clientCpfCnpj: string;
        };
    }>;
}

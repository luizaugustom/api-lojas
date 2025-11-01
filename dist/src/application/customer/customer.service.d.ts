import { PrismaService } from '../../infrastructure/database/prisma.service';
import { EmailService } from '../../shared/services/email.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomerService {
    private readonly prisma;
    private readonly emailService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService);
    create(companyId: string, createCustomerDto: CreateCustomerDto): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        number: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string | null;
        phone: string | null;
        zipCode: string | null;
        state: string | null;
        city: string | null;
        district: string | null;
        street: string | null;
        complement: string | null;
        companyId: string;
        cpfCnpj: string | null;
    }>;
    findAll(companyId?: string, page?: number, limit?: number, search?: string): Promise<{
        customers: ({
            company: {
                id: string;
                name: string;
            };
        } & {
            number: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            email: string | null;
            phone: string | null;
            zipCode: string | null;
            state: string | null;
            city: string | null;
            district: string | null;
            street: string | null;
            complement: string | null;
            companyId: string;
            cpfCnpj: string | null;
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
        number: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string | null;
        phone: string | null;
        zipCode: string | null;
        state: string | null;
        city: string | null;
        district: string | null;
        street: string | null;
        complement: string | null;
        companyId: string;
        cpfCnpj: string | null;
    }>;
    findByCpfCnpj(cpfCnpj: string, companyId?: string): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        number: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string | null;
        phone: string | null;
        zipCode: string | null;
        state: string | null;
        city: string | null;
        district: string | null;
        street: string | null;
        complement: string | null;
        companyId: string;
        cpfCnpj: string | null;
    }>;
    update(id: string, updateCustomerDto: UpdateCustomerDto, companyId?: string): Promise<{
        company: {
            id: string;
            name: string;
        };
    } & {
        number: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string | null;
        phone: string | null;
        zipCode: string | null;
        state: string | null;
        city: string | null;
        district: string | null;
        street: string | null;
        complement: string | null;
        companyId: string;
        cpfCnpj: string | null;
    }>;
    remove(id: string, companyId?: string): Promise<{
        message: string;
    }>;
    getCustomerStats(companyId?: string): Promise<{
        totalCustomers: number;
        customersWithCpf: number;
        customersWithCnpj: number;
    }>;
    getCustomerInstallments(customerId: string, companyId?: string): Promise<{
        data: ({
            sale: {
                seller: {
                    id: string;
                    name: string;
                };
                items: ({
                    product: {
                        id: string;
                        name: string;
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
        })[];
    }>;
    sendPromotionalEmail(customerId: string, promotionData: any): Promise<boolean>;
    sendSaleConfirmationEmail(customerId: string, saleId: string): Promise<boolean>;
    sendBulkPromotionalEmail(companyId: string, promotionData: any): Promise<{
        sent: number;
        failed: number;
    }>;
}

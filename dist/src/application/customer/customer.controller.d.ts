import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { SendPromotionalEmailDto, SendBulkPromotionalEmailDto } from './dto/send-email.dto';
export declare class CustomerController {
    private readonly customerService;
    constructor(customerService: CustomerService);
    create(user: any, createCustomerDto: CreateCustomerDto): Promise<{
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
    findAll(user: any, page?: number, limit?: number, search?: string): Promise<{
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
    getStats(user: any): Promise<{
        totalCustomers: number;
        customersWithCpf: number;
        customersWithCnpj: number;
    }>;
    findByCpfCnpj(cpfCnpj: string, user: any): Promise<{
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
    findOne(id: string, user: any): Promise<{
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
    getInstallments(id: string, user: any): Promise<{
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
                paymentDate: Date;
                paymentMethod: string;
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
    update(id: string, updateCustomerDto: UpdateCustomerDto, user: any): Promise<{
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
    sendPromotionalEmail(id: string, promotionalEmailDto: SendPromotionalEmailDto, user: any): Promise<boolean>;
    sendSaleConfirmationEmail(id: string, saleId: string, user: any): Promise<boolean>;
    sendBulkPromotionalEmail(bulkPromotionalEmailDto: SendBulkPromotionalEmailDto, user: any): Promise<{
        sent: number;
        failed: number;
    }>;
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
}

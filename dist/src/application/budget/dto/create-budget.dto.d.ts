export declare class BudgetItemDto {
    productId: string;
    quantity: number;
}
export declare class CreateBudgetDto {
    sellerId?: string;
    items: BudgetItemDto[];
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    clientCpfCnpj?: string;
    notes?: string;
    validUntil: string;
}

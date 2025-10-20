export declare enum PaymentMethod {
    CREDIT_CARD = "credit_card",
    DEBIT_CARD = "debit_card",
    CASH = "cash",
    PIX = "pix",
    INSTALLMENT = "installment"
}
export declare class NFeItemDto {
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}
export declare class GenerateNFeDto {
    clientCpfCnpj?: string;
    clientName?: string;
    items: NFeItemDto[];
    totalValue: number;
    paymentMethod: PaymentMethod[];
}

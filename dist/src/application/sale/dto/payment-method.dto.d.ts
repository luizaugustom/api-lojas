export declare enum PaymentMethod {
    CREDIT_CARD = "credit_card",
    DEBIT_CARD = "debit_card",
    CASH = "cash",
    PIX = "pix",
    INSTALLMENT = "installment"
}
export declare class PaymentMethodDto {
    method: PaymentMethod;
    amount: number;
    additionalInfo?: string;
    customerId?: string;
    installments?: number;
    firstDueDate?: Date;
    description?: string;
}

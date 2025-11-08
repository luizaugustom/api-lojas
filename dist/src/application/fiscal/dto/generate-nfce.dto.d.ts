export declare enum PaymentMethod {
    CREDIT_CARD = "credit_card",
    DEBIT_CARD = "debit_card",
    CASH = "cash",
    PIX = "pix",
    INSTALLMENT = "installment",
    STORE_CREDIT = "store_credit"
}
export declare class NFCeItemDto {
    productId: string;
    productName: string;
    barcode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}
export declare class NFCePaymentDto {
    method: PaymentMethod;
    amount: number;
}
export declare class GenerateNFCeDto {
    saleId: string;
    sellerName: string;
    clientCpfCnpj?: string;
    clientName?: string;
    items: NFCeItemDto[];
    totalValue: number;
    paymentMethod?: PaymentMethod[];
    payments?: NFCePaymentDto[];
    additionalInfo?: string;
    operationNature?: string;
    emissionPurpose?: number;
    referenceAccessKey?: string;
}

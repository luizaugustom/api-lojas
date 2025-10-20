export declare enum PaymentMethod {
    CREDIT_CARD = "credit_card",
    DEBIT_CARD = "debit_card",
    CASH = "cash",
    PIX = "pix",
    INSTALLMENT = "installment"
}
export declare class NFCeItemDto {
    productId: string;
    productName: string;
    barcode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}
export declare class GenerateNFCeDto {
    saleId: string;
    sellerName: string;
    clientCpfCnpj?: string;
    clientName?: string;
    items: NFCeItemDto[];
    totalValue: number;
    paymentMethod: PaymentMethod[];
}

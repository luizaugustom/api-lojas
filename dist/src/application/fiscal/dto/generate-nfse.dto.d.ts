export declare enum PaymentMethod {
    CREDIT_CARD = "credit_card",
    DEBIT_CARD = "debit_card",
    CASH = "cash",
    PIX = "pix",
    INSTALLMENT = "installment"
}
export declare class GenerateNFSeDto {
    clientCpfCnpj?: string;
    clientName?: string;
    serviceDescription: string;
    serviceValue: number;
    paymentMethod: PaymentMethod[];
}

export declare enum PaymentMethod {
    CREDIT_CARD = "credit_card",
    DEBIT_CARD = "debit_card",
    CASH = "cash",
    PIX = "pix",
    INSTALLMENT = "installment"
}
export declare class RecipientAddressDto {
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
}
export declare class RecipientDto {
    document: string;
    name: string;
    email?: string;
    phone?: string;
    address?: RecipientAddressDto;
}
export declare class NFeManualItemDto {
    description: string;
    quantity: number;
    unitPrice: number;
    ncm?: string;
    cfop: string;
    unitOfMeasure: string;
}
export declare class PaymentInfoDto {
    method: string;
}
export declare class GenerateNFeDto {
    saleId?: string;
    recipient?: RecipientDto;
    items?: NFeManualItemDto[];
    payment?: PaymentInfoDto;
    additionalInfo?: string;
}

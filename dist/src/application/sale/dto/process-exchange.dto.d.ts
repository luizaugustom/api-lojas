import { PaymentMethod } from './payment-method.dto';
export declare class ExchangeReturnedItemDto {
    saleItemId: string;
    productId: string;
    quantity: number;
}
export declare class ExchangeNewItemDto {
    productId: string;
    quantity: number;
    unitPrice?: number;
}
export declare class ExchangePaymentDto {
    method: PaymentMethod;
    amount: number;
    additionalInfo?: string;
}
export declare class ProcessExchangeDto {
    originalSaleId: string;
    reason: string;
    note?: string;
    returnedItems: ExchangeReturnedItemDto[];
    newItems?: ExchangeNewItemDto[];
    payments?: ExchangePaymentDto[];
    refunds?: ExchangePaymentDto[];
    issueStoreCredit?: boolean;
}

import { PaymentMethodDto } from './payment-method.dto';
export declare class SaleItemDto {
    productId: string;
    quantity: number;
}
export declare class CreateSaleDto {
    sellerId?: string;
    items: SaleItemDto[];
    clientCpfCnpj?: string;
    clientName?: string;
    paymentMethods: PaymentMethodDto[];
    totalPaid?: number;
}

export declare class SendPromotionalEmailDto {
    title: string;
    message: string;
    description?: string;
    discount?: string;
    validUntil?: string;
}
export declare class SendBulkPromotionalEmailDto extends SendPromotionalEmailDto {
}

export declare enum BroadcastTarget {
    ALL = "all",
    COMPANIES = "companies",
    SELLERS = "sellers"
}
export declare class BroadcastNotificationDto {
    title: string;
    message: string;
    target: BroadcastTarget;
    actionUrl?: string;
    actionLabel?: string;
    expiresAt?: string;
}

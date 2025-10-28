export declare enum NotificationType {
    STOCK_ALERT = "stock_alert",
    BILL_REMINDER = "bill_reminder",
    SALE_ALERT = "sale_alert",
    SYSTEM_UPDATE = "system_update",
    PAYMENT_REMINDER = "payment_reminder",
    LOW_STOCK = "low_stock",
    GENERAL = "general"
}
export declare enum NotificationPriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent"
}
export declare class CreateNotificationDto {
    userId: string;
    userRole: string;
    type: NotificationType;
    title: string;
    message: string;
    priority?: NotificationPriority;
    category?: string;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: string;
    expiresAt?: string;
}

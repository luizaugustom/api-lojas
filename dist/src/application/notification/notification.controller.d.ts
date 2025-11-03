import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    create(createNotificationDto: CreateNotificationDto): Promise<{
        id: string;
        createdAt: Date;
        category: string | null;
        title: string;
        metadata: string | null;
        message: string;
        priority: string;
        type: string;
        userId: string;
        expiresAt: Date | null;
        userRole: string;
        actionUrl: string | null;
        actionLabel: string | null;
        isRead: boolean;
        readAt: Date | null;
    }>;
    getPreferences(req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        userRole: string;
        stockAlerts: boolean;
        billReminders: boolean;
        weeklyReports: boolean;
        salesAlerts: boolean;
        systemUpdates: boolean;
        emailEnabled: boolean;
        inAppEnabled: boolean;
    }>;
    updatePreferences(req: any, updateDto: UpdateNotificationPreferencesDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        userRole: string;
        stockAlerts: boolean;
        billReminders: boolean;
        weeklyReports: boolean;
        salesAlerts: boolean;
        systemUpdates: boolean;
        emailEnabled: boolean;
        inAppEnabled: boolean;
    }>;
    getUnreadCount(req: any): Promise<{
        count: number;
    }>;
    markAllAsRead(req: any): Promise<{
        count: number;
    }>;
    findAll(req: any, onlyUnread?: boolean): Promise<{
        id: string;
        createdAt: Date;
        category: string | null;
        title: string;
        metadata: string | null;
        message: string;
        priority: string;
        type: string;
        userId: string;
        expiresAt: Date | null;
        userRole: string;
        actionUrl: string | null;
        actionLabel: string | null;
        isRead: boolean;
        readAt: Date | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        category: string | null;
        title: string;
        metadata: string | null;
        message: string;
        priority: string;
        type: string;
        userId: string;
        expiresAt: Date | null;
        userRole: string;
        actionUrl: string | null;
        actionLabel: string | null;
        isRead: boolean;
        readAt: Date | null;
    }>;
    markAsRead(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        category: string | null;
        title: string;
        metadata: string | null;
        message: string;
        priority: string;
        type: string;
        userId: string;
        expiresAt: Date | null;
        userRole: string;
        actionUrl: string | null;
        actionLabel: string | null;
        isRead: boolean;
        readAt: Date | null;
    }>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}

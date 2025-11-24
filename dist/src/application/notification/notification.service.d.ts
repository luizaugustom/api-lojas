import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
export declare class NotificationService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
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
    findAllByUser(userId: string, userRole: string, onlyUnread?: boolean): Promise<{
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
    markAsRead(id: string, userId: string, userRole: string): Promise<{
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
    markAllAsRead(userId: string, userRole: string): Promise<{
        count: number;
    }>;
    delete(id: string, userId: string, userRole: string): Promise<{
        message: string;
    }>;
    getUnreadCount(userId: string, userRole: string): Promise<{
        count: number;
    }>;
    getPreferences(userId: string, userRole: string): Promise<{
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
    updatePreferences(userId: string, userRole: string, updateDto: UpdateNotificationPreferencesDto): Promise<{
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
    private shouldSendNotification;
    createStockAlert(companyId: string, productName: string, quantity: number): Promise<{
        success: boolean;
    }>;
    createBillReminder(companyId: string, billTitle: string, dueDate: Date, amount: number): Promise<{
        success: boolean;
    }>;
    createSaleAlert(userId: string, userRole: string, saleTotal: number, items: number): Promise<{
        success: boolean;
    }>;
    cleanExpiredNotifications(): Promise<{
        count: number;
    }>;
    broadcastNotification(title: string, message: string, target: 'all' | 'companies' | 'sellers', actionUrl?: string, actionLabel?: string, expiresAt?: string): Promise<{
        message: string;
        count: number;
        target: "companies" | "sellers" | "all";
    }>;
}

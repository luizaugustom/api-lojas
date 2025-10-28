"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
let NotificationService = NotificationService_1 = class NotificationService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(NotificationService_1.name);
    }
    async create(createNotificationDto) {
        try {
            const notification = await this.prisma.notification.create({
                data: {
                    ...createNotificationDto,
                    expiresAt: createNotificationDto.expiresAt
                        ? new Date(createNotificationDto.expiresAt)
                        : undefined,
                },
            });
            this.logger.log(`Notification created: ${notification.id} for user: ${notification.userId}`);
            return notification;
        }
        catch (error) {
            this.logger.error('Error creating notification:', error);
            throw error;
        }
    }
    async findAllByUser(userId, userRole, onlyUnread = false) {
        const where = {
            userId,
            userRole,
        };
        if (onlyUnread) {
            where.isRead = false;
        }
        where.OR = [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
        ];
        return this.prisma.notification.findMany({
            where,
            orderBy: [
                { isRead: 'asc' },
                { createdAt: 'desc' },
            ],
        });
    }
    async findOne(id) {
        const notification = await this.prisma.notification.findUnique({
            where: { id },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notificação não encontrada');
        }
        return notification;
    }
    async markAsRead(id, userId, userRole) {
        try {
            const notification = await this.prisma.notification.findUnique({
                where: { id },
            });
            if (!notification) {
                throw new common_1.NotFoundException('Notificação não encontrada');
            }
            if (notification.userId !== userId || notification.userRole !== userRole) {
                throw new common_1.NotFoundException('Notificação não encontrada');
            }
            const updated = await this.prisma.notification.update({
                where: { id },
                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });
            this.logger.log(`Notification marked as read: ${id}`);
            return updated;
        }
        catch (error) {
            this.logger.error('Error marking notification as read:', error);
            throw error;
        }
    }
    async markAllAsRead(userId, userRole) {
        try {
            const result = await this.prisma.notification.updateMany({
                where: {
                    userId,
                    userRole,
                    isRead: false,
                },
                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });
            this.logger.log(`Marked ${result.count} notifications as read for user: ${userId}`);
            return { count: result.count };
        }
        catch (error) {
            this.logger.error('Error marking all notifications as read:', error);
            throw error;
        }
    }
    async delete(id, userId, userRole) {
        try {
            const notification = await this.prisma.notification.findUnique({
                where: { id },
            });
            if (!notification) {
                throw new common_1.NotFoundException('Notificação não encontrada');
            }
            if (notification.userId !== userId || notification.userRole !== userRole) {
                throw new common_1.NotFoundException('Notificação não encontrada');
            }
            await this.prisma.notification.delete({
                where: { id },
            });
            this.logger.log(`Notification deleted: ${id}`);
            return { message: 'Notificação removida com sucesso' };
        }
        catch (error) {
            this.logger.error('Error deleting notification:', error);
            throw error;
        }
    }
    async getUnreadCount(userId, userRole) {
        const count = await this.prisma.notification.count({
            where: {
                userId,
                userRole,
                isRead: false,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gte: new Date() } },
                ],
            },
        });
        return { count };
    }
    async getPreferences(userId, userRole) {
        let preferences = await this.prisma.notificationPreference.findUnique({
            where: {
                userId_userRole: {
                    userId,
                    userRole,
                },
            },
        });
        if (!preferences) {
            preferences = await this.prisma.notificationPreference.create({
                data: {
                    userId,
                    userRole,
                },
            });
            this.logger.log(`Created default notification preferences for user: ${userId}`);
        }
        return preferences;
    }
    async updatePreferences(userId, userRole, updateDto) {
        try {
            this.logger.log(`Updating preferences for user: ${userId} (${userRole})`);
            this.logger.log(`Update data: ${JSON.stringify(updateDto)}`);
            const existing = await this.getPreferences(userId, userRole);
            this.logger.log(`Existing preferences found: ${existing.id}`);
            const updated = await this.prisma.notificationPreference.update({
                where: {
                    userId_userRole: {
                        userId,
                        userRole,
                    },
                },
                data: updateDto,
            });
            this.logger.log(`Successfully updated notification preferences for user: ${userId}`);
            return updated;
        }
        catch (error) {
            this.logger.error('Error updating notification preferences:', error);
            this.logger.error(`User: ${userId}, Role: ${userRole}, Data: ${JSON.stringify(updateDto)}`);
            throw error;
        }
    }
    async createStockAlert(companyId, productName, quantity) {
        return this.create({
            userId: companyId,
            userRole: 'company',
            type: 'stock_alert',
            title: 'Estoque Baixo',
            message: `O produto "${productName}" está com estoque baixo (${quantity} unidades restantes)`,
            priority: 'high',
            category: 'estoque',
            actionUrl: '/products',
            actionLabel: 'Ver Produtos',
            metadata: JSON.stringify({ productName, quantity }),
        });
    }
    async createBillReminder(companyId, billTitle, dueDate, amount) {
        const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return this.create({
            userId: companyId,
            userRole: 'company',
            type: 'bill_reminder',
            title: 'Conta a Vencer',
            message: `A conta "${billTitle}" vence em ${daysUntilDue} dia(s). Valor: R$ ${amount.toFixed(2)}`,
            priority: daysUntilDue <= 3 ? 'urgent' : 'normal',
            category: 'financeiro',
            actionUrl: '/bills',
            actionLabel: 'Ver Contas',
            metadata: JSON.stringify({ billTitle, dueDate, amount }),
        });
    }
    async createSaleAlert(userId, userRole, saleTotal, items) {
        return this.create({
            userId,
            userRole,
            type: 'sale_alert',
            title: 'Nova Venda Realizada',
            message: `Venda de R$ ${saleTotal.toFixed(2)} com ${items} item(ns) foi registrada com sucesso!`,
            priority: 'normal',
            category: 'vendas',
            actionUrl: '/sales',
            actionLabel: 'Ver Vendas',
            metadata: JSON.stringify({ saleTotal, items }),
        });
    }
    async cleanExpiredNotifications() {
        const result = await this.prisma.notification.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
        this.logger.log(`Cleaned ${result.count} expired notifications`);
        return { count: result.count };
    }
    async broadcastNotification(title, message, target, actionUrl, actionLabel, expiresAt) {
        try {
            const notifications = [];
            if (target === 'companies' || target === 'all') {
                const companies = await this.prisma.company.findMany({
                    select: { id: true },
                });
                for (const company of companies) {
                    notifications.push({
                        userId: company.id,
                        userRole: 'company',
                        type: 'system_update',
                        title,
                        message,
                        priority: 'normal',
                        category: 'sistema',
                        actionUrl: actionUrl || null,
                        actionLabel: actionLabel || null,
                        expiresAt: expiresAt ? new Date(expiresAt) : null,
                    });
                }
            }
            if (target === 'sellers' || target === 'all') {
                const sellers = await this.prisma.seller.findMany({
                    select: { id: true },
                });
                for (const seller of sellers) {
                    notifications.push({
                        userId: seller.id,
                        userRole: 'seller',
                        type: 'system_update',
                        title,
                        message,
                        priority: 'normal',
                        category: 'sistema',
                        actionUrl: actionUrl || null,
                        actionLabel: actionLabel || null,
                        expiresAt: expiresAt ? new Date(expiresAt) : null,
                    });
                }
            }
            const result = await this.prisma.notification.createMany({
                data: notifications,
            });
            this.logger.log(`Broadcast notification sent to ${result.count} users (target: ${target})`);
            return {
                message: 'Notificação enviada com sucesso',
                count: result.count,
                target,
            };
        }
        catch (error) {
            this.logger.error('Error broadcasting notification:', error);
            throw error;
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map
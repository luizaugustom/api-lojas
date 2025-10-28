import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== NOTIFICAÇÕES ====================

  async create(createNotificationDto: CreateNotificationDto) {
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
    } catch (error) {
      this.logger.error('Error creating notification:', error);
      throw error;
    }
  }

  async findAllByUser(userId: string, userRole: string, onlyUnread = false) {
    const where: any = {
      userId,
      userRole,
    };

    if (onlyUnread) {
      where.isRead = false;
    }

    // Filtrar notificações não expiradas
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gte: new Date() } },
    ];

    return this.prisma.notification.findMany({
      where,
      orderBy: [
        { isRead: 'asc' }, // Não lidas primeiro
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }

    return notification;
  }

  async markAsRead(id: string, userId: string, userRole: string) {
    try {
      // Verificar se a notificação pertence ao usuário
      const notification = await this.prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        throw new NotFoundException('Notificação não encontrada');
      }

      if (notification.userId !== userId || notification.userRole !== userRole) {
        throw new NotFoundException('Notificação não encontrada');
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
    } catch (error) {
      this.logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string, userRole: string) {
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
    } catch (error) {
      this.logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async delete(id: string, userId: string, userRole: string) {
    try {
      // Verificar se a notificação pertence ao usuário
      const notification = await this.prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        throw new NotFoundException('Notificação não encontrada');
      }

      if (notification.userId !== userId || notification.userRole !== userRole) {
        throw new NotFoundException('Notificação não encontrada');
      }

      await this.prisma.notification.delete({
        where: { id },
      });

      this.logger.log(`Notification deleted: ${id}`);
      return { message: 'Notificação removida com sucesso' };
    } catch (error) {
      this.logger.error('Error deleting notification:', error);
      throw error;
    }
  }

  async getUnreadCount(userId: string, userRole: string) {
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

  // ==================== PREFERÊNCIAS ====================

  async getPreferences(userId: string, userRole: string) {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_userRole: {
          userId,
          userRole,
        },
      },
    });

    // Se não existir, criar com valores padrão
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

  async updatePreferences(
    userId: string,
    userRole: string,
    updateDto: UpdateNotificationPreferencesDto,
  ) {
    try {
      this.logger.log(`Updating preferences for user: ${userId} (${userRole})`);
      this.logger.log(`Update data: ${JSON.stringify(updateDto)}`);
      
      // Buscar ou criar preferências
      const existing = await this.getPreferences(userId, userRole);
      this.logger.log(`Existing preferences found: ${existing.id}`);

      // Atualizar preferências
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
    } catch (error) {
      this.logger.error('Error updating notification preferences:', error);
      this.logger.error(`User: ${userId}, Role: ${userRole}, Data: ${JSON.stringify(updateDto)}`);
      throw error;
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  async createStockAlert(companyId: string, productName: string, quantity: number) {
    return this.create({
      userId: companyId,
      userRole: 'company',
      type: 'stock_alert' as any,
      title: 'Estoque Baixo',
      message: `O produto "${productName}" está com estoque baixo (${quantity} unidades restantes)`,
      priority: 'high' as any,
      category: 'estoque',
      actionUrl: '/products',
      actionLabel: 'Ver Produtos',
      metadata: JSON.stringify({ productName, quantity }),
    });
  }

  async createBillReminder(companyId: string, billTitle: string, dueDate: Date, amount: number) {
    const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    return this.create({
      userId: companyId,
      userRole: 'company',
      type: 'bill_reminder' as any,
      title: 'Conta a Vencer',
      message: `A conta "${billTitle}" vence em ${daysUntilDue} dia(s). Valor: R$ ${amount.toFixed(2)}`,
      priority: daysUntilDue <= 3 ? ('urgent' as any) : ('normal' as any),
      category: 'financeiro',
      actionUrl: '/bills',
      actionLabel: 'Ver Contas',
      metadata: JSON.stringify({ billTitle, dueDate, amount }),
    });
  }

  async createSaleAlert(userId: string, userRole: string, saleTotal: number, items: number) {
    return this.create({
      userId,
      userRole,
      type: 'sale_alert' as any,
      title: 'Nova Venda Realizada',
      message: `Venda de R$ ${saleTotal.toFixed(2)} com ${items} item(ns) foi registrada com sucesso!`,
      priority: 'normal' as any,
      category: 'vendas',
      actionUrl: '/sales',
      actionLabel: 'Ver Vendas',
      metadata: JSON.stringify({ saleTotal, items }),
    });
  }

  // Limpar notificações expiradas (pode ser chamado por um cron job)
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

  // ==================== BROADCAST (ADMIN) ====================

  async broadcastNotification(
    title: string,
    message: string,
    target: 'all' | 'companies' | 'sellers',
    actionUrl?: string,
    actionLabel?: string,
    expiresAt?: string,
  ) {
    try {
      const notifications = [];

      // Buscar usuários baseado no target
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

      // Criar todas as notificações
      const result = await this.prisma.notification.createMany({
        data: notifications,
      });

      this.logger.log(
        `Broadcast notification sent to ${result.count} users (target: ${target})`,
      );

      return {
        message: 'Notificação enviada com sucesso',
        count: result.count,
        target,
      };
    } catch (error) {
      this.logger.error('Error broadcasting notification:', error);
      throw error;
    }
  }
}


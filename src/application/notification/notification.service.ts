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

  /**
   * Verifica se a empresa tem a preferência de notificação ativada
   */
  private async shouldSendNotification(
    userId: string,
    userRole: string,
    preferenceType: 'stockAlerts' | 'billReminders' | 'salesAlerts' | 'weeklyReports' | 'systemUpdates',
  ): Promise<boolean> {
    try {
      const preferences = await this.getPreferences(userId, userRole);
      
      // Verificar se a preferência específica está ativada
      if (!preferences[preferenceType]) {
        this.logger.debug(
          `Notificação ${preferenceType} desabilitada para usuário ${userId} (${userRole})`,
        );
        return false;
      }

      // Verificar se pelo menos um canal está habilitado
      if (!preferences.emailEnabled && !preferences.inAppEnabled) {
        this.logger.debug(
          `Nenhum canal de notificação habilitado para usuário ${userId} (${userRole})`,
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Erro ao verificar preferências de notificação: ${error.message}`);
      // Em caso de erro, permitir notificação para não bloquear funcionalidades
      return true;
    }
  }

  async createStockAlert(companyId: string, productName: string, quantity: number) {
    // Verificar se a empresa tem alertas de estoque ativados
    const shouldSend = await this.shouldSendNotification(companyId, 'company', 'stockAlerts');
    if (!shouldSend) {
      this.logger.debug(`Alertas de estoque desabilitados para empresa ${companyId}`);
      return null;
    }

    const preferences = await this.getPreferences(companyId, 'company');
    
    // Criar notificação in-app se habilitado
    if (preferences.inAppEnabled) {
      await this.create({
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

    // Enviar email se habilitado
    if (preferences.emailEnabled) {
      // Buscar email da empresa
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { email: true, name: true },
      });

      if (company?.email) {
        // Aqui você pode adicionar envio de email se necessário
        this.logger.log(`Email de alerta de estoque seria enviado para ${company.email}`);
      }
    }

    return { success: true };
  }

  async createBillReminder(companyId: string, billTitle: string, dueDate: Date, amount: number) {
    // Verificar se a empresa tem lembretes de contas ativados
    const shouldSend = await this.shouldSendNotification(companyId, 'company', 'billReminders');
    if (!shouldSend) {
      this.logger.debug(`Lembretes de contas desabilitados para empresa ${companyId}`);
      return null;
    }

    const preferences = await this.getPreferences(companyId, 'company');
    const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    // Criar notificação in-app se habilitado
    if (preferences.inAppEnabled) {
      await this.create({
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

    // Enviar email se habilitado
    if (preferences.emailEnabled) {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { email: true, name: true },
      });

      if (company?.email) {
        this.logger.log(`Email de lembrete de conta seria enviado para ${company.email}`);
      }
    }

    return { success: true };
  }

  async createSaleAlert(userId: string, userRole: string, saleTotal: number, items: number) {
    // Verificar se o usuário tem alertas de vendas ativados
    const shouldSend = await this.shouldSendNotification(userId, userRole, 'salesAlerts');
    if (!shouldSend) {
      this.logger.debug(`Alertas de vendas desabilitados para usuário ${userId} (${userRole})`);
      return null;
    }

    const preferences = await this.getPreferences(userId, userRole);
    
    // Criar notificação in-app se habilitado
    if (preferences.inAppEnabled) {
      await this.create({
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

    // Enviar email se habilitado
    if (preferences.emailEnabled) {
      // Buscar email do usuário (empresa ou vendedor)
      let email: string | null = null;
      if (userRole === 'company') {
        const company = await this.prisma.company.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        email = company?.email || null;
      } else if (userRole === 'seller') {
        const seller = await this.prisma.seller.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        email = seller?.email || null;
      }

      if (email) {
        this.logger.log(`Email de alerta de venda seria enviado para ${email}`);
      }
    }

    return { success: true };
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
          where: { isActive: true },
          select: { id: true },
        });

        for (const company of companies) {
          // Verificar se a empresa tem atualizações do sistema ativadas
          const shouldSend = await this.shouldSendNotification(
            company.id,
            'company',
            'systemUpdates',
          );

          if (shouldSend) {
            const preferences = await this.getPreferences(company.id, 'company');

            // Criar notificação in-app se habilitado
            if (preferences.inAppEnabled) {
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

            // Enviar email se habilitado
            if (preferences.emailEnabled) {
              const companyData = await this.prisma.company.findUnique({
                where: { id: company.id },
                select: { email: true, name: true },
              });

              if (companyData?.email) {
                // Aqui você pode adicionar envio de email se necessário
                this.logger.log(`Email de atualização do sistema seria enviado para ${companyData.email}`);
              }
            }
          }
        }
      }

      if (target === 'sellers' || target === 'all') {
        const sellers = await this.prisma.seller.findMany({
          select: { id: true },
        });

        for (const seller of sellers) {
          // Verificar se o vendedor tem atualizações do sistema ativadas
          const shouldSend = await this.shouldSendNotification(seller.id, 'seller', 'systemUpdates');

          if (shouldSend) {
            const preferences = await this.getPreferences(seller.id, 'seller');

            // Criar notificação in-app se habilitado
            if (preferences.inAppEnabled) {
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

            // Enviar email se habilitado
            if (preferences.emailEnabled) {
              const sellerData = await this.prisma.seller.findUnique({
                where: { id: seller.id },
                select: { email: true, name: true },
              });

              if (sellerData?.email) {
                this.logger.log(`Email de atualização do sistema seria enviado para ${sellerData.email}`);
              }
            }
          }
        }
      }

      // Criar todas as notificações
      if (notifications.length > 0) {
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
      } else {
        this.logger.log(`Nenhuma notificação criada (usuários com preferências desabilitadas)`);
        return {
          message: 'Nenhuma notificação criada',
          count: 0,
          target,
        };
      }
    } catch (error) {
      this.logger.error('Error broadcasting notification:', error);
      throw error;
    }
  }
}


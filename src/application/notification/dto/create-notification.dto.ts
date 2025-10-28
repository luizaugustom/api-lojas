import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum NotificationType {
  STOCK_ALERT = 'stock_alert',
  BILL_REMINDER = 'bill_reminder',
  SALE_ALERT = 'sale_alert',
  SYSTEM_UPDATE = 'system_update',
  PAYMENT_REMINDER = 'payment_reminder',
  LOW_STOCK = 'low_stock',
  GENERAL = 'general',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID do usuário destinatário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Tipo de usuário (admin, company, seller)',
    example: 'company',
  })
  @IsString()
  @IsNotEmpty()
  userRole: string;

  @ApiProperty({
    description: 'Tipo de notificação',
    enum: NotificationType,
    example: NotificationType.STOCK_ALERT,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Título da notificação',
    example: 'Estoque baixo',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Mensagem da notificação',
    example: 'O produto X está com estoque baixo (apenas 5 unidades restantes)',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Prioridade da notificação',
    enum: NotificationPriority,
    example: NotificationPriority.NORMAL,
    required: false,
  })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @ApiProperty({
    description: 'Categoria da notificação',
    example: 'estoque',
    required: false,
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'URL para ação relacionada',
    example: '/products',
    required: false,
  })
  @IsString()
  @IsOptional()
  actionUrl?: string;

  @ApiProperty({
    description: 'Label do botão de ação',
    example: 'Ver Produtos',
    required: false,
  })
  @IsString()
  @IsOptional()
  actionLabel?: string;

  @ApiProperty({
    description: 'Metadados adicionais em JSON',
    example: '{"productId": "123"}',
    required: false,
  })
  @IsString()
  @IsOptional()
  metadata?: string;

  @ApiProperty({
    description: 'Data de expiração da notificação',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}


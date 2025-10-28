import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @ApiProperty({
    description: 'Alertas de estoque baixo',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  stockAlerts?: boolean;

  @ApiProperty({
    description: 'Lembretes de contas a vencer',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  billReminders?: boolean;

  @ApiProperty({
    description: 'Relatórios semanais',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  weeklyReports?: boolean;

  @ApiProperty({
    description: 'Alertas de vendas',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  salesAlerts?: boolean;

  @ApiProperty({
    description: 'Atualizações do sistema',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  systemUpdates?: boolean;

  @ApiProperty({
    description: 'Receber notificações por email',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;

  @ApiProperty({
    description: 'Receber notificações in-app',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  inAppEnabled?: boolean;
}


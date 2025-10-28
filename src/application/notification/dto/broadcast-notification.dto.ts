import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum BroadcastTarget {
  ALL = 'all',
  COMPANIES = 'companies',
  SELLERS = 'sellers',
}

export class BroadcastNotificationDto {
  @ApiProperty({ description: 'Título da notificação' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Mensagem da notificação' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Público-alvo', enum: BroadcastTarget })
  @IsEnum(BroadcastTarget)
  target: BroadcastTarget;

  @ApiProperty({ description: 'URL de ação (opcional)', required: false })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiProperty({ description: 'Label do botão de ação (opcional)', required: false })
  @IsOptional()
  @IsString()
  actionLabel?: string;

  @ApiProperty({ description: 'Data de expiração (opcional)', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}


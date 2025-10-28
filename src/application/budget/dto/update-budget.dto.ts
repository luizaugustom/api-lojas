import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum BudgetStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export class UpdateBudgetDto {
  @ApiProperty({
    description: 'Status do orçamento',
    enum: BudgetStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;

  @ApiProperty({
    description: 'Observações do orçamento',
    example: 'Cliente solicitou revisão de preços',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}


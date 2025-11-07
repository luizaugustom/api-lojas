import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, IsBoolean, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

export class CloseCashClosureDto {
  @ApiProperty({
    description: 'Valor de fechamento do caixa',
    example: 1250.75,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  closingAmount?: number;

  @ApiProperty({
    description: 'Total de saques realizados',
    example: 50.00,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  withdrawals?: number;

  @ApiProperty({
    description: 'Indica se o relatório completo deve ser impresso imediatamente após o fechamento',
    example: true,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  printReport?: boolean;

  @ApiProperty({
    description: 'Data e hora de fechamento informada pelo dispositivo do usuário (ISO8601)',
    example: '2025-11-07T18:15:00-03:00',
    required: false,
  })
  @IsOptional()
  @IsISO8601()
  closingDate?: string;
}

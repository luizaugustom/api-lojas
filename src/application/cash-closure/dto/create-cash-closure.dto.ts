import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCashClosureDto {
  @ApiProperty({
    description: 'Valor de abertura do caixa',
    example: 100.00,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  openingAmount?: number;

  @ApiProperty({
    description: 'Data e hora de abertura informada pelo dispositivo do usuário (ISO8601)',
    example: '2025-11-07T08:00:00-03:00',
    required: false,
  })
  @IsOptional()
  @IsISO8601()
  openingDate?: string;
}

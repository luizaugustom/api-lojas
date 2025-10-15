import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min } from 'class-validator';
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
}

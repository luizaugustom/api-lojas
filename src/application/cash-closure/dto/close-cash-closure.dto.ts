import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min } from 'class-validator';
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
}

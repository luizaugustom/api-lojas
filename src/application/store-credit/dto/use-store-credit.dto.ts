import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class UseStoreCreditDto {
  @ApiProperty({
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsString()
  customerId: string;

  @ApiProperty({
    description: 'Valor do crédito a ser utilizado',
    example: 50.00,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'ID da venda (opcional)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  @IsString()
  saleId?: string;

  @ApiProperty({
    description: 'Descrição da transação (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}


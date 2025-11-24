import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductLossDto {
  @ApiProperty({
    description: 'ID do produto que teve perda',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Quantidade perdida',
    example: 5,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({
    description: 'Motivo da perda',
    example: 'Vencimento',
    enum: ['Vencimento', 'Quebra', 'Roubo', 'Furto', 'Avaria', 'Outros'],
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: 'Observações adicionais sobre a perda',
    example: 'Produtos vencidos no dia 15/12/2024',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'ID do vendedor que registrou a perda (opcional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  sellerId?: string;
}


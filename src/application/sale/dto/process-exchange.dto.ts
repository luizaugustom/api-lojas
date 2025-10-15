import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ProcessExchangeDto {
  @ApiProperty({
    description: 'ID da venda original',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  originalSaleId: string;

  @ApiProperty({
    description: 'ID do produto a ser trocado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Quantidade a ser trocada',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({
    description: 'Motivo da troca',
    example: 'Produto com defeito',
    minLength: 5,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

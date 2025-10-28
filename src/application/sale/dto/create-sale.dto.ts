import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID, Min, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethodDto, PaymentMethod } from './payment-method.dto';

export class SaleItemDto {
  @ApiProperty({
    description: 'ID do produto',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Quantidade do produto',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

export class CreateSaleDto {
  @ApiProperty({
    description: 'ID do vendedor (obrigatório apenas para empresas)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @ApiProperty({
    description: 'Itens da venda',
    type: [SaleItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @ApiProperty({
    description: 'CPF ou CNPJ do cliente',
    example: '123.456.789-00',
    required: false,
  })
  @IsOptional()
  @IsString()
  clientCpfCnpj?: string;

  @ApiProperty({
    description: 'Nome do cliente (obrigatório para vendas a prazo)',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiProperty({
    description: 'Métodos de pagamento com valores específicos',
    type: [PaymentMethodDto],
    example: [
      { method: 'cash', amount: 50.00 },
      { method: 'pix', amount: 30.00 }
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentMethodDto)
  paymentMethods: PaymentMethodDto[];

  @ApiProperty({
    description: 'Valor total pago (para cálculo de troco)',
    example: 150.00,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalPaid?: number;

  @ApiProperty({
    description: 'Se true, não imprime automaticamente a NFC-e (permite confirmação manual)',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  skipPrint?: boolean;
}

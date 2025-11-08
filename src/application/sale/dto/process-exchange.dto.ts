import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from './payment-method.dto';

export class ExchangeReturnedItemDto {
  @ApiProperty({
    description: 'ID do item da venda original',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  saleItemId: string;

  @ApiProperty({
    description: 'ID do produto devolvido',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Quantidade devolvida',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

export class ExchangeNewItemDto {
  @ApiProperty({
    description: 'ID do produto entregue na troca',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Quantidade entregue',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({
    description: 'Preço unitário aplicado (opcional, usa preço atual se omitido)',
    example: 149.9,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice?: number;
}

export class ExchangePaymentDto {
  @ApiProperty({
    description: 'Método de pagamento',
    example: PaymentMethod.CASH,
    enum: PaymentMethod,
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({
    description: 'Valor pago ou reembolsado',
    example: 25.5,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Informações adicionais (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  additionalInfo?: string;
}

export class ProcessExchangeDto {
  @ApiProperty({
    description: 'ID da venda original',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  originalSaleId: string;

  @ApiProperty({
    description: 'Motivo da troca',
    example: 'Produto com defeito',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: 'Observações adicionais',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    description: 'Itens devolvidos da venda original',
    type: [ExchangeReturnedItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExchangeReturnedItemDto)
  returnedItems: ExchangeReturnedItemDto[];

  @ApiProperty({
    description: 'Novos itens entregues ao cliente',
    type: [ExchangeNewItemDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExchangeNewItemDto)
  @IsOptional()
  newItems?: ExchangeNewItemDto[];

  @ApiProperty({
    description: 'Pagamentos recebidos do cliente (quando o novo total é maior)',
    type: [ExchangePaymentDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExchangePaymentDto)
  @IsOptional()
  payments?: ExchangePaymentDto[];

  @ApiProperty({
    description: 'Reembolsos devolvidos ao cliente (quando o novo total é menor)',
    type: [ExchangePaymentDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExchangePaymentDto)
  @IsOptional()
  refunds?: ExchangePaymentDto[];

  @ApiProperty({
    description: 'Gerar crédito em loja ao invés de reembolso imediato',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  issueStoreCredit?: boolean;
}

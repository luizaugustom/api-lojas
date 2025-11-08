import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
  PIX = 'pix',
  INSTALLMENT = 'installment',
  STORE_CREDIT = 'store_credit',
}

export class NFCeItemDto {
  @ApiProperty({
    description: 'ID do produto',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Nome do produto',
    example: 'Produto Exemplo',
  })
  @IsString()
  productName: string;

  @ApiProperty({
    description: 'Código de barras do produto',
    example: '1234567890123',
  })
  @IsString()
  barcode: string;

  @ApiProperty({
    description: 'Quantidade do item',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({
    description: 'Preço unitário do item',
    example: 25.50,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice: number;

  @ApiProperty({
    description: 'Preço total do item',
    example: 51.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalPrice: number;
}

export class NFCePaymentDto {
  @ApiProperty({
    description: 'Método de pagamento',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({
    description: 'Valor pago com este método',
    example: 150.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;
}

export class GenerateNFCeDto {
  @ApiProperty({
    description: 'ID da venda',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  saleId: string;

  @ApiProperty({
    description: 'Nome do vendedor',
    example: 'João Silva',
  })
  @IsString()
  sellerName: string;

  @ApiProperty({
    description: 'CPF ou CNPJ do cliente',
    example: '123.456.789-00',
    required: false,
  })
  @IsOptional()
  @IsString()
  clientCpfCnpj?: string;

  @ApiProperty({
    description: 'Nome do cliente',
    example: 'Maria Santos',
    required: false,
  })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiProperty({
    description: 'Itens da venda',
    type: [NFCeItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NFCeItemDto)
  items: NFCeItemDto[];

  @ApiProperty({
    description: 'Valor total da venda',
    example: 150.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalValue: number;

  @ApiProperty({
    description: 'Métodos de pagamento',
    example: ['cash', 'pix'],
    enum: PaymentMethod,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(PaymentMethod, { each: true })
  paymentMethod?: PaymentMethod[];

  @ApiProperty({
    description: 'Pagamentos detalhados com valores',
    type: [NFCePaymentDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NFCePaymentDto)
  payments?: NFCePaymentDto[];

  @ApiProperty({
    description: 'Informações adicionais para a NFC-e',
    required: false,
  })
  @IsOptional()
  @IsString()
  additionalInfo?: string;

  @ApiProperty({
    description: 'Natureza da operação',
    required: false,
    example: 'Venda de mercadorias',
  })
  @IsOptional()
  @IsString()
  operationNature?: string;

  @ApiProperty({
    description: 'Finalidade da emissão (1=normal, 4=devolução, etc.)',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  emissionPurpose?: number;

  @ApiProperty({
    description: 'Chave de acesso da NFC-e referenciada (para devoluções)',
    required: false,
  })
  @IsOptional()
  @IsString()
  referenceAccessKey?: string;
}


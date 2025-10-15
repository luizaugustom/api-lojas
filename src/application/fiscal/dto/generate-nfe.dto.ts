import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, ValidateNested, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
  PIX = 'pix',
  INSTALLMENT = 'installment',
}

export class NFeItemDto {
  @ApiProperty({
    description: 'ID do produto',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
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

  @ApiProperty({
    description: 'Preço unitário do produto',
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

export class GenerateNFeDto {
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
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiProperty({
    description: 'Itens da NFe',
    type: [NFeItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NFeItemDto)
  items: NFeItemDto[];

  @ApiProperty({
    description: 'Valor total da NFe',
    example: 150.75,
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
  @IsArray()
  @IsEnum(PaymentMethod, { each: true })
  paymentMethod: PaymentMethod[];
}

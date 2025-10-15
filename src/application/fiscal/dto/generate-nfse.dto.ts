import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
  PIX = 'pix',
  INSTALLMENT = 'installment',
}

export class GenerateNFSeDto {
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
    description: 'Descrição do serviço',
    example: 'Consultoria em desenvolvimento de software',
    minLength: 5,
    maxLength: 255,
  })
  @IsString()
  serviceDescription: string;

  @ApiProperty({
    description: 'Valor do serviço',
    example: 500.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  serviceValue: number;

  @ApiProperty({
    description: 'Métodos de pagamento',
    example: ['pix'],
    enum: PaymentMethod,
    isArray: true,
  })
  @IsArray()
  @IsEnum(PaymentMethod, { each: true })
  paymentMethod: PaymentMethod[];
}

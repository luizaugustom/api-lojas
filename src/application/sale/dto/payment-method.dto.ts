import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min, IsString, IsUUID, IsDate } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
  PIX = 'pix',
  INSTALLMENT = 'installment',
}

export class PaymentMethodDto {
  @ApiProperty({
    description: 'Método de pagamento',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({
    description: 'Valor pago neste método específico',
    example: 50.00,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'O valor deve ser pelo menos 0.01' })
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Informações adicionais do pagamento (opcional)',
    example: 'Parcelado em 3x',
    required: false,
  })
  @IsOptional()
  additionalInfo?: string;

  // Campos específicos para vendas a prazo
  @ApiProperty({
    description: 'ID do cliente (obrigatório para vendas a prazo)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({
    description: 'Número de parcelas (obrigatório para vendas a prazo)',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  installments?: number;

  @ApiProperty({
    description: 'Data do primeiro vencimento (obrigatório para vendas a prazo)',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Se for null, undefined ou vazio, retornar undefined
    if (!value || value === null || value === '') {
      return undefined;
    }
    
    // Se já é um Date object válido, manter como está
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value;
    }
    
    // Se é uma string ISO válida, converter para Date
    if (typeof value === 'string' && !isNaN(Date.parse(value))) {
      return new Date(value);
    }
    
    // Se não é válido, retornar undefined
    return undefined;
  })
  @Type(() => Date)
  @IsDate({ message: 'A data de vencimento deve ser uma data válida' })
  firstDueDate?: Date;

  @ApiProperty({
    description: 'Descrição das parcelas (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

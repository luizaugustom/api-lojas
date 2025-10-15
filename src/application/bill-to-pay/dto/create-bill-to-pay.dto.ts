import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBillToPayDto {
  @ApiProperty({
    description: 'Título da conta',
    example: 'Conta de luz - Janeiro 2024',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Código de barras da conta',
    example: '12345678901234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({
    description: 'Informações de pagamento',
    example: 'Pagar na agência do banco',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentInfo?: string;

  @ApiProperty({
    description: 'Data de vencimento',
    example: '2024-02-15',
  })
  @IsDateString()
  dueDate: string;

  @ApiProperty({
    description: 'Valor da conta',
    example: 150.75,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;
}

import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PayInstallmentDto {
  @ApiProperty({ description: 'Valor a ser pago', example: 100.50 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Método de pagamento', example: 'cash' })
  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @ApiProperty({ description: 'Notas/observações', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}


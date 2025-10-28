import { IsNotEmpty, IsString, IsNumber, IsDate, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateInstallmentDto {
  @ApiProperty({ description: 'Número da parcela' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  installmentNumber: number;

  @ApiProperty({ description: 'Total de parcelas' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  totalInstallments: number;

  @ApiProperty({ description: 'Valor da parcela' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Data de vencimento' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  dueDate: Date;

  @ApiProperty({ description: 'Descrição opcional', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID da venda' })
  @IsNotEmpty()
  @IsUUID()
  saleId: string;

  @ApiProperty({ description: 'ID do cliente' })
  @IsNotEmpty()
  @IsUUID()
  customerId: string;
}


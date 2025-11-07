import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

class InstallmentPaymentInputDto {
  @ApiProperty({ description: 'ID da parcela', example: 'c1f4c61a-1234-4f5b-8a1b-1234567890ab' })
  @IsUUID()
  installmentId: string;

  @ApiProperty({
    description: 'Valor a ser pago nesta parcela. Se omitido, será usado o valor restante.',
    example: 150.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;
}

export class BulkPayInstallmentsDto {
  @ApiProperty({
    description: 'Lista de parcelas a serem pagas',
    type: [InstallmentPaymentInputDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => InstallmentPaymentInputDto)
  installments?: InstallmentPaymentInputDto[];

  @ApiProperty({
    description: 'Indica se todas as dívidas do cliente devem ser pagas',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  payAll?: boolean;

  @ApiProperty({ description: 'Método de pagamento utilizado', example: 'cash' })
  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @ApiProperty({ description: 'Notas adicionais para o pagamento', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export { InstallmentPaymentInputDto };


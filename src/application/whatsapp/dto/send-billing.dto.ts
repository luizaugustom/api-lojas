import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class SendInstallmentBillingDto {
  @ApiProperty({
    description: 'ID da parcela a ser cobrada',
    example: 'uuid-da-parcela',
  })
  @IsString()
  @IsNotEmpty()
  installmentId: string;
}

export class SendCustomerBillingDto {
  @ApiProperty({
    description: 'ID do cliente',
    example: 'uuid-do-cliente',
  })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({
    description: 'Enviar cobrança para todas as parcelas pendentes',
    example: false,
    required: false,
  })
  @IsOptional()
  sendAll?: boolean;

  @ApiProperty({
    description: 'IDs específicos das parcelas (se sendAll for false)',
    example: ['uuid-1', 'uuid-2'],
    required: false,
  })
  @IsOptional()
  installmentIds?: string[];
}


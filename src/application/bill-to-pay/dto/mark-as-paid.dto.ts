import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MarkAsPaidDto {
  @ApiProperty({
    description: 'Informações adicionais sobre o pagamento',
    example: 'Pago via PIX em 15/02/2024',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentInfo?: string;
}

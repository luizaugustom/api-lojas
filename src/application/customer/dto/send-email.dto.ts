import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class SendPromotionalEmailDto {
  @ApiProperty({
    description: 'Título da promoção',
    example: 'Oferta Especial - 20% OFF',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Mensagem da promoção',
    example: 'Aproveite nossa oferta especial com 20% de desconto em todos os produtos!',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Descrição detalhada da promoção',
    example: 'Válido para todos os produtos da loja. Não acumula com outras promoções.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Informação sobre desconto',
    example: '20% de desconto',
    required: false,
  })
  @IsOptional()
  @IsString()
  discount?: string;

  @ApiProperty({
    description: 'Data de validade da promoção',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class SendBulkPromotionalEmailDto extends SendPromotionalEmailDto {
  // Herda todas as propriedades de SendPromotionalEmailDto
}

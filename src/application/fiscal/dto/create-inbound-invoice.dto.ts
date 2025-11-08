import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, MaxLength, Matches } from 'class-validator';

export class CreateInboundInvoiceDto {
  @ApiProperty({
    description: 'Chave de acesso da nota fiscal (44 dígitos)',
    example: '35240114200166000187550010000000071123456789',
    minLength: 44,
    maxLength: 44,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{44}$/, { message: 'Chave de acesso deve ter 44 dígitos numéricos' })
  accessKey?: string;

  @ApiProperty({
    description: 'Nome do fornecedor',
    example: 'Fornecedor ABC Ltda',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome do fornecedor é obrigatório' })
  @MaxLength(255, { message: 'Nome do fornecedor deve ter no máximo 255 caracteres' })
  supplierName: string;

  @ApiProperty({
    description: 'Valor total da nota fiscal',
    example: 1500.50,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Total deve ser um número válido' })
  @IsNotEmpty({ message: 'Total é obrigatório' })
  @Min(0, { message: 'Total deve ser maior ou igual a zero' })
  totalValue: number;

  @ApiProperty({
    description: 'Número do documento fiscal',
    example: '123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiProperty({
    description: 'URL do PDF anexado à nota fiscal',
    example: 'https://cdn.exemplo.com/notas/nota123.pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  pdfUrl?: string;
}




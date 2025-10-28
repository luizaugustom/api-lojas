import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, ValidateNested, IsEnum, Min, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
  PIX = 'pix',
  INSTALLMENT = 'installment',
}

// Endereço do destinatário
export class RecipientAddressDto {
  @ApiProperty({ description: 'CEP', example: '88000-000', required: false })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiProperty({ description: 'Logradouro', example: 'Rua das Flores', required: false })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({ description: 'Número', example: '123', required: false })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiProperty({ description: 'Complemento', example: 'Apto 101', required: false })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({ description: 'Bairro', example: 'Centro', required: false })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ description: 'Cidade', example: 'Florianópolis', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'UF', example: 'SC', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  @MinLength(2)
  state?: string;
}

// Dados do destinatário
export class RecipientDto {
  @ApiProperty({ description: 'CPF ou CNPJ do destinatário', example: '123.456.789-00' })
  @IsString()
  document: string;

  @ApiProperty({ description: 'Nome ou Razão Social', example: 'João Silva' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email', example: 'joao@email.com', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Telefone', example: '(48) 99999-9999', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Endereço do destinatário', type: RecipientAddressDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecipientAddressDto)
  address?: RecipientAddressDto;
}

// Item da NF-e (para emissão manual)
export class NFeManualItemDto {
  @ApiProperty({ description: 'Descrição do produto/serviço', example: 'Produto XYZ' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Quantidade', example: 2, minimum: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ description: 'Valor unitário', example: 25.50, minimum: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice: number;

  @ApiProperty({ description: 'NCM (8 dígitos)', example: '85171231', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  @MinLength(8)
  ncm?: string;

  @ApiProperty({ description: 'CFOP (4 dígitos)', example: '5102' })
  @IsString()
  @MaxLength(4)
  @MinLength(4)
  cfop: string;

  @ApiProperty({ description: 'Unidade de medida', example: 'UN' })
  @IsString()
  unitOfMeasure: string;
}

// Informações de pagamento
export class PaymentInfoDto {
  @ApiProperty({ description: 'Forma de pagamento (código SEFAZ)', example: '01' })
  @IsString()
  method: string;
}

// DTO principal para geração de NF-e
export class GenerateNFeDto {
  // Opção 1: Vincular a uma venda existente
  @ApiProperty({
    description: 'ID da venda para emitir NF-e vinculada',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  saleId?: string;

  // Opção 2: Emissão manual com dados completos
  @ApiProperty({
    description: 'Dados do destinatário (obrigatório para emissão manual)',
    type: RecipientDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecipientDto)
  recipient?: RecipientDto;

  @ApiProperty({
    description: 'Itens da nota fiscal (obrigatório para emissão manual)',
    type: [NFeManualItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NFeManualItemDto)
  items?: NFeManualItemDto[];

  @ApiProperty({
    description: 'Informações de pagamento (obrigatório para emissão manual)',
    type: PaymentInfoDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentInfoDto)
  payment?: PaymentInfoDto;

  @ApiProperty({
    description: 'Informações adicionais / observações',
    example: 'Observação sobre a nota fiscal',
    required: false,
  })
  @IsOptional()
  @IsString()
  additionalInfo?: string;
}

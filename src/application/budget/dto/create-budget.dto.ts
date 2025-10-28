import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsNumber, IsUUID, Min, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class BudgetItemDto {
  @ApiProperty({
    description: 'ID do produto',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Quantidade do produto',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

export class CreateBudgetDto {
  @ApiProperty({
    description: 'ID do vendedor (opcional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @ApiProperty({
    description: 'Itens do orçamento',
    type: [BudgetItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetItemDto)
  items: BudgetItemDto[];

  @ApiProperty({
    description: 'Nome do cliente',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiProperty({
    description: 'Telefone do cliente',
    example: '(48) 99999-9999',
    required: false,
  })
  @IsOptional()
  @IsString()
  clientPhone?: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao@email.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  clientEmail?: string;

  @ApiProperty({
    description: 'CPF ou CNPJ do cliente',
    example: '123.456.789-00',
    required: false,
  })
  @IsOptional()
  @IsString()
  clientCpfCnpj?: string;

  @ApiProperty({
    description: 'Observações do orçamento',
    example: 'Cliente interessado em fechar a compra na próxima semana',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Data de validade do orçamento (ISO 8601)',
    example: '2025-11-01T23:59:59.000Z',
  })
  @IsDateString()
  validUntil: string;
}


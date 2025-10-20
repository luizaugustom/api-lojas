import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsNumber, IsDateString, IsArray, IsPositive, Min, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({
    description: 'Nome do produto',
    example: 'Smartphone Samsung Galaxy',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'URLs das fotos do produto',
    example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    // Garantir que é um array de strings válidas
    if (!Array.isArray(value)) return [];
    return value.filter(item => typeof item === 'string' && item.trim().length > 0);
  })
  photos?: string[];

  @ApiProperty({
    description: 'Código de barras do produto',
    example: '7891234567890',
    minLength: 8,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  barcode: string;

  @ApiProperty({
    description: 'Tamanho do produto',
    example: 'M',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  size?: string;

  @ApiProperty({
    description: 'Quantidade em estoque',
    example: 100,
    minimum: 0,
  })
  @IsNumber()
  @IsPositive()
  @Min(0)
  @Type(() => Number)
  stockQuantity: number;

  @ApiProperty({
    description: 'Preço do produto',
    example: 1299.99,
    minimum: 0,
  })
  @IsNumber()
  @IsPositive()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({
    description: 'Categoria do produto',
    example: 'Eletrônicos',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({
    description: 'Data de vencimento do produto',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => {
    if (!value) return value;
    
    // Se é apenas uma data (YYYY-MM-DD), converter para DateTime
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value + 'T00:00:00.000Z').toISOString();
    }
    
    return value;
  })
  expirationDate?: string;
}

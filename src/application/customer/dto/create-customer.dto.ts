import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, Matches, IsEmail } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Nome do cliente',
    example: 'João Silva',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Telefone do cliente',
    example: '(11) 99999-9999',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\(\d{2}\) \d{4,5}-\d{4}$/, {
    message: 'Telefone deve estar no formato (XX) XXXXX-XXXX',
  })
  phone?: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'cliente@email.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, {
    message: 'Email deve ter um formato válido',
  })
  email?: string;

  @ApiProperty({
    description: 'CPF ou CNPJ do cliente',
    example: '123.456.789-00',
    required: false,
  })
  @IsOptional()
  @IsString()
  cpfCnpj?: string;

  // Address fields
  @ApiProperty({
    description: 'CEP',
    example: '01234-567',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{5}-\d{3}$/, {
    message: 'CEP deve estar no formato XXXXX-XXX',
  })
  zipCode?: string;

  @ApiProperty({
    description: 'Estado',
    example: 'SP',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiProperty({
    description: 'Bairro',
    example: 'Centro',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @ApiProperty({
    description: 'Rua',
    example: 'Rua das Flores',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string;

  @ApiProperty({
    description: 'Número',
    example: '123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  number?: string;

  @ApiProperty({
    description: 'Complemento',
    example: 'Sala 1',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  complement?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsEmail, IsOptional, IsDateString, Matches, IsNumber, Min, Max, IsBoolean } from 'class-validator';

export class CreateSellerDto {
  @ApiProperty({
    description: 'Login do vendedor',
    example: 'vendedor@empresa.com',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  @IsEmail()
  login: string;

  @ApiProperty({
    description: 'Senha do vendedor',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Nome do vendedor',
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
    description: 'CPF do vendedor',
    example: '123.456.789-00',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: 'CPF deve estar no formato XXX.XXX.XXX-XX',
  })
  cpf?: string;

  @ApiProperty({
    description: 'Data de nascimento do vendedor',
    example: '1990-01-01',
    required: false,
  })
  @IsOptional()
  @IsString()
  birthDate?: string;

  @ApiProperty({
    description: 'Email do vendedor',
    example: 'joao@example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Telefone do vendedor',
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
    description: 'Taxa de comissão do vendedor em porcentagem',
    example: 5.5,
    minimum: 0,
    maximum: 100,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Comissão não pode ser negativa' })
  @Max(100, { message: 'Comissão não pode ser maior que 100%' })
  commissionRate?: number;

  @ApiProperty({
    description: 'Define se o vendedor tem caixa individual (true) ou usa o caixa compartilhado da empresa (false)',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  hasIndividualCash?: boolean;
}

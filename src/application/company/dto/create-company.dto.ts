import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsEmail, IsOptional, Matches, Length, IsBoolean, IsEnum } from 'class-validator';
import { PlanType } from '@prisma/client';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Nome da empresa',
    example: 'Minha Loja LTDA',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Login da empresa',
    example: 'empresa@example.com',
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
    description: 'Senha da empresa',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Telefone da empresa',
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
    description: 'CNPJ da empresa',
    example: '12.345.678/0001-90',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX',
  })
  cnpj: string;

  @ApiProperty({
    description: 'Inscrição estadual',
    example: '123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  stateRegistration?: string;

  @ApiProperty({
    description: 'Inscrição municipal',
    example: '12345678',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  municipalRegistration?: string;

  @ApiProperty({
    description: 'Email da empresa',
    example: 'contato@empresa.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'URL da logomarca',
    example: 'https://example.com/logo.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({
    description: 'Cor da marca',
    example: '#FF0000',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-F]{6}$/i, {
    message: 'Cor deve estar no formato hexadecimal (#RRGGBB)',
  })
  brandColor?: string;

  @ApiProperty({
    description: 'Plano da empresa',
    enum: PlanType,
    example: PlanType.BASIC,
    default: PlanType.BASIC,
    required: false,
  })
  @IsOptional()
  @IsEnum(PlanType, {
    message: 'Plano deve ser BASIC, PLUS ou PRO',
  })
  plan?: PlanType;

  @ApiProperty({
    description: 'Status ativo da empresa',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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
  @Length(2, 2)
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

  // Banking data
  @ApiProperty({
    description: 'Nome do beneficiário',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  beneficiaryName?: string;

  @ApiProperty({
    description: 'CPF ou CNPJ do beneficiário',
    example: '123.456.789-00',
    required: false,
  })
  @IsOptional()
  @IsString()
  beneficiaryCpfCnpj?: string;

  @ApiProperty({
    description: 'Código do banco',
    example: '001',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  bankCode?: string;

  @ApiProperty({
    description: 'Nome do banco',
    example: 'Banco do Brasil',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

  @ApiProperty({
    description: 'Agência',
    example: '1234-5',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  agency?: string;

  @ApiProperty({
    description: 'Número da conta',
    example: '12345-6',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  accountNumber?: string;

  @ApiProperty({
    description: 'Tipo da conta',
    example: 'corrente',
    enum: ['corrente', 'poupança', 'pagamento'],
    required: false,
  })
  @IsOptional()
  @IsString()
  accountType?: string;
}

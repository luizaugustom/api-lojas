import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MinLength, MaxLength, Matches } from 'class-validator';

export enum TaxRegime {
  SIMPLES_NACIONAL = 'SIMPLES_NACIONAL',
  LUCRO_PRESUMIDO = 'LUCRO_PRESUMIDO',
  LUCRO_REAL = 'LUCRO_REAL',
  MEI = 'MEI',
}

export class UpdateFiscalConfigDto {
  @ApiProperty({
    description: 'Regime tributário da empresa',
    example: 'SIMPLES_NACIONAL',
    enum: TaxRegime,
    required: false,
  })
  @IsOptional()
  @IsEnum(TaxRegime)
  taxRegime?: TaxRegime;

  @ApiProperty({
    description: 'CNAE - Classificação Nacional de Atividades Econômicas (7 dígitos)',
    example: '4761001',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(7)
  @Matches(/^\d{7}$/, { message: 'CNAE deve ter 7 dígitos numéricos' })
  cnae?: string;

  @ApiProperty({
    description: 'Senha do certificado digital (será criptografada)',
    example: 'senha-do-certificado',
    required: false,
  })
  @IsOptional()
  @IsString()
  certificatePassword?: string;

  @ApiProperty({
    description: 'URL do arquivo do certificado digital',
    example: 'https://storage.googleapis.com/...',
    required: false,
  })
  @IsOptional()
  @IsString()
  certificateFileUrl?: string;

  @ApiProperty({
    description: 'Série da NFC-e (geralmente 1)',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: 'Série deve conter apenas números' })
  nfceSerie?: string;

  @ApiProperty({
    description: 'Código IBGE do município (7 dígitos)',
    example: '4205407',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(7)
  @Matches(/^\d{7}$/, { message: 'Código IBGE deve ter 7 dígitos' })
  municipioIbge?: string;

  @ApiProperty({
    description: 'CSC - Código de Segurança do Contribuinte (será criptografado)',
    example: 'seu-codigo-csc',
    required: false,
  })
  @IsOptional()
  @IsString()
  csc?: string;

  @ApiProperty({
    description: 'ID do Token CSC (geralmente 000001)',
    example: '000001',
    required: false,
  })
  @IsOptional()
  @IsString()
  idTokenCsc?: string;
}


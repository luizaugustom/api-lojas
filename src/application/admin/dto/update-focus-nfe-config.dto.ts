import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';

export class UpdateFocusNfeConfigDto {
  @ApiProperty({
    description: 'API Key global do Focus NFe (compartilhada por todas as empresas)',
    example: 'sua-api-key-focus-nfe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  focusNfeApiKey?: string;

  @ApiProperty({
    description: 'Ambiente padrão Focus NFe',
    example: 'sandbox',
    enum: ['sandbox', 'production'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['sandbox', 'production'])
  focusNfeEnvironment?: 'sandbox' | 'production';

  @ApiProperty({
    description: 'Token da API IBPT para cálculo de tributos (opcional)',
    example: 'seu-token-ibpt',
    required: false,
  })
  @IsOptional()
  @IsString()
  ibptToken?: string;
}


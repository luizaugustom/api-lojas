import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum FocusNfeEnvironment {
  SANDBOX = 'sandbox',
  PRODUCTION = 'production',
}

export class UpdateFocusNfeConfigDto {
  @ApiProperty({
    description: 'API Key do Focus NFe para esta empresa',
    example: 'sua-api-key-aqui',
    required: false,
  })
  @IsOptional()
  @IsString()
  focusNfeApiKey?: string;

  @ApiProperty({
    description: 'Ambiente do Focus NFe (sandbox ou production)',
    example: 'sandbox',
    enum: FocusNfeEnvironment,
    required: false,
  })
  @IsOptional()
  @IsEnum(FocusNfeEnvironment)
  focusNfeEnvironment?: FocusNfeEnvironment;

  @ApiProperty({
    description: 'Token da API IBPT (opcional)',
    example: 'seu-token-ibpt',
    required: false,
  })
  @IsOptional()
  @IsString()
  ibptToken?: string;
}


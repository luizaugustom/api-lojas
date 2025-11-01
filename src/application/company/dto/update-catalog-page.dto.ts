import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, Matches, IsBoolean } from 'class-validator';

export class UpdateCatalogPageDto {
  @ApiProperty({
    description: 'URL única para página de catálogo (apenas letras, números, hífen e underscore)',
    example: 'masolucoes',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'URL deve conter apenas letras minúsculas, números, hífen e underscore',
  })
  catalogPageUrl?: string;

  @ApiProperty({
    description: 'Se a página de catálogo está habilitada',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  catalogPageEnabled?: boolean;
}


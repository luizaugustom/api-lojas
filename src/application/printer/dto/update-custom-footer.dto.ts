import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateCustomFooterDto {
  @ApiProperty({
    description: 'Footer personalizado para impressão de NFCe',
    example: 'OBRIGADO PELA PREFERÊNCIA!\nVOLTE SEMPRE!\n\nSiga-nos nas redes sociais:\n@minhaloja',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Footer personalizado deve ter no máximo 500 caracteres' })
  customFooter?: string;
}


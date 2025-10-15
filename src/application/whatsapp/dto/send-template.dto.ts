import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class SendTemplateDto {
  @ApiProperty({
    description: 'Número de telefone do destinatário',
    example: '5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Nome do template',
    example: 'venda_notification',
  })
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @ApiProperty({
    description: 'Idioma do template',
    example: 'pt_BR',
  })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({
    description: 'Parâmetros do template',
    example: ['João Silva', 'R$ 150,00'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  parameters: string[];
}

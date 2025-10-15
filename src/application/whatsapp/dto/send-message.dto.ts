import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'Número de telefone do destinatário',
    example: '5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Mensagem a ser enviada',
    example: 'Olá! Esta é uma mensagem de teste.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Tipo da mensagem',
    enum: ['text', 'image', 'document'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['text', 'image', 'document'])
  type?: string;

  @ApiProperty({
    description: 'URL da mídia (para mensagens de imagem ou documento)',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiProperty({
    description: 'Nome do arquivo (para mensagens de documento)',
    example: 'documento.pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  filename?: string;
}

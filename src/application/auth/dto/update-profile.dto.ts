import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ 
    description: 'Nome do usuário',
    example: 'João Silva',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ 
    description: 'Email do usuário',
    example: 'joao@example.com',
    required: false,
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @ApiProperty({ 
    description: 'Telefone do usuário',
    example: '(11) 99999-9999',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ 
    description: 'Login do usuário',
    example: 'joao.silva',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'Login deve ter no mínimo 3 caracteres' })
  login?: string;
}


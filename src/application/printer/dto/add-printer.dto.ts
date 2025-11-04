import { IsString, IsIn, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddPrinterDto {
  @ApiProperty({ description: 'Nome da impressora', example: 'EPSON TM-T20' })
  @IsString()
  @IsNotEmpty({ message: 'Nome da impressora é obrigatório' })
  @MaxLength(255, { message: 'Nome da impressora muito longo' })
  name: string;

  @ApiProperty({ description: 'Tipo de conexão', example: 'usb', enum: ['usb', 'network', 'bluetooth'] })
  @IsString()
  @IsIn(['usb', 'network', 'bluetooth'], { message: 'Tipo de conexão inválido' })
  type: 'usb' | 'network' | 'bluetooth';

  @ApiProperty({ description: 'Informações de conexão', example: 'USB001' })
  @IsString()
  @IsNotEmpty({ message: 'Informações de conexão são obrigatórias' })
  @MaxLength(500, { message: 'Informações de conexão muito longas' })
  connectionInfo: string;
}
































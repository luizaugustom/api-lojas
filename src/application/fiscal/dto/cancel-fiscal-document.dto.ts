import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CancelFiscalDocumentDto {
  @ApiProperty({
    description: 'Motivo do cancelamento',
    example: 'Erro na emissão do documento',
    minLength: 5,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason: string;
}

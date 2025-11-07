import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class ReprintCashClosureDto {
  @ApiProperty({
    description: 'Indica se o relatório deve incluir os detalhes de cada venda',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeSaleDetails?: boolean;
}

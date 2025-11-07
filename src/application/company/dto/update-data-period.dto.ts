import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DataPeriodFilter } from '@prisma/client';

export class UpdateCompanyDataPeriodDto {
  @ApiProperty({
    description: 'Período padrão dos dados exibidos para a empresa',
    enum: DataPeriodFilter,
    example: DataPeriodFilter.THIS_YEAR,
  })
  @IsEnum(DataPeriodFilter)
  dataPeriod!: DataPeriodFilter;
}


import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DataPeriodFilter } from '@prisma/client';

const ALLOWED_SELLER_PERIODS: DataPeriodFilter[] = [
  DataPeriodFilter.LAST_3_MONTHS,
  DataPeriodFilter.LAST_1_MONTH,
];

export class UpdateSellerDataPeriodDto {
  @ApiProperty({
    description: 'Período padrão para visualização de dados do vendedor',
    enum: ALLOWED_SELLER_PERIODS,
    example: DataPeriodFilter.LAST_1_MONTH,
  })
  @IsEnum(ALLOWED_SELLER_PERIODS, {
    message: 'Vendedor só pode escolher entre 3 meses ou 1 mês',
  })
  dataPeriod!: DataPeriodFilter;
}

export const SELLER_ALLOWED_PERIODS = ALLOWED_SELLER_PERIODS;


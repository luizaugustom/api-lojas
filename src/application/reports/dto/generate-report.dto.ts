import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  SALES = 'sales',
  PRODUCTS = 'products',
  INVOICES = 'invoices',
  COMPLETE = 'complete',
}

export enum ReportFormat {
  JSON = 'json',
  XML = 'xml',
  EXCEL = 'excel',
}

export class GenerateReportDto {
  @ApiProperty({
    enum: ReportType,
    description: 'Tipo de relatório',
    example: ReportType.COMPLETE,
  })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({
    enum: ReportFormat,
    description: 'Formato do relatório',
    example: ReportFormat.XML,
  })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({
    description: 'Data inicial do período (ISO 8601)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data final do período (ISO 8601)',
    example: '2025-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'ID do vendedor (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  sellerId?: string;
}

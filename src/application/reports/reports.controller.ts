import {
  Controller,
  Post,
  Body,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { GenerateReportDto, ReportFormat } from './dto/generate-report.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @Roles(UserRole.COMPANY)
  @ApiOperation({
    summary: 'Gerar relatório completo para contabilidade',
    description:
      'Gera relatórios de vendas, produtos, notas fiscais e outros dados em formato JSON, XML ou Excel para envio à contabilidade',
  })
  @ApiResponse({
    status: 201,
    description: 'Relatório gerado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Empresa não encontrada',
  })
  async generateReport(
    @CurrentUser() user: any,
    @Body() generateReportDto: GenerateReportDto,
    @Res() res: Response,
  ) {
    const result = await this.reportsService.generateReport(
      user.companyId,
      generateReportDto,
    );

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportType = generateReportDto.reportType;

    // Set appropriate headers based on format
    if (generateReportDto.format === ReportFormat.JSON) {
      res.setHeader('Content-Type', result.contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="relatorio-${reportType}-${timestamp}.json"`,
      );
      return res.status(HttpStatus.OK).json(result.data);
    } else if (generateReportDto.format === ReportFormat.XML) {
      res.setHeader('Content-Type', result.contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="relatorio-${reportType}-${timestamp}.xml"`,
      );
      return res.status(HttpStatus.OK).send(result.data);
    } else if (generateReportDto.format === ReportFormat.EXCEL) {
      res.setHeader('Content-Type', result.contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="relatorio-${reportType}-${timestamp}.xlsx"`,
      );
      return res.status(HttpStatus.OK).send(result.data);
    }
  }
}

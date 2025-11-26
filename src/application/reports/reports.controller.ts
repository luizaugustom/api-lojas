import {
  Controller,
  Post,
  Body,
  UseGuards,
  Res,
  HttpStatus,
  Req,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { extractClientTimeInfo } from '../../shared/utils/client-time.util';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

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
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const clientTimeInfo = extractClientTimeInfo(req);
      const result = await this.reportsService.generateReport(
        user.companyId,
        generateReportDto,
        clientTimeInfo,
      );

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

      if (Buffer.isBuffer(result.data) || typeof result.data === 'string') {
        res.setHeader('Content-Length', Buffer.byteLength(result.data));
        return res.status(HttpStatus.OK).send(result.data);
      }

      return res.status(HttpStatus.OK).json(result.data);
    } catch (error: any) {
      this.logger.error('Erro ao gerar relatório:', error);
      this.logger.error('Stack trace:', error?.stack);
      throw new InternalServerErrorException(
        `Erro ao gerar relatório: ${error?.message || 'Erro desconhecido'}`,
      );
    }
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CashClosureService } from './cash-closure.service';
import { CreateCashClosureDto } from './dto/create-cash-closure.dto';
import { CloseCashClosureDto } from './dto/close-cash-closure.dto';
import { ReprintCashClosureDto } from './dto/reprint-cash-closure.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UuidValidationPipe } from '../../shared/pipes/uuid-validation.pipe';
import { extractClientTimeInfo } from '../../shared/utils/client-time.util';

@ApiTags('cash')
@Controller('cash-closure')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CashClosureController {
  constructor(private readonly cashClosureService: CashClosureService) {}

  @Post()
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Abrir novo fechamento de caixa' })
  @ApiResponse({ status: 201, description: 'Fechamento de caixa criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Já existe um fechamento de caixa aberto' })
  create(
    @CurrentUser() user: any,
    @Body() createCashClosureDto: CreateCashClosureDto,
    @Req() req: Request,
  ) {
    const sellerId = user.role === UserRole.SELLER ? user.userId : undefined;
    const clientTimeInfo = extractClientTimeInfo(req);
    return this.cashClosureService.create(user.companyId, createCashClosureDto, sellerId, clientTimeInfo);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Listar fechamentos de caixa' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isClosed', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de fechamentos de caixa' })
  findAll(
    @CurrentUser() user: any,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('isClosed', new ParseBoolPipe({ optional: true })) isClosed?: boolean,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.cashClosureService.findAll(undefined, page, limit, isClosed);
    }
    return this.cashClosureService.findAll(user.companyId, page, limit, isClosed);
  }

  @Get('current')
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Obter fechamento de caixa atual' })
  @ApiResponse({ status: 200, description: 'Fechamento de caixa atual' })
  @ApiResponse({ status: 404, description: 'Não há fechamento de caixa aberto' })
  getCurrent(@CurrentUser() user: any) {
    const sellerId = user.role === UserRole.SELLER ? user.userId : undefined;
    return this.cashClosureService.getCurrentClosure(user.companyId, sellerId);
  }

  @Get('stats')
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Obter estatísticas do fechamento de caixa' })
  @ApiResponse({ status: 200, description: 'Estatísticas do fechamento de caixa' })
  getStats(@CurrentUser() user: any) {
    const sellerId = user.role === UserRole.SELLER ? user.userId : undefined;
    return this.cashClosureService.getCashClosureStats(user.companyId, sellerId);
  }

  @Get('history')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter histórico de fechamentos de caixa' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Histórico de fechamentos de caixa' })
  getHistory(
    @CurrentUser() user: any,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.cashClosureService.getClosureHistory(user.companyId, page, limit);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Buscar fechamento de caixa por ID' })
  @ApiResponse({ status: 200, description: 'Fechamento de caixa encontrado' })
  @ApiResponse({ status: 404, description: 'Fechamento de caixa não encontrado' })
  findOne(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.cashClosureService.findOne(id);
    }
    return this.cashClosureService.findOne(id, user.companyId);
  }

  @Patch('close')
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Fechar fechamento de caixa atual' })
  @ApiResponse({ status: 200, description: 'Fechamento de caixa fechado com sucesso' })
  @ApiResponse({ status: 404, description: 'Não há fechamento de caixa aberto' })
  close(
    @CurrentUser() user: any,
    @Body() closeCashClosureDto: CloseCashClosureDto,
    @Req() req: Request,
  ) {
    const sellerId = user.role === UserRole.SELLER ? user.userId : undefined;
    const computerId = (req.headers['x-computer-id'] as string) || null;
    const clientTimeInfo = extractClientTimeInfo(req);
    return this.cashClosureService.close(user.companyId, closeCashClosureDto, sellerId, computerId, clientTimeInfo);
  }

  @Post(':id/reprint')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Reimprimir relatório de fechamento de caixa' })
  @ApiResponse({ status: 200, description: 'Relatório reimpresso com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao reimprimir relatório' })
  reprintReport(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
    @Body() reprintDto: ReprintCashClosureDto,
  ) {
    const computerId = (req.headers['x-computer-id'] as string) || null;
    const includeSaleDetails = reprintDto?.includeSaleDetails ?? false;
    const clientTimeInfo = extractClientTimeInfo(req);
    if (user.role === UserRole.ADMIN) {
      return this.cashClosureService.reprintReport(id, undefined, computerId, includeSaleDetails, clientTimeInfo);
    }
    return this.cashClosureService.reprintReport(id, user.companyId, computerId, includeSaleDetails, clientTimeInfo);
  }

  @Get(':id/print-content')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter conteúdo do relatório de fechamento para impressão' })
  @ApiResponse({ status: 200, description: 'Conteúdo pronto para impressão' })
  getPrintContent(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
    @Query('includeSaleDetails', new ParseBoolPipe({ optional: true })) includeSaleDetails?: boolean,
  ) {
    const includeDetails = includeSaleDetails ?? false;
    const clientTimeInfo = extractClientTimeInfo(req);
    if (user.role === UserRole.ADMIN) {
      return this.cashClosureService.getReportContent(id, undefined, includeDetails, clientTimeInfo);
    }
    return this.cashClosureService.getReportContent(id, user.companyId, includeDetails, clientTimeInfo);
  }
}

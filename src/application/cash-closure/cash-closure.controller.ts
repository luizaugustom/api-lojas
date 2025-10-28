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
} from '@nestjs/common';
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
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UuidValidationPipe } from '../../shared/pipes/uuid-validation.pipe';

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
  ) {
    const sellerId = user.role === UserRole.SELLER ? user.userId : undefined;
    return this.cashClosureService.create(user.companyId, createCashClosureDto, sellerId);
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
  ) {
    const sellerId = user.role === UserRole.SELLER ? user.userId : undefined;
    return this.cashClosureService.close(user.companyId, closeCashClosureDto, sellerId);
  }

  @Post(':id/reprint')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Reimprimir relatório de fechamento de caixa' })
  @ApiResponse({ status: 200, description: 'Relatório reimpresso com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao reimprimir relatório' })
  reprintReport(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.cashClosureService.reprintReport(id);
    }
    return this.cashClosureService.reprintReport(id, user.companyId);
  }
}

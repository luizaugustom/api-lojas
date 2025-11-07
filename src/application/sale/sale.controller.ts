import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  BadRequestException,
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
import { SaleService } from './sale.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { ProcessExchangeDto } from './dto/process-exchange.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UuidValidationPipe } from '../../shared/pipes/uuid-validation.pipe';
import { extractClientTimeInfo } from '../../shared/utils/client-time.util';
import { resolveDataPeriodRangeAsISOString } from '../../shared/utils/data-period.util';

@ApiTags('sale')
@Controller('sale')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @Post()
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Criar nova venda' })
  @ApiResponse({ status: 201, description: 'Venda criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou estoque insuficiente' })
  create(
    @CurrentUser() user: any,
    @Body() createSaleDto: CreateSaleDto,
    @Req() req: Request,
  ) {
    const sellerId = user.role === UserRole.SELLER ? user.id : createSaleDto.sellerId;
    if (!sellerId) {
      throw new BadRequestException('Vendedor é obrigatório');
    }
    
    // Obter computerId do header (enviado pelo cliente desktop/web)
    const computerId = (req.headers['x-computer-id'] as string) || null;
    const clientTimeInfo = extractClientTimeInfo(req);
    
    return this.saleService.create(user.companyId, sellerId, createSaleDto, computerId, clientTimeInfo);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Listar vendas' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sellerId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista de vendas' })
  findAll(
    @CurrentUser() user: any,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('sellerId') sellerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const companyId = user.role === UserRole.ADMIN ? undefined : user.companyId;
    const sellerFilter = user.role === UserRole.SELLER ? user.id : sellerId;

    let effectiveStartDate = startDate;
    let effectiveEndDate = endDate;

    if (!startDate && !endDate) {
      const range = resolveDataPeriodRangeAsISOString(user.dataPeriod);
      effectiveStartDate = range.startDate;
      effectiveEndDate = range.endDate;
    }

    return this.saleService.findAll(companyId, page, limit, sellerFilter, effectiveStartDate, effectiveEndDate);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter estatísticas de vendas' })
  @ApiQuery({ name: 'sellerId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Estatísticas de vendas' })
  getStats(
    @CurrentUser() user: any,
    @Query('sellerId') sellerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const companyId = user.role === UserRole.ADMIN ? undefined : user.companyId;
    let effectiveStartDate = startDate;
    let effectiveEndDate = endDate;

    if (!startDate && !endDate) {
      const range = resolveDataPeriodRangeAsISOString(user.dataPeriod);
      effectiveStartDate = range.startDate;
      effectiveEndDate = range.endDate;
    }

    const sellerFilter = user.role === UserRole.SELLER ? user.id : sellerId;

    return this.saleService.getSalesStats(companyId, sellerFilter, effectiveStartDate, effectiveEndDate);
  }

  @Get('my-sales')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Obter vendas do vendedor logado' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Vendas do vendedor' })
  getMySales(
    @CurrentUser() user: any,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    let effectiveStartDate = startDate;
    let effectiveEndDate = endDate;

    if (!startDate && !endDate) {
      const range = resolveDataPeriodRangeAsISOString(user.dataPeriod);
      effectiveStartDate = range.startDate;
      effectiveEndDate = range.endDate;
    }

    return this.saleService.findAll(user.companyId, page, limit, user.id, effectiveStartDate, effectiveEndDate);
  }

  @Get('my-stats')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Obter estatísticas do vendedor logado' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Estatísticas do vendedor' })
  getMyStats(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    let effectiveStartDate = startDate;
    let effectiveEndDate = endDate;

    if (!startDate && !endDate) {
      const range = resolveDataPeriodRangeAsISOString(user.dataPeriod);
      effectiveStartDate = range.startDate;
      effectiveEndDate = range.endDate;
    }

    return this.saleService.getSalesStats(user.companyId, user.id, effectiveStartDate, effectiveEndDate);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Buscar venda por ID' })
  @ApiResponse({ status: 200, description: 'Venda encontrada' })
  @ApiResponse({ status: 404, description: 'Venda não encontrada' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  findOne(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const companyId = user.role === UserRole.ADMIN ? undefined : user.companyId;
    return this.saleService.findOne(id, companyId);
  }

  @Post('exchange')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Processar troca de produto' })
  @ApiResponse({ status: 201, description: 'Troca processada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  processExchange(
    @CurrentUser() user: any,
    @Body() processExchangeDto: ProcessExchangeDto,
  ) {
    return this.saleService.processExchange(user.companyId, processExchangeDto);
  }

  @Post(':id/reprint')
  @Roles(UserRole.ADMIN, UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Reimprimir cupom da venda' })
  @ApiResponse({ status: 200, description: 'Cupom reimpresso com sucesso' })
  @ApiResponse({ status: 400, description: 'ID inválido ou erro ao reimprimir cupom' })
  reprintReceipt(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const companyId = user.role === UserRole.ADMIN ? undefined : user.companyId;
    // Obter computerId do header (enviado pelo cliente desktop/web)
    const computerId = (req.headers['x-computer-id'] as string) || null;
    const clientTimeInfo = extractClientTimeInfo(req);
    return this.saleService.reprintReceipt(id, companyId, computerId, clientTimeInfo);
  }

  @Get(':id/print-content')
  @Roles(UserRole.ADMIN, UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Obter conteúdo de impressão para venda (para impressão local)' })
  @ApiResponse({ status: 200, description: 'Conteúdo de impressão gerado com sucesso' })
  @ApiResponse({ status: 400, description: 'ID inválido ou erro ao gerar conteúdo' })
  getPrintContent(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const companyId = user.role === UserRole.ADMIN ? undefined : user.companyId;
    const clientTimeInfo = extractClientTimeInfo(req);
    return this.saleService.getPrintContent(id, companyId, clientTimeInfo);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Atualizar venda' })
  @ApiResponse({ status: 200, description: 'Venda atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Venda não encontrada' })
  @ApiResponse({ status: 400, description: 'ID inválido ou não é possível editar vendas antigas' })
  update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() updateSaleDto: UpdateSaleDto,
    @CurrentUser() user: any,
  ) {
    const companyId = user.role === UserRole.ADMIN ? undefined : user.companyId;
    return this.saleService.update(id, updateSaleDto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Remover venda' })
  @ApiResponse({ status: 200, description: 'Venda removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Venda não encontrada' })
  @ApiResponse({ status: 400, description: 'ID inválido ou não é possível excluir vendas antigas' })
  remove(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const companyId = user.role === UserRole.ADMIN ? undefined : user.companyId;
    return this.saleService.remove(id, companyId);
  }
}

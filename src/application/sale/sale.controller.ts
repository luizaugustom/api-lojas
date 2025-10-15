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
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
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
  ) {
    const sellerId = user.role === UserRole.SELLER ? user.id : createSaleDto.sellerId;
    if (!sellerId) {
      throw new BadRequestException('Vendedor é obrigatório');
    }
    
    return this.saleService.create(user.companyId, sellerId, createSaleDto);
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
    
    return this.saleService.findAll(companyId, page, limit, sellerFilter, startDate, endDate);
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
    return this.saleService.getSalesStats(companyId, sellerId, startDate, endDate);
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
    return this.saleService.findAll(user.companyId, page, limit, user.id, startDate, endDate);
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
    return this.saleService.getSalesStats(user.companyId, user.id, startDate, endDate);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Buscar venda por ID' })
  @ApiResponse({ status: 200, description: 'Venda encontrada' })
  @ApiResponse({ status: 404, description: 'Venda não encontrada' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
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
  @ApiResponse({ status: 400, description: 'Erro ao reimprimir cupom' })
  reprintReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const companyId = user.role === UserRole.ADMIN ? undefined : user.companyId;
    return this.saleService.reprintReceipt(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Atualizar venda' })
  @ApiResponse({ status: 200, description: 'Venda atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Venda não encontrada' })
  @ApiResponse({ status: 400, description: 'Não é possível editar vendas antigas' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
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
  @ApiResponse({ status: 400, description: 'Não é possível excluir vendas antigas' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const companyId = user.role === UserRole.ADMIN ? undefined : user.companyId;
    return this.saleService.remove(id, companyId);
  }
}

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
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BillToPayService } from './bill-to-pay.service';
import { CreateBillToPayDto } from './dto/create-bill-to-pay.dto';
import { UpdateBillToPayDto } from './dto/update-bill-to-pay.dto';
import { MarkAsPaidDto } from './dto/mark-as-paid.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('bill')
@Controller('bill-to-pay')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BillToPayController {
  constructor(private readonly billToPayService: BillToPayService) {}

  @Post()
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Criar nova conta a pagar' })
  @ApiResponse({ status: 201, description: 'Conta a pagar criada com sucesso' })
  create(
    @CurrentUser() user: any,
    @Body() createBillToPayDto: CreateBillToPayDto,
  ) {
    return this.billToPayService.create(user.companyId, createBillToPayDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Listar contas a pagar' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isPaid', required: false, type: Boolean })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista de contas a pagar' })
  findAll(
    @CurrentUser() user: any,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('isPaid', new ParseBoolPipe({ optional: true })) isPaid?: boolean,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.billToPayService.findAll(undefined, page, limit, isPaid, startDate, endDate);
    }
    return this.billToPayService.findAll(user.companyId, page, limit, isPaid, startDate, endDate);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter estatísticas das contas a pagar' })
  @ApiResponse({ status: 200, description: 'Estatísticas das contas a pagar' })
  getStats(@CurrentUser() user: any) {
    if (user.role === UserRole.ADMIN) {
      return this.billToPayService.getBillStats();
    }
    return this.billToPayService.getBillStats(user.companyId);
  }

  @Get('overdue')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Listar contas em atraso' })
  @ApiResponse({ status: 200, description: 'Lista de contas em atraso' })
  getOverdue(@CurrentUser() user: any) {
    if (user.role === UserRole.ADMIN) {
      return this.billToPayService.getOverdueBills();
    }
    return this.billToPayService.getOverdueBills(user.companyId);
  }

  @Get('upcoming')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Listar contas próximas do vencimento' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de contas próximas do vencimento' })
  getUpcoming(
    @CurrentUser() user: any,
    @Query('days', new ParseIntPipe({ optional: true })) days = 7,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.billToPayService.getUpcomingBills(undefined, days);
    }
    return this.billToPayService.getUpcomingBills(user.companyId, days);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Buscar conta a pagar por ID' })
  @ApiResponse({ status: 200, description: 'Conta a pagar encontrada' })
  @ApiResponse({ status: 404, description: 'Conta a pagar não encontrada' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.billToPayService.findOne(id);
    }
    return this.billToPayService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Atualizar conta a pagar' })
  @ApiResponse({ status: 200, description: 'Conta a pagar atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Conta a pagar não encontrada' })
  @ApiResponse({ status: 400, description: 'Não é possível editar conta já paga' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBillToPayDto: UpdateBillToPayDto,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.billToPayService.update(id, updateBillToPayDto);
    }
    return this.billToPayService.update(id, updateBillToPayDto, user.companyId);
  }

  @Patch(':id/mark-paid')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Marcar conta como paga' })
  @ApiResponse({ status: 200, description: 'Conta marcada como paga com sucesso' })
  @ApiResponse({ status: 404, description: 'Conta a pagar não encontrada' })
  @ApiResponse({ status: 400, description: 'Conta já está marcada como paga' })
  markAsPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() markAsPaidDto: MarkAsPaidDto,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.billToPayService.markAsPaid(id, markAsPaidDto);
    }
    return this.billToPayService.markAsPaid(id, markAsPaidDto, user.companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Remover conta a pagar' })
  @ApiResponse({ status: 200, description: 'Conta a pagar removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Conta a pagar não encontrada' })
  @ApiResponse({ status: 400, description: 'Não é possível excluir conta já paga' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.billToPayService.remove(id);
    }
    return this.billToPayService.remove(id, user.companyId);
  }
}

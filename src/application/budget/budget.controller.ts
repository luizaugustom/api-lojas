import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  Query,
  Res,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { extractClientTimeInfo } from '../../shared/utils/client-time.util';
import { resolveDataPeriodRangeAsISOString } from '../../shared/utils/data-period.util';

@ApiTags('budgets')
@Controller('budget')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Criar novo orçamento' })
  @ApiResponse({
    status: 201,
    description: 'Orçamento criado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  async create(@CurrentUser() user: any, @Body() createBudgetDto: CreateBudgetDto) {
    console.log('[BudgetController] User:', { id: user.id, role: user.role, companyId: user.companyId });
    console.log('[BudgetController] DTO:', JSON.stringify(createBudgetDto, null, 2));

    const companyId = user.role === UserRole.COMPANY ? user.id : user.companyId;
    const sellerId = user.role === UserRole.SELLER ? user.id : createBudgetDto.sellerId;

    if (!companyId) {
      throw new Error('Company ID não encontrado no usuário');
    }

    console.log('[BudgetController] Creating budget for company:', companyId, 'seller:', sellerId);

    return this.budgetService.create(companyId, sellerId, createBudgetDto);
  }

  @Get()
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Listar todos os orçamentos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de orçamentos retornada com sucesso',
  })
  async findAll(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('sellerId') sellerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const companyId = user.role === UserRole.COMPANY ? user.id : user.companyId;
    const filterSellerId = user.role === UserRole.SELLER ? user.id : sellerId;

    let effectiveStartDate = startDate;
    let effectiveEndDate = endDate;

    if (!startDate && !endDate) {
      const range = resolveDataPeriodRangeAsISOString(user.dataPeriod);
      effectiveStartDate = range.startDate;
      effectiveEndDate = range.endDate;
    }

    return this.budgetService.findAll(
      companyId,
      filterSellerId,
      status,
      effectiveStartDate,
      effectiveEndDate,
    );
  }

  @Get(':id')
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Buscar orçamento por ID' })
  @ApiResponse({
    status: 200,
    description: 'Orçamento encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Orçamento não encontrado',
  })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const companyId = user.role === UserRole.COMPANY ? user.id : user.companyId;
    return this.budgetService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Atualizar orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Orçamento atualizado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Orçamento não encontrado',
  })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    const companyId = user.role === UserRole.COMPANY ? user.id : user.companyId;
    return this.budgetService.update(id, companyId, updateBudgetDto);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Excluir orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Orçamento excluído com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Orçamento não encontrado',
  })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    const companyId = user.role === UserRole.COMPANY ? user.id : user.companyId;
    return this.budgetService.remove(id, companyId);
  }

  @Post(':id/print')
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Imprimir orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Orçamento enviado para impressão',
  })
  @ApiResponse({
    status: 404,
    description: 'Orçamento não encontrado',
  })
  async print(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const companyId = user.role === UserRole.COMPANY ? user.id : user.companyId;
    // Obter computerId do header (enviado pelo cliente desktop/web)
    const computerId = (req.headers['x-computer-id'] as string) || null;
    const clientTimeInfo = extractClientTimeInfo(req);
    return this.budgetService.printBudget(id, companyId, computerId, clientTimeInfo);
  }

  @Get(':id/pdf')
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Gerar PDF do orçamento' })
  @ApiResponse({
    status: 200,
    description: 'PDF gerado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Orçamento não encontrado',
  })
  async generatePdf(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const companyId = user.role === UserRole.COMPANY ? user.id : user.companyId;
    const budget = await this.budgetService.findOne(id, companyId);
    const clientTimeInfo = extractClientTimeInfo(req);
    const pdfBuffer = await this.budgetService.generatePdf(id, companyId, clientTimeInfo);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="orcamento-${budget.budgetNumber}.pdf"`,
    );

    return res.status(HttpStatus.OK).send(pdfBuffer);
  }

  @Post(':id/convert-to-sale')
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Converter orçamento em venda' })
  @ApiResponse({
    status: 200,
    description: 'Orçamento aprovado para conversão em venda',
  })
  @ApiResponse({
    status: 400,
    description: 'Orçamento não pode ser convertido',
  })
  @ApiResponse({
    status: 404,
    description: 'Orçamento não encontrado',
  })
  async convertToSale(@CurrentUser() user: any, @Param('id') id: string) {
    const companyId = user.role === UserRole.COMPANY ? user.id : user.companyId;
    const sellerId = user.role === UserRole.SELLER ? user.id : undefined;

    return this.budgetService.convertToSale(id, companyId, sellerId);
  }
}


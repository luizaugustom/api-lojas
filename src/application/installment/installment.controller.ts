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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InstallmentService } from './installment.service';
import { CreateInstallmentDto } from './dto/create-installment.dto';
import { UpdateInstallmentDto } from './dto/update-installment.dto';
import { PayInstallmentDto } from './dto/pay-installment.dto';
import { BulkPayInstallmentsDto } from './dto/bulk-pay-installments.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UuidValidationPipe } from '../../shared/pipes/uuid-validation.pipe';

@ApiTags('installment')
@Controller('installment')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InstallmentController {
  constructor(private readonly installmentService: InstallmentService) {}

  @Post()
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Criar nova parcela' })
  @ApiResponse({ status: 201, description: 'Parcela criada com sucesso' })
  create(
    @CurrentUser() user: any,
    @Body() createInstallmentDto: CreateInstallmentDto,
  ) {
    return this.installmentService.create(user.companyId, createInstallmentDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Listar parcelas' })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'isPaid', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de parcelas' })
  findAll(
    @CurrentUser() user: any,
    @Query('customerId') customerId?: string,
    @Query('isPaid') isPaid?: string,
  ) {
    const isPaidBool = isPaid === 'true' ? true : isPaid === 'false' ? false : undefined;
    
    if (user.role === UserRole.ADMIN) {
      return this.installmentService.findAll(undefined, customerId, isPaidBool);
    }
    return this.installmentService.findAll(user.companyId, customerId, isPaidBool);
  }

  @Get('overdue')
  @Roles(UserRole.ADMIN, UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Listar parcelas vencidas' })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista de parcelas vencidas' })
  findOverdue(
    @CurrentUser() user: any,
    @Query('customerId') customerId?: string,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.installmentService.findOverdue(undefined, customerId);
    }
    return this.installmentService.findOverdue(user.companyId, customerId);
  }

  @Get('stats')
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Obter estatísticas de parcelas da empresa' })
  @ApiResponse({ status: 200, description: 'Estatísticas de parcelas' })
  getStats(@CurrentUser() user: any) {
    return this.installmentService.getCompanyStats(user.companyId);
  }

  @Get('customer/:customerId/summary')
  @Roles(UserRole.ADMIN, UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Obter resumo de dívidas de um cliente' })
  @ApiResponse({ status: 200, description: 'Resumo de dívidas do cliente' })
  getCustomerDebtSummary(
    @Param('customerId', UuidValidationPipe) customerId: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.installmentService.getCustomerDebtSummary(customerId);
    }
    return this.installmentService.getCustomerDebtSummary(customerId, user.companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Buscar parcela por ID' })
  @ApiResponse({ status: 200, description: 'Parcela encontrada' })
  @ApiResponse({ status: 404, description: 'Parcela não encontrada' })
  findOne(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.installmentService.findOne(id);
    }
    return this.installmentService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Atualizar parcela' })
  @ApiResponse({ status: 200, description: 'Parcela atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Parcela não encontrada' })
  update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() updateInstallmentDto: UpdateInstallmentDto,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.installmentService.update(id, updateInstallmentDto);
    }
    return this.installmentService.update(id, updateInstallmentDto, user.companyId);
  }

  @Post(':id/pay')
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Pagar parcela (total ou parcial)' })
  @ApiResponse({ status: 200, description: 'Pagamento registrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Parcela não encontrada' })
  pay(
    @Param('id', UuidValidationPipe) id: string,
    @Body() payInstallmentDto: PayInstallmentDto,
    @CurrentUser() user: any,
  ) {
    return this.installmentService.payInstallment(id, payInstallmentDto, user.companyId);
  }

  @Post('customer/:customerId/pay/bulk')
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Pagar múltiplas parcelas de um cliente' })
  @ApiResponse({ status: 200, description: 'Pagamentos registrados com sucesso' })
  bulkPay(
    @Param('customerId', UuidValidationPipe) customerId: string,
    @Body() bulkPayInstallmentsDto: BulkPayInstallmentsDto,
    @CurrentUser() user: any,
  ) {
    return this.installmentService.payCustomerInstallments(
      customerId,
      bulkPayInstallmentsDto,
      user.companyId,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Remover parcela' })
  @ApiResponse({ status: 200, description: 'Parcela removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Parcela não encontrada' })
  remove(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.installmentService.remove(id);
    }
    return this.installmentService.remove(id, user.companyId);
  }
}


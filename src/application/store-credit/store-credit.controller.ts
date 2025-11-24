import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { StoreCreditService } from './store-credit.service';
import { UseStoreCreditDto } from './dto/use-store-credit.dto';

@ApiTags('store-credit')
@Controller('store-credit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StoreCreditController {
  constructor(private readonly storeCreditService: StoreCreditService) {}

  @Get('balance/:customerId')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Consultar saldo de crédito do cliente' })
  @ApiResponse({ status: 200, description: 'Saldo consultado com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async getBalance(
    @Param('customerId') customerId: string,
    @CurrentUser() user: any,
  ) {
    return this.storeCreditService.getBalance(user.companyId, customerId);
  }

  @Get('balance-by-cpf/:cpfCnpj')
  @Roles(UserRole.ADMIN, UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Consultar saldo de crédito por CPF/CNPJ' })
  @ApiResponse({ status: 200, description: 'Saldo consultado com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async getBalanceByCpfCnpj(
    @Param('cpfCnpj') cpfCnpj: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.storeCreditService.getBalanceByCpfCnpj(
      user.companyId,
      cpfCnpj,
    );
    if (!result) {
      return { balance: 0, customerId: null, customerName: null };
    }
    return result;
  }

  @Get('transactions/:customerId')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Listar transações de crédito do cliente' })
  @ApiResponse({ status: 200, description: 'Transações listadas com sucesso' })
  async getTransactions(
    @Param('customerId') customerId: string,
    @CurrentUser() user: any,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.storeCreditService.getTransactions(
      user.companyId,
      customerId,
      page || 1,
      limit || 50,
    );
  }

  @Post('use')
  @Roles(UserRole.ADMIN, UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Usar crédito do cliente em uma venda' })
  @ApiResponse({ status: 200, description: 'Crédito utilizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Saldo insuficiente ou dados inválidos' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async useCredit(
    @Body() useStoreCreditDto: UseStoreCreditDto,
    @CurrentUser() user: any,
  ) {
    return this.storeCreditService.useCredit(
      user.companyId,
      useStoreCreditDto.customerId,
      useStoreCreditDto.amount,
      useStoreCreditDto.description || `Crédito utilizado na venda`,
      useStoreCreditDto.saleId,
      user.id,
    );
  }
}


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
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('customer')
@Controller('customer')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Criar novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
  create(
    @CurrentUser() user: any,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customerService.create(user.companyId, createCustomerDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Listar clientes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista de clientes' })
  findAll(
    @CurrentUser() user: any,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('search') search?: string,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.customerService.findAll(undefined, page, limit, search);
    }
    return this.customerService.findAll(user.companyId, page, limit, search);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter estatísticas dos clientes' })
  @ApiResponse({ status: 200, description: 'Estatísticas dos clientes' })
  getStats(@CurrentUser() user: any) {
    if (user.role === UserRole.ADMIN) {
      return this.customerService.getCustomerStats();
    }
    return this.customerService.getCustomerStats(user.companyId);
  }

  @Get('cpf-cnpj/:cpfCnpj')
  @Roles(UserRole.ADMIN, UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Buscar cliente por CPF/CNPJ' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  findByCpfCnpj(
    @Param('cpfCnpj') cpfCnpj: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.customerService.findByCpfCnpj(cpfCnpj);
    }
    return this.customerService.findByCpfCnpj(cpfCnpj, user.companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.customerService.findOne(id);
    }
    return this.customerService.findOne(id, user.companyId);
  }

  @Get(':id/installments')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter vendas a prazo do cliente' })
  @ApiResponse({ status: 200, description: 'Vendas a prazo do cliente' })
  getInstallments(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.customerService.getCustomerInstallments(id);
    }
    return this.customerService.getCustomerInstallments(id, user.companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.customerService.update(id, updateCustomerDto);
    }
    return this.customerService.update(id, updateCustomerDto, user.companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Remover cliente' })
  @ApiResponse({ status: 200, description: 'Cliente removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.customerService.remove(id);
    }
    return this.customerService.remove(id, user.companyId);
  }
}

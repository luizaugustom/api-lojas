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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SellerService } from './seller.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import { UpdateSellerDataPeriodDto } from './dto/update-seller-data-period.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UuidValidationPipe } from '../../shared/pipes/uuid-validation.pipe';
import { resolveDataPeriodRangeAsISOString } from '../../shared/utils/data-period.util';

@ApiTags('seller')
@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Post()
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Criar novo vendedor' })
  @ApiResponse({ status: 201, description: 'Vendedor criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Login já está em uso' })
  create(
    @CurrentUser() user: any,
    @Body() createSellerDto: CreateSellerDto,
  ) {
    return this.sellerService.create(user.companyId, createSellerDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Listar vendedores' })
  @ApiResponse({ status: 200, description: 'Lista de vendedores' })
  findAll(@CurrentUser() user: any) {
    if (user.role === UserRole.ADMIN) {
      return this.sellerService.findAll();
    }
    return this.sellerService.findAll(user.companyId);
  }

  @Get('my-profile')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Obter perfil do vendedor' })
  @ApiResponse({ status: 200, description: 'Perfil do vendedor' })
  findMyProfile(@CurrentUser() user: any) {
    return this.sellerService.findOne(user.id);
  }

  @Get('my-stats')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Obter estatísticas do vendedor' })
  @ApiResponse({ status: 200, description: 'Estatísticas do vendedor' })
  getMyStats(@CurrentUser() user: any) {
    return this.sellerService.getSellerStats(user.id);
  }

  @Get('my-sales')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Obter vendas do vendedor' })
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

    return this.sellerService.getSellerSales(
      user.id,
      user.companyId,
      page,
      limit,
      effectiveStartDate,
      effectiveEndDate,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Buscar vendedor por ID' })
  @ApiResponse({ status: 200, description: 'Vendedor encontrado' })
  @ApiResponse({ status: 404, description: 'Vendedor não encontrado' })
  findOne(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.COMPANY) {
      return this.sellerService.findOne(id, user.companyId);
    }
    return this.sellerService.findOne(id);
  }

  @Get(':id/stats')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter estatísticas do vendedor' })
  @ApiResponse({ status: 200, description: 'Estatísticas do vendedor' })
  getStats(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.COMPANY) {
      return this.sellerService.getSellerStats(id, user.companyId);
    }
    return this.sellerService.getSellerStats(id);
  }

  @Get(':id/sales')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter vendas do vendedor' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Vendas do vendedor' })
  getSales(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    if (user.role === UserRole.COMPANY) {
      return this.sellerService.getSellerSales(id, user.companyId, page, limit);
    }
    return this.sellerService.getSellerSales(id, undefined, page, limit);
  }

  @Patch('my-profile')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Atualizar perfil do vendedor' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso' })
  updateMyProfile(
    @CurrentUser() user: any,
    @Body() updateSellerProfileDto: UpdateSellerProfileDto,
  ) {
    // Vendedor só pode atualizar campos limitados (sem hasIndividualCash)
    return this.sellerService.update(user.userId, updateSellerProfileDto);
  }

  @Patch('my-data-period')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Atualizar período padrão dos dados do vendedor' })
  @ApiResponse({ status: 200, description: 'Período atualizado com sucesso' })
  updateMyDataPeriod(
    @CurrentUser() user: any,
    @Body() updateDataPeriodDto: UpdateSellerDataPeriodDto,
  ) {
    return this.sellerService.updateDataPeriod(user.id, updateDataPeriodDto.dataPeriod);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Atualizar vendedor' })
  @ApiResponse({ status: 200, description: 'Vendedor atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Vendedor não encontrado' })
  @ApiResponse({ status: 409, description: 'Login já está em uso' })
  update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() updateSellerDto: UpdateSellerDto,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.COMPANY) {
      return this.sellerService.update(id, updateSellerDto, user.companyId);
    }
    return this.sellerService.update(id, updateSellerDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Remover vendedor' })
  @ApiResponse({ status: 200, description: 'Vendedor removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Vendedor não encontrado' })
  remove(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.COMPANY) {
      return this.sellerService.remove(id, user.companyId);
    }
    return this.sellerService.remove(id);
  }
}

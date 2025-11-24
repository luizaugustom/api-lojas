import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductLossService } from './product-loss.service';
import { CreateProductLossDto } from './dto/create-product-loss.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('product-losses')
@Controller('product-losses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProductLossController {
  constructor(private readonly productLossService: ProductLossService) {}

  @Post()
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar perda de produto' })
  @ApiResponse({
    status: 201,
    description: 'Perda registrada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Produto não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Estoque insuficiente',
  })
  async create(@CurrentUser() user: any, @Body() createProductLossDto: CreateProductLossDto) {
    return this.productLossService.create(user.companyId, createProductLossDto);
  }

  @Get()
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Listar todas as perdas de produtos' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de perdas retornada com sucesso',
  })
  async findAll(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.productLossService.findAll(user.companyId, startDate, endDate);
  }

  @Get('summary')
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Obter resumo de perdas' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: 'Resumo de perdas retornado com sucesso',
  })
  async getSummary(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.productLossService.getLossSummary(user.companyId, startDate, endDate);
  }

  @Get(':id')
  @Roles(UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Obter detalhes de uma perda específica' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da perda retornados com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Perda não encontrada',
  })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productLossService.findOne(id, user.companyId);
  }
}


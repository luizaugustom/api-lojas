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
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('product')
@Controller('product')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Criar novo produto' })
  @ApiResponse({ status: 201, description: 'Produto criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Código de barras já está em uso' })
  create(
    @CurrentUser() user: any,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productService.create(user.companyId, createProductDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Listar produtos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista de produtos' })
  findAll(
    @CurrentUser() user: any,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('search') search?: string,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.productService.findAll(undefined, page, limit, search);
    }
    return this.productService.findAll(user.companyId, page, limit, search);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter estatísticas dos produtos' })
  @ApiResponse({ status: 200, description: 'Estatísticas dos produtos' })
  getStats(@CurrentUser() user: any) {
    if (user.role === UserRole.ADMIN) {
      return this.productService.getProductStats();
    }
    return this.productService.getProductStats(user.companyId);
  }

  @Get('low-stock')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Listar produtos com estoque baixo' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de produtos com estoque baixo' })
  getLowStock(
    @CurrentUser() user: any,
    @Query('threshold', new ParseIntPipe({ optional: true })) threshold = 10,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.productService.getLowStockProducts(undefined, threshold);
    }
    return this.productService.getLowStockProducts(user.companyId, threshold);
  }

  @Get('expiring')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Listar produtos próximos do vencimento' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de produtos próximos do vencimento' })
  getExpiring(
    @CurrentUser() user: any,
    @Query('days', new ParseIntPipe({ optional: true })) days = 30,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.productService.getExpiringProducts(undefined, days);
    }
    return this.productService.getExpiringProducts(user.companyId, days);
  }

  @Get('categories')
  @Roles(UserRole.ADMIN, UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Listar categorias de produtos' })
  @ApiResponse({ status: 200, description: 'Lista de categorias' })
  getCategories(@CurrentUser() user: any) {
    if (user.role === UserRole.ADMIN) {
      return this.productService.getCategories();
    }
    return this.productService.getCategories(user.companyId);
  }

  @Get('barcode/:barcode')
  @Roles(UserRole.ADMIN, UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Buscar produto por código de barras' })
  @ApiResponse({ status: 200, description: 'Produto encontrado' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  findByBarcode(
    @Param('barcode') barcode: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.productService.findByBarcode(barcode);
    }
    return this.productService.findByBarcode(barcode, user.companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY, UserRole.SELLER)
  @ApiOperation({ summary: 'Buscar produto por ID' })
  @ApiResponse({ status: 200, description: 'Produto encontrado' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.productService.findOne(id);
    }
    return this.productService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Atualizar produto' })
  @ApiResponse({ status: 200, description: 'Produto atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({ status: 409, description: 'Código de barras já está em uso' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.COMPANY) {
      return this.productService.update(id, updateProductDto, user.companyId);
    }
    return this.productService.update(id, updateProductDto);
  }

  @Patch(':id/stock')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Atualizar estoque do produto' })
  @ApiResponse({ status: 200, description: 'Estoque atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStockDto: UpdateStockDto,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.COMPANY) {
      return this.productService.updateStock(id, updateStockDto, user.companyId);
    }
    return this.productService.updateStock(id, updateStockDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Remover produto' })
  @ApiResponse({ status: 200, description: 'Produto removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({ status: 400, description: 'Produto possui vendas associadas' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.COMPANY) {
      return this.productService.remove(id, user.companyId);
    }
    return this.productService.remove(id);
  }
}

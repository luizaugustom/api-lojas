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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UploadService } from '../upload/upload.service';
import { SanitizeProductDataInterceptor } from './interceptors/sanitize-product-data.interceptor';
import { SanitizeUpdateDataInterceptor } from './interceptors/sanitize-update-data.interceptor';
import { UuidValidationPipe } from '../../shared/pipes/uuid-validation.pipe';

@ApiTags('product')
@Controller('product')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(
    private readonly productService: ProductService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @Roles(UserRole.COMPANY)
  @UseInterceptors(SanitizeProductDataInterceptor)
  @ApiOperation({ summary: 'Criar novo produto' })
  @ApiResponse({ status: 201, description: 'Produto criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Código de barras já está em uso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
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
    @Query('threshold', new ParseIntPipe({ optional: true })) threshold = 3,
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
  @ApiResponse({ status: 400, description: 'ID inválido' })
  findOne(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.productService.findOne(id);
    }
    return this.productService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @UseInterceptors(SanitizeUpdateDataInterceptor)
  @ApiOperation({ summary: 'Atualizar produto' })
  @ApiResponse({ status: 200, description: 'Produto atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({ status: 409, description: 'Código de barras já está em uso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou ID inválido' })
  update(
    @Param('id', UuidValidationPipe) id: string,
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
  @ApiResponse({ status: 400, description: 'ID inválido' })
  updateStock(
    @Param('id', UuidValidationPipe) id: string,
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
  @ApiResponse({ status: 400, description: 'Produto possui vendas associadas ou ID inválido' })
  remove(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.COMPANY) {
      return this.productService.remove(id, user.companyId);
    }
    return this.productService.remove(id);
  }

  @Post(':id/photo')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiOperation({ summary: 'Adicionar foto ao produto' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Foto do produto',
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Foto adicionada com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido' })
  async addPhoto(
    @Param('id', UuidValidationPipe) id: string,
    @UploadedFile() photo: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!photo) {
      throw new BadRequestException('Nenhuma foto foi enviada');
    }

    // Validate file type for images
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(photo.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido. Apenas imagens são aceitas.');
    }

    const subfolder = `products/${user.companyId}`;
    const photoUrl = await this.uploadService.uploadFile(photo, subfolder);

    if (user.role === UserRole.COMPANY) {
      return this.productService.addPhoto(id, photoUrl, user.companyId);
    }
    return this.productService.addPhoto(id, photoUrl);
  }

  @Post(':id/photos')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @UseInterceptors(FilesInterceptor('photos', 10)) // Max 10 photos
  @ApiOperation({ summary: 'Adicionar múltiplas fotos ao produto' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Fotos do produto',
    schema: {
      type: 'object',
      properties: {
        photos: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Fotos adicionadas com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({ status: 400, description: 'Arquivos inválidos' })
  async addPhotos(
    @Param('id', UuidValidationPipe) id: string,
    @UploadedFiles() photos: Express.Multer.File[],
    @CurrentUser() user: any,
  ) {
    if (!photos || photos.length === 0) {
      throw new BadRequestException('Nenhuma foto foi enviada');
    }

    // Validate all files are images
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    for (const photo of photos) {
      if (!allowedMimeTypes.includes(photo.mimetype)) {
        throw new BadRequestException('Tipo de arquivo não permitido. Apenas imagens são aceitas.');
      }
    }

    const subfolder = `products/${user.companyId}`;
    const photoUrls = await this.uploadService.uploadMultipleFiles(photos, subfolder);

    if (user.role === UserRole.COMPANY) {
      return this.productService.addPhotos(id, photoUrls, user.companyId);
    }
    return this.productService.addPhotos(id, photoUrls);
  }

  @Delete(':id/photo')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Remover foto do produto' })
  @ApiResponse({ status: 200, description: 'Foto removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto ou foto não encontrada' })
  async removePhoto(
    @Param('id', UuidValidationPipe) id: string,
    @Body('photoUrl') photoUrl: string,
    @CurrentUser() user: any,
  ) {
    if (!photoUrl) {
      throw new BadRequestException('URL da foto é obrigatória');
    }

    if (user.role === UserRole.COMPANY) {
      return this.productService.removePhoto(id, photoUrl, user.companyId);
    }
    return this.productService.removePhoto(id, photoUrl);
  }

  @Delete(':id/photos')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Remover todas as fotos do produto' })
  @ApiResponse({ status: 200, description: 'Todas as fotos removidas com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async removeAllPhotos(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.COMPANY) {
      return this.productService.removeAllPhotos(id, user.companyId);
    }
    return this.productService.removeAllPhotos(id);
  }

  @Post('upload-and-create')
  @Roles(UserRole.COMPANY)
  @UseInterceptors(FilesInterceptor('photos', 3), SanitizeProductDataInterceptor) // Max 3 fotos
  @ApiOperation({ 
    summary: 'Criar produto com upload de fotos',
    description: 'Cria um produto e faz upload de até 3 fotos simultaneamente'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Fotos e dados do produto',
    schema: {
      type: 'object',
      properties: {
        photos: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          maxItems: 3,
          description: 'Máximo de 3 fotos'
        },
        name: { type: 'string' },
        barcode: { type: 'string' },
        stockQuantity: { type: 'number' },
        price: { type: 'number' },
        size: { type: 'string' },
        category: { type: 'string' },
        expirationDate: { type: 'string' },
        ncm: { type: 'string' },
        cfop: { type: 'string' },
        unitOfMeasure: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Produto criado com fotos com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou limite de fotos excedido' })
  async uploadPhotosAndCreate(
    @UploadedFiles() photos: Express.Multer.File[],
    @Body() productData: any,
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.log(`🚀 Upload and create product for company: ${user.companyId}`);
      this.logger.log(`📸 Photos received: ${photos?.length || 0}`);
      
      // Validar limite de fotos
      if (photos && photos.length > 3) {
        throw new BadRequestException('Máximo de 3 fotos por produto');
      }

      const createProductDto: CreateProductDto = {
        name: productData.name,
        barcode: productData.barcode,
        stockQuantity: parseInt(productData.stockQuantity),
        price: parseFloat(productData.price),
        size: productData.size,
        category: productData.category,
        expirationDate: productData.expirationDate,
        ncm: productData.ncm,
        cfop: productData.cfop,
        unitOfMeasure: productData.unitOfMeasure,
      };

      return await this.productService.createWithPhotos(user.companyId, createProductDto, photos || []);
    } catch (error) {
      this.logger.error('❌ Error in uploadPhotosAndCreate:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Erro ao criar produto com fotos: ${error.message || 'Erro desconhecido'}`);
    }
  }

  @Patch(':id/photos')
  @Roles(UserRole.COMPANY)
  @UseInterceptors(FilesInterceptor('photos', 3))
  @ApiOperation({ 
    summary: 'Atualizar fotos de um produto',
    description: 'Adiciona ou remove fotos de um produto existente'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          maxItems: 3
        },
        photosToDelete: {
          type: 'array',
          items: { type: 'string' }
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Fotos atualizadas' })
  @ApiResponse({ status: 400, description: 'Limite excedido' })
  async updateProductPhotos(
    @Param('id') id: string,
    @UploadedFiles() newPhotos: Express.Multer.File[],
    @Body('photosToDelete') photosToDelete: string | string[],
    @CurrentUser() user: any,
  ) {
    const photosToDeleteArray = Array.isArray(photosToDelete) 
      ? photosToDelete 
      : photosToDelete ? [photosToDelete] : [];

    return this.productService.updateWithPhotos(
      id,
      user.companyId,
      {},
      newPhotos,
      photosToDeleteArray,
    );
  }

  @Patch(':id/upload-and-update')
  @Roles(UserRole.COMPANY)
  @UseInterceptors(FilesInterceptor('photos', 3), SanitizeUpdateDataInterceptor)
  @ApiOperation({ 
    summary: 'Atualizar produto com upload de fotos',
    description: 'Atualiza um produto e faz upload de fotos simultaneamente, similar ao upload-and-create mas para edição'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Fotos e dados do produto para atualização',
    schema: {
      type: 'object',
      properties: {
        photos: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          maxItems: 3,
          description: 'Máximo de 3 fotos novas'
        },
        photosToDelete: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs das fotos a serem removidas'
        },
        name: { type: 'string' },
        barcode: { type: 'string' },
        stockQuantity: { type: 'number' },
        price: { type: 'number' },
        size: { type: 'string' },
        category: { type: 'string' },
        expirationDate: { type: 'string' },
        ncm: { type: 'string' },
        cfop: { type: 'string' },
        unitOfMeasure: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Produto atualizado com fotos com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou limite de fotos excedido' })
  async uploadPhotosAndUpdate(
    @Param('id', UuidValidationPipe) id: string,
    @UploadedFiles() photos: Express.Multer.File[],
    @Body() productData: any,
    @Body('photosToDelete') photosToDeleteBody: string | string[],
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.log(`🚀 Upload and update product ${id} for company: ${user.companyId}`);
      this.logger.log(`📸 Photos received: ${photos?.length || 0}`);
      
      // Validar limite de fotos
      if (photos && photos.length > 3) {
        throw new BadRequestException('Máximo de 3 fotos por produto');
      }

      // Processar photosToDelete - FormData pode enviar como array ou string separada por vírgula
      let photosToDelete: string[] = [];
      
      // Log para debug
      this.logger.log(`📋 photosToDeleteBody type: ${typeof photosToDeleteBody}`);
      this.logger.log(`📋 photosToDeleteBody value: ${JSON.stringify(photosToDeleteBody)}`);
      this.logger.log(`📋 productData.photosToDelete: ${JSON.stringify(productData.photosToDelete)}`);
      
      // Tentar obter do parâmetro específico primeiro
      if (photosToDeleteBody) {
        if (Array.isArray(photosToDeleteBody)) {
          photosToDelete = photosToDeleteBody;
        } else if (typeof photosToDeleteBody === 'string') {
          // Se for string, pode ser JSON array ou string separada por vírgula
          try {
            const parsed = JSON.parse(photosToDeleteBody);
            photosToDelete = Array.isArray(parsed) ? parsed : [photosToDeleteBody];
          } catch {
            // Se não for JSON, tratar como string única ou separada por vírgula
            photosToDelete = photosToDeleteBody.includes(',') 
              ? photosToDeleteBody.split(',').map(s => s.trim()).filter(s => s.length > 0)
              : [photosToDeleteBody];
          }
        }
      }
      
      // Fallback para productData.photosToDelete
      if (photosToDelete.length === 0 && productData.photosToDelete) {
        if (Array.isArray(productData.photosToDelete)) {
          photosToDelete = productData.photosToDelete;
        } else if (typeof productData.photosToDelete === 'string') {
          try {
            const parsed = JSON.parse(productData.photosToDelete);
            photosToDelete = Array.isArray(parsed) ? parsed : [productData.photosToDelete];
          } catch {
            photosToDelete = productData.photosToDelete.includes(',') 
              ? productData.photosToDelete.split(',').map(s => s.trim()).filter(s => s.length > 0)
              : [productData.photosToDelete];
          }
        }
      }
      
      this.logger.log(`🗑️ Photos to delete (${photosToDelete.length}): ${JSON.stringify(photosToDelete)}`);

      // Criar UpdateProductDto apenas com campos presentes
      const updateProductDto: UpdateProductDto = {};
      
      if (productData.name !== undefined) updateProductDto.name = productData.name;
      if (productData.barcode !== undefined) updateProductDto.barcode = productData.barcode;
      if (productData.stockQuantity !== undefined) updateProductDto.stockQuantity = parseInt(productData.stockQuantity);
      if (productData.price !== undefined) updateProductDto.price = parseFloat(productData.price);
      if (productData.size !== undefined) updateProductDto.size = productData.size;
      if (productData.category !== undefined) updateProductDto.category = productData.category;
      if (productData.expirationDate !== undefined) updateProductDto.expirationDate = productData.expirationDate;
      if (productData.ncm !== undefined) updateProductDto.ncm = productData.ncm;
      if (productData.cfop !== undefined) updateProductDto.cfop = productData.cfop;
      if (productData.unitOfMeasure !== undefined) updateProductDto.unitOfMeasure = productData.unitOfMeasure;

      return await this.productService.updateWithPhotos(
        id,
        user.companyId,
        updateProductDto,
        photos || [],
        photosToDelete,
      );
    } catch (error) {
      this.logger.error('❌ Error in uploadPhotosAndUpdate:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Erro ao atualizar produto com fotos: ${error.message || 'Erro desconhecido'}`);
    }
  }
}

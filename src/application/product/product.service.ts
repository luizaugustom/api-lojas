import { Injectable, ConflictException, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { UploadService } from '../upload/upload.service';
import { PlanLimitsService } from '../../shared/services/plan-limits.service';
import { ProductPhotoService } from './services/product-photo.service';
import { ProductPhotoValidationService } from './services/product-photo-validation.service';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly planLimitsService: PlanLimitsService,
    private readonly photoService: ProductPhotoService,
    private readonly photoValidationService: ProductPhotoValidationService,
  ) {}

  private normalizePhotos(value: any): string[] {
    if (Array.isArray(value)) return value as string[];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed as string[];
        return value ? [value] : [];
      } catch {
        return value ? [value] : [];
      }
    }
    return [];
  }

  private serializePhotos(arr?: string[] | null): string[] {
    if (!arr || arr.length === 0) return [];
    // Prisma espera um array de strings, não uma string JSON
    return arr;
  }

  async create(companyId: string, createProductDto: CreateProductDto) {
    try {
      this.logger.log(`🚀 Creating product for company: ${companyId}`);
      this.logger.log(`📋 Product data: ${JSON.stringify(createProductDto)}`);
      this.logger.log(`💰 costPrice: ${createProductDto.costPrice}`);
      
      // Validar limite de produtos do plano
      await this.planLimitsService.validateProductLimit(companyId);
      
      const product = await this.prisma.product.create({
        data: {
          ...createProductDto,
          ...(createProductDto.photos ? { photos: this.serializePhotos(createProductDto.photos) as any } : {}),
          companyId,
        },
        select: {
          id: true,
          name: true,
          photos: true,
          barcode: true,
          size: true,
          stockQuantity: true,
          price: true,
          costPrice: true,
          category: true,
          expirationDate: true,
          ncm: true,
          cfop: true,
          unitOfMeasure: true,
          createdAt: true,
          updatedAt: true,
          companyId: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(`✅ Product created: ${product.id} for company: ${companyId}`);
      this.logger.log(`📸 Product photos: ${JSON.stringify(product.photos)}`);
      this.logger.log(`💰 Product costPrice: ${product.costPrice}`);
      return { ...product, photos: this.normalizePhotos((product as any).photos) } as any;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Código de barras já está em uso');
      }
      this.logger.error('Error creating product:', error);
      throw error;
    }
  }

  async createWithPhotos(
    companyId: string, 
    createProductDto: CreateProductDto, 
    photos: Express.Multer.File[]
  ) {
    try {
      this.logger.log(`🚀 Creating product with photos for company: ${companyId}`);
      this.logger.log(`📸 Number of photos: ${photos?.length || 0}`);
      this.logger.log(`💰 costPrice: ${createProductDto.costPrice}`);
      
      // Validar limite de produtos do plano
      await this.planLimitsService.validateProductLimit(companyId);
      
      // Processar fotos se houver
      let photoUrls: string[] = [];
      if (photos && photos.length > 0) {
        photoUrls = await this.photoService.uploadProductPhotos(companyId, photos, 0);
      }
      
      const product = await this.prisma.product.create({
        data: {
          ...createProductDto,
          photos: this.serializePhotos(photoUrls) as any,
          companyId,
        },
        select: {
          id: true,
          name: true,
          photos: true,
          barcode: true,
          size: true,
          stockQuantity: true,
          price: true,
          costPrice: true,
          category: true,
          expirationDate: true,
          ncm: true,
          cfop: true,
          unitOfMeasure: true,
          createdAt: true,
          updatedAt: true,
          companyId: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(`✅ Product with photos created: ${product.id}`);
      this.logger.log(`📸 Photos uploaded: ${photoUrls.length}`);
      this.logger.log(`💰 Product costPrice: ${product.costPrice}`);
      return { ...product, photos: this.normalizePhotos((product as any).photos) } as any;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Código de barras já está em uso');
      }
      this.logger.error('Error creating product with photos:', error);
      throw error;
    }
  }

  async findAll(companyId?: string, page = 1, limit = 10, search?: string) {
    const where: any = {};
    
    if (companyId) {
      where.companyId = companyId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          photos: true,
          barcode: true,
          size: true,
          stockQuantity: true,
          price: true,
          costPrice: true,
          category: true,
          expirationDate: true,
          ncm: true,
          cfop: true,
          unitOfMeasure: true,
          createdAt: true,
          updatedAt: true,
          companyId: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              saleItems: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Ordenar por total de vendas (mais vendido primeiro)
    const sortedProducts = products.sort((a, b) => b._count.saleItems - a._count.saleItems);
    
    // Aplicar paginação manual
    const paginatedProducts = sortedProducts.slice((page - 1) * limit, page * limit);

    return {
      products: paginatedProducts.map(p => {
        const { _count, ...productWithoutCount } = p;
        return { ...productWithoutCount, photos: this.normalizePhotos((productWithoutCount as any).photos) };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, companyId?: string) {
    // Always fetch by the unique id, then validate company ownership if provided
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        photos: true,
        barcode: true,
        size: true,
        stockQuantity: true,
        price: true,
        costPrice: true,
        category: true,
        expirationDate: true,
        ncm: true,
        cfop: true,
        unitOfMeasure: true,
        createdAt: true,
        updatedAt: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            saleItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (companyId && product.companyId && product.companyId !== companyId) {
      // Hide existence of a product that belongs to another company
      throw new NotFoundException('Produto não encontrado');
    }

    return { ...product, photos: this.normalizePhotos((product as any).photos) } as any;
  }

  async findByBarcode(barcode: string, companyId?: string) {
    const where: any = { barcode };
    if (companyId) {
      where.companyId = companyId;
    }

    const product = await this.prisma.product.findFirst({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return { ...product, photos: this.normalizePhotos((product as any).photos) } as any;
  }

  async update(id: string, updateProductDto: UpdateProductDto, companyId?: string) {
    try {
      // Fetch by id and validate ownership
      const existingProduct = await this.prisma.product.findUnique({ where: { id } });

      if (!existingProduct) {
        throw new NotFoundException('Produto não encontrado');
      }

      if (companyId && existingProduct.companyId && existingProduct.companyId !== companyId) {
        throw new NotFoundException('Produto não encontrado');
      }

      const product = await this.prisma.product.update({
        where: { id },
        data: {
          ...updateProductDto,
          ...(updateProductDto.photos ? { photos: this.serializePhotos(updateProductDto.photos) as any } : {}),
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(`Product updated: ${product.id}`);
      return { ...product, photos: this.normalizePhotos((product as any).photos) } as any;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Código de barras já está em uso');
      }
      this.logger.error('Error updating product:', error);
      throw error;
    }
  }

  async updateWithPhotos(
    id: string,
    companyId: string,
    updateProductDto: UpdateProductDto,
    newPhotos?: Express.Multer.File[],
    photosToDelete?: string[],
  ) {
    try {
      // Buscar produto atual
      const existingProduct = await this.prisma.product.findUnique({ 
        where: { id },
        select: { id: true, photos: true, companyId: true }
      });

      if (!existingProduct) {
        throw new NotFoundException('Produto não encontrado');
      }

      if (existingProduct.companyId !== companyId) {
        throw new NotFoundException('Produto não encontrado');
      }

      // Processar fotos
      const updatedPhotos = await this.photoService.prepareProductPhotos(
        companyId,
        newPhotos || [],
        this.normalizePhotos((existingProduct as any).photos) || [],
        photosToDelete || [],
      );

      const product = await this.prisma.product.update({
        where: { id },
        data: {
          ...updateProductDto,
          photos: this.serializePhotos(updatedPhotos) as any,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(`✅ Product updated with photos: ${id}`);
      this.logger.log(`📸 New photo count: ${updatedPhotos.length}`);
      return { ...product, photos: this.normalizePhotos((product as any).photos) } as any;
    } catch (error) {
      this.logger.error('Error updating product with photos:', error);
      throw error;
    }
  }

  async remove(id: string, companyId?: string) {
    try {
      this.logger.log(`🚀 Starting product deletion process for ID: ${id}, CompanyID: ${companyId || 'null'}`);
      
      const existingProduct = await this.prisma.product.findUnique({ where: { id } });

      if (!existingProduct) {
        throw new NotFoundException('Produto não encontrado');
      }

      if (companyId && existingProduct.companyId !== companyId) {
        throw new NotFoundException('Produto não encontrado');
      }

      // Check if product has sales
      const salesCount = await this.prisma.saleItem.count({
        where: { productId: id },
      });

      if (salesCount > 0) {
        throw new BadRequestException('Não é possível excluir produto que possui vendas');
      }

      // Delete product images before deleting the product
      if (this.normalizePhotos((existingProduct as any).photos).length > 0) {
        this.logger.log(`🗑️ Deleting ${existingProduct.photos.length} images for product: ${id}`);
        this.logger.log(`📋 Photos to delete: ${JSON.stringify(existingProduct.photos)}`);
        
        const deleteResult = await this.uploadService.deleteMultipleFiles(this.normalizePhotos((existingProduct as any).photos));
        
        this.logger.log(`✅ Images deletion result for product ${id}: ${deleteResult.deleted} deleted, ${deleteResult.failed} failed`);
        
        // Log warning if some files failed to delete
        if (deleteResult.failed > 0) {
          this.logger.warn(`⚠️ Failed to delete ${deleteResult.failed} images for product ${id}. Product will still be deleted.`);
        }
      } else {
        this.logger.log(`ℹ️ No photos to delete for product: ${id}`);
      }

      // Delete the product from database
      await this.prisma.product.delete({ where: { id } });

      this.logger.log(`Product deleted: ${id}`);
      return { message: 'Produto removido com sucesso' };
    } catch (error) {
      this.logger.error('Error deleting product:', error);
      throw error;
    }
  }

  async updateStock(id: string, updateStockDto: UpdateStockDto, companyId?: string) {
    const where: any = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    // Fetch by id and validate ownership
    const existingProduct = await this.prisma.product.findUnique({ where: { id } });

    if (!existingProduct) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (companyId && existingProduct.companyId && existingProduct.companyId !== companyId) {
      throw new NotFoundException('Produto não encontrado');
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        stockQuantity: updateStockDto.stockQuantity,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`Product stock updated: ${product.id} to ${updateStockDto.stockQuantity}`);
    return { ...product, photos: this.normalizePhotos((product as any).photos) } as any;
  }

  async getLowStockProducts(companyId?: string, threshold = 3) {
    const where: any = {
      stockQuantity: {
        lte: threshold,
      },
    };

    if (companyId) {
      where.companyId = companyId;
    }

    return this.prisma.product.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        stockQuantity: 'asc',
      },
    });
  }

  async getExpiringProducts(companyId?: string, days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const where: any = {
      expirationDate: {
        lte: futureDate,
        gte: new Date(),
      },
    };

    if (companyId) {
      where.companyId = companyId;
    }

    return this.prisma.product.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        expirationDate: 'asc',
      },
    });
  }

  async getProductStats(companyId?: string) {
    const where = companyId ? { companyId } : {};

    const [totalProducts, lowStockCount, expiringCount, totalStockValue] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.count({
        where: {
          ...where,
          stockQuantity: { lte: 10 },
        },
      }),
      this.prisma.product.count({
        where: {
          ...where,
          expirationDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            gte: new Date(),
          },
        },
      }),
      this.prisma.product.aggregate({
        where,
        _sum: {
          stockQuantity: true,
        },
      }),
    ]);

    return {
      totalProducts,
      lowStockCount,
      expiringCount,
      totalStockQuantity: totalStockValue._sum.stockQuantity || 0,
    };
  }

  async getCategories(companyId?: string) {
    const where = companyId ? { companyId } : {};

    const categories = await this.prisma.product.findMany({
      where: {
        ...where,
        category: {
          not: null,
        },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return categories.map(item => item.category).filter(Boolean);
  }

  async addPhoto(id: string, photoUrl: string, companyId?: string) {
    // First verify the product exists and belongs to the company
    const existingProduct = await this.prisma.product.findUnique({ where: { id } });

    if (!existingProduct) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (companyId && existingProduct.companyId && existingProduct.companyId !== companyId) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Validar limites de fotos
    const currentPhotos = this.normalizePhotos((existingProduct as any).photos);
    await this.photoValidationService.validatePhotoLimit(
      existingProduct.companyId,
      currentPhotos.length,
      1 // Adicionando 1 foto
    );

    // Add the new photo to the existing photos array
    const updatedPhotos = [...currentPhotos, photoUrl];

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        photos: this.serializePhotos(updatedPhotos) as any,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`Photo added to product: ${product.id}`);
    return { ...product, photos: this.normalizePhotos((product as any).photos) } as any;
  }

  async addPhotos(id: string, photoUrls: string[], companyId?: string) {
    // First verify the product exists and belongs to the company
    const existingProduct = await this.prisma.product.findUnique({ where: { id } });

    if (!existingProduct) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (companyId && existingProduct.companyId && existingProduct.companyId !== companyId) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Validar limites de fotos
    const currentPhotos = this.normalizePhotos((existingProduct as any).photos);
    await this.photoValidationService.validatePhotoLimit(
      existingProduct.companyId,
      currentPhotos.length,
      photoUrls.length // Adicionando múltiplas fotos
    );

    // Add the new photos to the existing photos array
    const updatedPhotos = [...currentPhotos, ...photoUrls];

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        photos: this.serializePhotos(updatedPhotos) as any,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`${photoUrls.length} photos added to product: ${product.id}`);
    return { ...product, photos: this.normalizePhotos((product as any).photos) } as any;
  }

  async removePhoto(id: string, photoUrl: string, companyId?: string) {
    // First verify the product exists and belongs to the company
    const existingProduct = await this.prisma.product.findUnique({ where: { id } });

    if (!existingProduct) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (companyId && existingProduct.companyId && existingProduct.companyId !== companyId) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Check if the photo exists in the product's photos array
    if (!this.normalizePhotos((existingProduct as any).photos).includes(photoUrl)) {
      throw new NotFoundException('Foto não encontrada no produto');
    }

    // Remove the photo from the array
    const updatedPhotos = this.normalizePhotos((existingProduct as any).photos).filter(photo => photo !== photoUrl);

    // Delete the photo file from the filesystem
    const fileDeleted = await this.uploadService.deleteFile(photoUrl);
    if (fileDeleted) {
      this.logger.log(`Photo file deleted from filesystem: ${photoUrl}`);
    } else {
      this.logger.warn(`Failed to delete photo file from filesystem: ${photoUrl}`);
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        photos: this.serializePhotos(updatedPhotos) as any,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`Photo removed from product: ${product.id}`);
    return { ...product, photos: this.normalizePhotos((product as any).photos) } as any;
  }

  async removeAllPhotos(id: string, companyId?: string) {
    // First verify the product exists and belongs to the company
    const existingProduct = await this.prisma.product.findUnique({ where: { id } });

    if (!existingProduct) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (companyId && existingProduct.companyId !== companyId) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Delete all photo files from the filesystem
    if (this.normalizePhotos((existingProduct as any).photos).length > 0) {
      this.logger.log(`Deleting ${existingProduct.photos.length} photos from filesystem for product: ${id}`);
      
      const deleteResult = await this.uploadService.deleteMultipleFiles(this.normalizePhotos((existingProduct as any).photos));
      
      this.logger.log(`Photos deletion result for product ${id}: ${deleteResult.deleted} deleted, ${deleteResult.failed} failed`);
      
      // Log warning if some files failed to delete
      if (deleteResult.failed > 0) {
        this.logger.warn(`Failed to delete ${deleteResult.failed} photos for product ${id}. Product photos will still be cleared.`);
      }
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        photos: this.serializePhotos([]) as any,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`All photos removed from product: ${product.id}`);
    return { ...product, photos: this.normalizePhotos((product as any).photos) } as any;
  }
}

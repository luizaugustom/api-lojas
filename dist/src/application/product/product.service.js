"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProductService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const upload_service_1 = require("../upload/upload.service");
const plan_limits_service_1 = require("../../shared/services/plan-limits.service");
const product_photo_service_1 = require("./services/product-photo.service");
const product_photo_validation_service_1 = require("./services/product-photo-validation.service");
let ProductService = ProductService_1 = class ProductService {
    constructor(prisma, uploadService, planLimitsService, photoService, photoValidationService) {
        this.prisma = prisma;
        this.uploadService = uploadService;
        this.planLimitsService = planLimitsService;
        this.photoService = photoService;
        this.photoValidationService = photoValidationService;
        this.logger = new common_1.Logger(ProductService_1.name);
    }
    async create(companyId, createProductDto) {
        try {
            this.logger.log(`🚀 Creating product for company: ${companyId}`);
            this.logger.log(`📋 Product data: ${JSON.stringify(createProductDto)}`);
            await this.planLimitsService.validateProductLimit(companyId);
            const product = await this.prisma.product.create({
                data: {
                    ...createProductDto,
                    companyId,
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
            this.logger.log(`✅ Product created: ${product.id} for company: ${companyId}`);
            this.logger.log(`📸 Product photos: ${JSON.stringify(product.photos)}`);
            return product;
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Código de barras já está em uso');
            }
            this.logger.error('Error creating product:', error);
            throw error;
        }
    }
    async createWithPhotos(companyId, createProductDto, photos) {
        try {
            this.logger.log(`🚀 Creating product with photos for company: ${companyId}`);
            this.logger.log(`📸 Number of photos: ${photos?.length || 0}`);
            await this.planLimitsService.validateProductLimit(companyId);
            let photoUrls = [];
            if (photos && photos.length > 0) {
                photoUrls = await this.photoService.uploadProductPhotos(companyId, photos, 0);
            }
            const product = await this.prisma.product.create({
                data: {
                    ...createProductDto,
                    photos: photoUrls,
                    companyId,
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
            this.logger.log(`✅ Product with photos created: ${product.id}`);
            this.logger.log(`📸 Photos uploaded: ${photoUrls.length}`);
            return product;
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Código de barras já está em uso');
            }
            this.logger.error('Error creating product with photos:', error);
            throw error;
        }
    }
    async findAll(companyId, page = 1, limit = 10, search) {
        const where = {};
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
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.product.count({ where }),
        ]);
        return {
            products,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id, companyId) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
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
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        if (companyId && product.companyId && product.companyId !== companyId) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        return product;
    }
    async findByBarcode(barcode, companyId) {
        const where = { barcode };
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
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        return product;
    }
    async update(id, updateProductDto, companyId) {
        try {
            const existingProduct = await this.prisma.product.findUnique({ where: { id } });
            if (!existingProduct) {
                throw new common_1.NotFoundException('Produto não encontrado');
            }
            if (companyId && existingProduct.companyId && existingProduct.companyId !== companyId) {
                throw new common_1.NotFoundException('Produto não encontrado');
            }
            const product = await this.prisma.product.update({
                where: { id },
                data: updateProductDto,
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
            return product;
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Código de barras já está em uso');
            }
            this.logger.error('Error updating product:', error);
            throw error;
        }
    }
    async updateWithPhotos(id, companyId, updateProductDto, newPhotos, photosToDelete) {
        try {
            const existingProduct = await this.prisma.product.findUnique({
                where: { id },
                select: { id: true, photos: true, companyId: true }
            });
            if (!existingProduct) {
                throw new common_1.NotFoundException('Produto não encontrado');
            }
            if (existingProduct.companyId !== companyId) {
                throw new common_1.NotFoundException('Produto não encontrado');
            }
            const updatedPhotos = await this.photoService.prepareProductPhotos(companyId, newPhotos || [], existingProduct.photos || [], photosToDelete || []);
            const product = await this.prisma.product.update({
                where: { id },
                data: {
                    ...updateProductDto,
                    photos: updatedPhotos,
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
            return product;
        }
        catch (error) {
            this.logger.error('Error updating product with photos:', error);
            throw error;
        }
    }
    async remove(id, companyId) {
        try {
            this.logger.log(`🚀 Starting product deletion process for ID: ${id}, CompanyID: ${companyId || 'null'}`);
            const existingProduct = await this.prisma.product.findUnique({ where: { id } });
            if (!existingProduct) {
                throw new common_1.NotFoundException('Produto não encontrado');
            }
            if (companyId && existingProduct.companyId !== companyId) {
                throw new common_1.NotFoundException('Produto não encontrado');
            }
            const salesCount = await this.prisma.saleItem.count({
                where: { productId: id },
            });
            if (salesCount > 0) {
                throw new common_1.BadRequestException('Não é possível excluir produto que possui vendas');
            }
            if (existingProduct.photos && existingProduct.photos.length > 0) {
                this.logger.log(`🗑️ Deleting ${existingProduct.photos.length} images for product: ${id}`);
                this.logger.log(`📋 Photos to delete: ${JSON.stringify(existingProduct.photos)}`);
                const deleteResult = await this.uploadService.deleteMultipleFiles(existingProduct.photos);
                this.logger.log(`✅ Images deletion result for product ${id}: ${deleteResult.deleted} deleted, ${deleteResult.failed} failed`);
                if (deleteResult.failed > 0) {
                    this.logger.warn(`⚠️ Failed to delete ${deleteResult.failed} images for product ${id}. Product will still be deleted.`);
                }
            }
            else {
                this.logger.log(`ℹ️ No photos to delete for product: ${id}`);
            }
            await this.prisma.product.delete({ where: { id } });
            this.logger.log(`Product deleted: ${id}`);
            return { message: 'Produto removido com sucesso' };
        }
        catch (error) {
            this.logger.error('Error deleting product:', error);
            throw error;
        }
    }
    async updateStock(id, updateStockDto, companyId) {
        const where = { id };
        if (companyId) {
            where.companyId = companyId;
        }
        const existingProduct = await this.prisma.product.findUnique({ where: { id } });
        if (!existingProduct) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        if (companyId && existingProduct.companyId && existingProduct.companyId !== companyId) {
            throw new common_1.NotFoundException('Produto não encontrado');
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
        return product;
    }
    async getLowStockProducts(companyId, threshold = 3) {
        const where = {
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
    async getExpiringProducts(companyId, days = 30) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        const where = {
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
    async getProductStats(companyId) {
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
    async getCategories(companyId) {
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
    async addPhoto(id, photoUrl, companyId) {
        const existingProduct = await this.prisma.product.findUnique({ where: { id } });
        if (!existingProduct) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        if (companyId && existingProduct.companyId && existingProduct.companyId !== companyId) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        const updatedPhotos = [...existingProduct.photos, photoUrl];
        const product = await this.prisma.product.update({
            where: { id },
            data: {
                photos: updatedPhotos,
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
        return product;
    }
    async addPhotos(id, photoUrls, companyId) {
        const existingProduct = await this.prisma.product.findUnique({ where: { id } });
        if (!existingProduct) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        if (companyId && existingProduct.companyId && existingProduct.companyId !== companyId) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        const updatedPhotos = [...existingProduct.photos, ...photoUrls];
        const product = await this.prisma.product.update({
            where: { id },
            data: {
                photos: updatedPhotos,
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
        return product;
    }
    async removePhoto(id, photoUrl, companyId) {
        const existingProduct = await this.prisma.product.findUnique({ where: { id } });
        if (!existingProduct) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        if (companyId && existingProduct.companyId && existingProduct.companyId !== companyId) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        if (!existingProduct.photos.includes(photoUrl)) {
            throw new common_1.NotFoundException('Foto não encontrada no produto');
        }
        const updatedPhotos = existingProduct.photos.filter(photo => photo !== photoUrl);
        const fileDeleted = await this.uploadService.deleteFile(photoUrl);
        if (fileDeleted) {
            this.logger.log(`Photo file deleted from filesystem: ${photoUrl}`);
        }
        else {
            this.logger.warn(`Failed to delete photo file from filesystem: ${photoUrl}`);
        }
        const product = await this.prisma.product.update({
            where: { id },
            data: {
                photos: updatedPhotos,
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
        return product;
    }
    async removeAllPhotos(id, companyId) {
        const existingProduct = await this.prisma.product.findUnique({ where: { id } });
        if (!existingProduct) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        if (companyId && existingProduct.companyId !== companyId) {
            throw new common_1.NotFoundException('Produto não encontrado');
        }
        if (existingProduct.photos && existingProduct.photos.length > 0) {
            this.logger.log(`Deleting ${existingProduct.photos.length} photos from filesystem for product: ${id}`);
            const deleteResult = await this.uploadService.deleteMultipleFiles(existingProduct.photos);
            this.logger.log(`Photos deletion result for product ${id}: ${deleteResult.deleted} deleted, ${deleteResult.failed} failed`);
            if (deleteResult.failed > 0) {
                this.logger.warn(`Failed to delete ${deleteResult.failed} photos for product ${id}. Product photos will still be cleared.`);
            }
        }
        const product = await this.prisma.product.update({
            where: { id },
            data: {
                photos: [],
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
        return product;
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = ProductService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        upload_service_1.UploadService,
        plan_limits_service_1.PlanLimitsService,
        product_photo_service_1.ProductPhotoService,
        product_photo_validation_service_1.ProductPhotoValidationService])
], ProductService);
//# sourceMappingURL=product.service.js.map
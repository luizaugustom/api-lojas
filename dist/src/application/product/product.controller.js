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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ProductController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const product_service_1 = require("./product.service");
const create_product_dto_1 = require("./dto/create-product.dto");
const update_product_dto_1 = require("./dto/update-product.dto");
const update_stock_dto_1 = require("./dto/update-stock.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const upload_service_1 = require("../upload/upload.service");
const sanitize_product_data_interceptor_1 = require("./interceptors/sanitize-product-data.interceptor");
const sanitize_update_data_interceptor_1 = require("./interceptors/sanitize-update-data.interceptor");
const uuid_validation_pipe_1 = require("../../shared/pipes/uuid-validation.pipe");
let ProductController = ProductController_1 = class ProductController {
    constructor(productService, uploadService) {
        this.productService = productService;
        this.uploadService = uploadService;
        this.logger = new common_1.Logger(ProductController_1.name);
    }
    create(user, createProductDto) {
        return this.productService.create(user.companyId, createProductDto);
    }
    findAll(user, page = 1, limit = 10, search) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.productService.findAll(undefined, page, limit, search);
        }
        return this.productService.findAll(user.companyId, page, limit, search);
    }
    getStats(user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.productService.getProductStats();
        }
        return this.productService.getProductStats(user.companyId);
    }
    getLowStock(user, threshold = 3) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.productService.getLowStockProducts(undefined, threshold);
        }
        return this.productService.getLowStockProducts(user.companyId, threshold);
    }
    getExpiring(user, days = 30) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.productService.getExpiringProducts(undefined, days);
        }
        return this.productService.getExpiringProducts(user.companyId, days);
    }
    getCategories(user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.productService.getCategories();
        }
        return this.productService.getCategories(user.companyId);
    }
    findByBarcode(barcode, user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.productService.findByBarcode(barcode);
        }
        return this.productService.findByBarcode(barcode, user.companyId);
    }
    findOne(id, user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.productService.findOne(id);
        }
        return this.productService.findOne(id, user.companyId);
    }
    update(id, updateProductDto, user) {
        if (user.role === roles_decorator_1.UserRole.COMPANY) {
            return this.productService.update(id, updateProductDto, user.companyId);
        }
        return this.productService.update(id, updateProductDto);
    }
    updateStock(id, updateStockDto, user) {
        if (user.role === roles_decorator_1.UserRole.COMPANY) {
            return this.productService.updateStock(id, updateStockDto, user.companyId);
        }
        return this.productService.updateStock(id, updateStockDto);
    }
    remove(id, user) {
        if (user.role === roles_decorator_1.UserRole.COMPANY) {
            return this.productService.remove(id, user.companyId);
        }
        return this.productService.remove(id);
    }
    async addPhoto(id, photo, user) {
        if (!photo) {
            throw new common_1.BadRequestException('Nenhuma foto foi enviada');
        }
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(photo.mimetype)) {
            throw new common_1.BadRequestException('Tipo de arquivo não permitido. Apenas imagens são aceitas.');
        }
        const subfolder = `products/${user.companyId}`;
        const photoUrl = await this.uploadService.uploadFile(photo, subfolder);
        if (user.role === roles_decorator_1.UserRole.COMPANY) {
            return this.productService.addPhoto(id, photoUrl, user.companyId);
        }
        return this.productService.addPhoto(id, photoUrl);
    }
    async addPhotos(id, photos, user) {
        if (!photos || photos.length === 0) {
            throw new common_1.BadRequestException('Nenhuma foto foi enviada');
        }
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        for (const photo of photos) {
            if (!allowedMimeTypes.includes(photo.mimetype)) {
                throw new common_1.BadRequestException('Tipo de arquivo não permitido. Apenas imagens são aceitas.');
            }
        }
        const subfolder = `products/${user.companyId}`;
        const photoUrls = await this.uploadService.uploadMultipleFiles(photos, subfolder);
        if (user.role === roles_decorator_1.UserRole.COMPANY) {
            return this.productService.addPhotos(id, photoUrls, user.companyId);
        }
        return this.productService.addPhotos(id, photoUrls);
    }
    async removePhoto(id, photoUrl, user) {
        if (!photoUrl) {
            throw new common_1.BadRequestException('URL da foto é obrigatória');
        }
        if (user.role === roles_decorator_1.UserRole.COMPANY) {
            return this.productService.removePhoto(id, photoUrl, user.companyId);
        }
        return this.productService.removePhoto(id, photoUrl);
    }
    async removeAllPhotos(id, user) {
        if (user.role === roles_decorator_1.UserRole.COMPANY) {
            return this.productService.removeAllPhotos(id, user.companyId);
        }
        return this.productService.removeAllPhotos(id);
    }
    async uploadPhotosAndCreate(photos, productData, user) {
        try {
            this.logger.log(`🚀 Upload and create product for company: ${user.companyId}`);
            this.logger.log(`📸 Photos received: ${photos?.length || 0}`);
            if (photos && photos.length > 3) {
                throw new common_1.BadRequestException('Máximo de 3 fotos por produto');
            }
            const createProductDto = {
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
        }
        catch (error) {
            this.logger.error('❌ Error in uploadPhotosAndCreate:', error);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Erro ao criar produto com fotos: ${error.message || 'Erro desconhecido'}`);
        }
    }
    async updateProductPhotos(id, newPhotos, photosToDelete, user) {
        const photosToDeleteArray = Array.isArray(photosToDelete)
            ? photosToDelete
            : photosToDelete ? [photosToDelete] : [];
        return this.productService.updateWithPhotos(id, user.companyId, {}, newPhotos, photosToDeleteArray);
    }
    async uploadPhotosAndUpdate(id, photos, productData, photosToDeleteBody, user) {
        try {
            this.logger.log(`🚀 Upload and update product ${id} for company: ${user.companyId}`);
            this.logger.log(`📸 Photos received: ${photos?.length || 0}`);
            if (photos && photos.length > 3) {
                throw new common_1.BadRequestException('Máximo de 3 fotos por produto');
            }
            let photosToDelete = [];
            if (photosToDeleteBody) {
                photosToDelete = Array.isArray(photosToDeleteBody)
                    ? photosToDeleteBody
                    : [photosToDeleteBody];
            }
            else if (productData.photosToDelete) {
                photosToDelete = Array.isArray(productData.photosToDelete)
                    ? productData.photosToDelete
                    : [productData.photosToDelete];
            }
            const updateProductDto = {};
            if (productData.name !== undefined)
                updateProductDto.name = productData.name;
            if (productData.barcode !== undefined)
                updateProductDto.barcode = productData.barcode;
            if (productData.stockQuantity !== undefined)
                updateProductDto.stockQuantity = parseInt(productData.stockQuantity);
            if (productData.price !== undefined)
                updateProductDto.price = parseFloat(productData.price);
            if (productData.size !== undefined)
                updateProductDto.size = productData.size;
            if (productData.category !== undefined)
                updateProductDto.category = productData.category;
            if (productData.expirationDate !== undefined)
                updateProductDto.expirationDate = productData.expirationDate;
            if (productData.ncm !== undefined)
                updateProductDto.ncm = productData.ncm;
            if (productData.cfop !== undefined)
                updateProductDto.cfop = productData.cfop;
            if (productData.unitOfMeasure !== undefined)
                updateProductDto.unitOfMeasure = productData.unitOfMeasure;
            return await this.productService.updateWithPhotos(id, user.companyId, updateProductDto, photos || [], photosToDelete);
        }
        catch (error) {
            this.logger.error('❌ Error in uploadPhotosAndUpdate:', error);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Erro ao atualizar produto com fotos: ${error.message || 'Erro desconhecido'}`);
        }
    }
};
exports.ProductController = ProductController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, common_1.UseInterceptors)(sanitize_product_data_interceptor_1.SanitizeProductDataInterceptor),
    (0, swagger_1.ApiOperation)({ summary: 'Criar novo produto' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Produto criado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Código de barras já está em uso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_product_dto_1.CreateProductDto]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar produtos' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de produtos' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter estatísticas dos produtos' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estatísticas dos produtos' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('low-stock'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Listar produtos com estoque baixo' }),
    (0, swagger_1.ApiQuery)({ name: 'threshold', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de produtos com estoque baixo' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('threshold', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getLowStock", null);
__decorate([
    (0, common_1.Get)('expiring'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Listar produtos próximos do vencimento' }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de produtos próximos do vencimento' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('days', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getExpiring", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar categorias de produtos' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de categorias' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)('barcode/:barcode'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar produto por código de barras' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Produto encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Produto não encontrado' }),
    __param(0, (0, common_1.Param)('barcode')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "findByBarcode", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar produto por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Produto encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Produto não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'ID inválido' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, common_1.UseInterceptors)(sanitize_update_data_interceptor_1.SanitizeUpdateDataInterceptor),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar produto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Produto atualizado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Produto não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Código de barras já está em uso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos ou ID inválido' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_product_dto_1.UpdateProductDto, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/stock'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar estoque do produto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estoque atualizado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Produto não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'ID inválido' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_stock_dto_1.UpdateStockDto, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "updateStock", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Remover produto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Produto removido com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Produto não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Produto possui vendas associadas ou ID inválido' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/photo'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo')),
    (0, swagger_1.ApiOperation)({ summary: 'Adicionar foto ao produto' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Foto adicionada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Produto não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Arquivo inválido' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "addPhoto", null);
__decorate([
    (0, common_1.Post)(':id/photos'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('photos', 10)),
    (0, swagger_1.ApiOperation)({ summary: 'Adicionar múltiplas fotos ao produto' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Fotos adicionadas com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Produto não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Arquivos inválidos' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "addPhotos", null);
__decorate([
    (0, common_1.Delete)(':id/photo'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Remover foto do produto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Foto removida com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Produto ou foto não encontrada' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)('photoUrl')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "removePhoto", null);
__decorate([
    (0, common_1.Delete)(':id/photos'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Remover todas as fotos do produto' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Todas as fotos removidas com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Produto não encontrado' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "removeAllPhotos", null);
__decorate([
    (0, common_1.Post)('upload-and-create'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('photos', 3), sanitize_product_data_interceptor_1.SanitizeProductDataInterceptor),
    (0, swagger_1.ApiOperation)({
        summary: 'Criar produto com upload de fotos',
        description: 'Cria um produto e faz upload de até 3 fotos simultaneamente'
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Produto criado com fotos com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos ou limite de fotos excedido' }),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "uploadPhotosAndCreate", null);
__decorate([
    (0, common_1.Patch)(':id/photos'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('photos', 3)),
    (0, swagger_1.ApiOperation)({
        summary: 'Atualizar fotos de um produto',
        description: 'Adiciona ou remove fotos de um produto existente'
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fotos atualizadas' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Limite excedido' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, common_1.Body)('photosToDelete')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "updateProductPhotos", null);
__decorate([
    (0, common_1.Patch)(':id/upload-and-update'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('photos', 3), sanitize_update_data_interceptor_1.SanitizeUpdateDataInterceptor),
    (0, swagger_1.ApiOperation)({
        summary: 'Atualizar produto com upload de fotos',
        description: 'Atualiza um produto e faz upload de fotos simultaneamente, similar ao upload-and-create mas para edição'
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Produto atualizado com fotos com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos ou limite de fotos excedido' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Body)('photosToDelete')),
    __param(4, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "uploadPhotosAndUpdate", null);
exports.ProductController = ProductController = ProductController_1 = __decorate([
    (0, swagger_1.ApiTags)('product'),
    (0, common_1.Controller)('product'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [product_service_1.ProductService,
        upload_service_1.UploadService])
], ProductController);
//# sourceMappingURL=product.controller.js.map
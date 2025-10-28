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
var ProductPhotoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductPhotoService = void 0;
const common_1 = require("@nestjs/common");
const upload_service_1 = require("../../upload/upload.service");
const product_photo_validation_service_1 = require("./product-photo-validation.service");
const upload_constants_1 = require("../../../shared/constants/upload.constants");
let ProductPhotoService = ProductPhotoService_1 = class ProductPhotoService {
    constructor(uploadService, validationService) {
        this.uploadService = uploadService;
        this.validationService = validationService;
        this.logger = new common_1.Logger(ProductPhotoService_1.name);
    }
    async uploadProductPhotos(companyId, files, currentPhotosCount = 0) {
        this.logger.log(`📸 Iniciando upload de ${files.length} foto(s) para produto da empresa ${companyId}`);
        this.validationService.validateImageFiles(files);
        await this.validationService.validatePhotoLimit(companyId, currentPhotosCount, files.length);
        const subfolder = `${upload_constants_1.PRODUCT_PHOTOS_SUBFOLDER}/${companyId}`;
        const photoUrls = await this.uploadService.uploadMultipleFiles(files, subfolder);
        this.logger.log(`✅ Upload concluído: ${photoUrls.length} foto(s)`);
        return photoUrls;
    }
    async deleteProductPhotos(photoUrls) {
        if (!photoUrls || photoUrls.length === 0) {
            return;
        }
        this.logger.log(`🗑️ Removendo ${photoUrls.length} foto(s)`);
        for (const photoUrl of photoUrls) {
            try {
                await this.uploadService.deleteFile(photoUrl);
            }
            catch (error) {
                this.logger.warn(`Erro ao remover foto ${photoUrl}: ${error.message}`);
            }
        }
        this.logger.log(`✅ Remoção concluída`);
    }
    async prepareProductPhotos(companyId, newFiles, existingPhotos = [], photosToDelete = []) {
        const remainingPhotos = existingPhotos.filter((photo) => !photosToDelete.includes(photo));
        const currentCount = remainingPhotos.length;
        const maxPhotos = await this.validationService.getMaxPhotosForCompany(companyId);
        const availableSlots = maxPhotos - currentCount;
        if (newFiles.length > availableSlots) {
            throw new common_1.BadRequestException(`Você pode adicionar apenas ${availableSlots} foto(s). ` +
                `Limite: ${maxPhotos}, Atual: ${currentCount}`);
        }
        let newPhotoUrls = [];
        if (newFiles.length > 0) {
            newPhotoUrls = await this.uploadProductPhotos(companyId, newFiles, currentCount);
        }
        if (photosToDelete.length > 0) {
            await this.deleteProductPhotos(photosToDelete);
        }
        return [...remainingPhotos, ...newPhotoUrls];
    }
};
exports.ProductPhotoService = ProductPhotoService;
exports.ProductPhotoService = ProductPhotoService = ProductPhotoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [upload_service_1.UploadService,
        product_photo_validation_service_1.ProductPhotoValidationService])
], ProductPhotoService);
//# sourceMappingURL=product-photo.service.js.map
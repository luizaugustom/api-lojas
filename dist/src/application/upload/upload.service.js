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
var UploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const firebase_storage_service_1 = require("../../shared/services/firebase-storage.service");
let UploadService = UploadService_1 = class UploadService {
    constructor(configService, firebaseStorage) {
        this.configService = configService;
        this.firebaseStorage = firebaseStorage;
        this.logger = new common_1.Logger(UploadService_1.name);
        this.maxFileSize = this.configService.get('MAX_FILE_SIZE', 10485760);
        this.useFirebase = this.configService.get('USE_FIREBASE_STORAGE', 'true') === 'true';
        if (this.useFirebase) {
            this.logger.log('📦 Using Firebase Storage for file uploads');
        }
        else {
            this.logger.warn('⚠️ Firebase Storage disabled, using local storage');
        }
    }
    async uploadFile(file, subfolder) {
        try {
            this.validateFile(file);
            const optimizationPreset = this.getOptimizationPreset(subfolder);
            const result = await this.firebaseStorage.uploadFile(file, subfolder, optimizationPreset);
            this.logger.log(`✅ File uploaded: ${result.url} (${(result.size / 1024).toFixed(1)}KB, ${((1 - result.compressionRatio) * 100).toFixed(1)}% compression)`);
            return result.url;
        }
        catch (error) {
            this.logger.error('❌ Error uploading file:', error);
            throw new common_1.BadRequestException('Erro ao fazer upload do arquivo');
        }
    }
    async uploadMultipleFiles(files, subfolder) {
        const optimizationPreset = this.getOptimizationPreset(subfolder);
        const results = await this.firebaseStorage.uploadMultipleFiles(files, subfolder, optimizationPreset);
        return results.map(result => result.url);
    }
    async deleteFile(fileUrl) {
        try {
            return await this.firebaseStorage.deleteFile(fileUrl);
        }
        catch (error) {
            this.logger.error('❌ Error deleting file:', error);
            return false;
        }
    }
    async deleteMultipleFiles(fileUrls) {
        return await this.firebaseStorage.deleteMultipleFiles(fileUrls);
    }
    validateFile(file) {
        if (!file) {
            throw new common_1.BadRequestException('Nenhum arquivo foi enviado');
        }
        if (file.size > this.maxFileSize) {
            throw new common_1.BadRequestException(`Arquivo muito grande. Tamanho máximo permitido: ${this.maxFileSize / 1024 / 1024}MB`);
        }
        const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'application/x-pkcs12',
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Tipo de arquivo não permitido. Apenas imagens (JPEG, PNG, GIF, WebP), PDFs e certificados digitais são aceitos.');
        }
    }
    async getFileInfo(fileUrl) {
        return await this.firebaseStorage.getFileInfo(fileUrl);
    }
    async fileExists(fileUrl) {
        return await this.firebaseStorage.fileExists(fileUrl);
    }
    getMaxFileSize() {
        return this.maxFileSize;
    }
    getOptimizationPreset(subfolder) {
        if (!subfolder) {
            return this.firebaseStorage.getOptimizationPreset('document');
        }
        if (subfolder.includes('products')) {
            return this.firebaseStorage.getOptimizationPreset('product');
        }
        if (subfolder.includes('logos')) {
            return this.firebaseStorage.getOptimizationPreset('logo');
        }
        if (subfolder.includes('thumbnails')) {
            return this.firebaseStorage.getOptimizationPreset('thumbnail');
        }
        return this.firebaseStorage.getOptimizationPreset('document');
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = UploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        firebase_storage_service_1.FirebaseStorageService])
], UploadService);
//# sourceMappingURL=upload.service.js.map
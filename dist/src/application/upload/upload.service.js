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
const fs = require("fs");
const path = require("path");
const uuid_1 = require("uuid");
let UploadService = UploadService_1 = class UploadService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(UploadService_1.name);
        this.uploadPath = this.configService.get('UPLOAD_PATH', './uploads');
        this.maxFileSize = this.configService.get('MAX_FILE_SIZE', 10485760);
        this.ensureUploadDirectory();
    }
    ensureUploadDirectory() {
        if (!fs.existsSync(this.uploadPath)) {
            fs.mkdirSync(this.uploadPath, { recursive: true });
            this.logger.log(`Created upload directory: ${this.uploadPath}`);
        }
    }
    async uploadFile(file, subfolder) {
        try {
            this.validateFile(file);
            const fileExtension = path.extname(file.originalname);
            const fileName = `${(0, uuid_1.v4)()}${fileExtension}`;
            const uploadDir = subfolder ? path.join(this.uploadPath, subfolder) : this.uploadPath;
            if (subfolder && !fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, file.buffer);
            const relativePath = subfolder ? `${subfolder}/${fileName}` : fileName;
            const fileUrl = `/uploads/${relativePath}`;
            this.logger.log(`File uploaded successfully: ${fileUrl}`);
            return fileUrl;
        }
        catch (error) {
            this.logger.error('Error uploading file:', error);
            throw new common_1.BadRequestException('Erro ao fazer upload do arquivo');
        }
    }
    async uploadMultipleFiles(files, subfolder) {
        const uploadPromises = files.map(file => this.uploadFile(file, subfolder));
        return Promise.all(uploadPromises);
    }
    async deleteFile(fileUrl) {
        try {
            let fileName;
            if (fileUrl.startsWith('/uploads/')) {
                fileName = fileUrl.substring('/uploads/'.length);
            }
            else if (fileUrl.startsWith('uploads/')) {
                fileName = fileUrl.substring('uploads/'.length);
            }
            else if (fileUrl.startsWith('./uploads/')) {
                fileName = fileUrl.substring('./uploads/'.length);
            }
            else {
                fileName = fileUrl;
            }
            const filePath = path.join(this.uploadPath, fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                this.logger.log(`File deleted successfully: ${fileUrl} -> ${filePath}`);
                return true;
            }
            this.logger.warn(`File not found: ${fileUrl} -> ${filePath}`);
            return false;
        }
        catch (error) {
            this.logger.error('Error deleting file:', error);
            return false;
        }
    }
    async deleteMultipleFiles(fileUrls) {
        const results = await Promise.allSettled(fileUrls.map(url => this.deleteFile(url)));
        const deleted = results.filter(result => result.status === 'fulfilled' && result.value === true).length;
        const failed = results.length - deleted;
        return { deleted, failed };
    }
    validateFile(file) {
        if (file.size > this.maxFileSize) {
            throw new common_1.BadRequestException(`Arquivo muito grande. Tamanho máximo permitido: ${this.maxFileSize / 1024 / 1024}MB`);
        }
        const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Tipo de arquivo não permitido. Apenas imagens (JPEG, PNG, GIF, WebP) são aceitas.');
        }
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
            throw new common_1.BadRequestException('Extensão de arquivo não permitida. Apenas .jpg, .jpeg, .png, .gif, .webp são aceitas.');
        }
    }
    async getFileInfo(fileUrl) {
        try {
            const fileName = fileUrl.replace('/uploads/', '');
            const filePath = path.join(this.uploadPath, fileName);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                return {
                    exists: true,
                    size: stats.size,
                    path: filePath,
                };
            }
            return { exists: false };
        }
        catch (error) {
            this.logger.error('Error getting file info:', error);
            return { exists: false };
        }
    }
    async resizeImage(file, maxWidth = 800, maxHeight = 600) {
        this.logger.log(`Image resizing requested: ${file.originalname} to ${maxWidth}x${maxHeight}`);
        return file.buffer;
    }
    async optimizeImage(file) {
        this.logger.log(`Image optimization requested: ${file.originalname}`);
        return file.buffer;
    }
    getUploadPath() {
        return this.uploadPath;
    }
    getMaxFileSize() {
        return this.maxFileSize;
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = UploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map
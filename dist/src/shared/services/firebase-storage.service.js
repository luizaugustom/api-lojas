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
var FirebaseStorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseStorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const admin = require("firebase-admin");
const sharp = require("sharp");
const uuid_1 = require("uuid");
const path = require("path");
let FirebaseStorageService = FirebaseStorageService_1 = class FirebaseStorageService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(FirebaseStorageService_1.name);
        this.defaultImageOptions = {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 85,
            format: 'webp',
        };
        this.maxFileSize = this.configService.get('MAX_FILE_SIZE', 10485760);
        this.initializeFirebase();
    }
    initializeFirebase() {
        try {
            if (admin.apps.length === 0) {
                const projectId = this.configService.get('FIREBASE_PROJECT_ID');
                const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');
                const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
                const storageBucket = this.configService.get('FIREBASE_STORAGE_BUCKET');
                if (!projectId || !clientEmail || !privateKey || !storageBucket) {
                    throw new Error('Firebase credentials not configured. Please set FIREBASE_* environment variables.');
                }
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey,
                    }),
                    storageBucket,
                });
                this.logger.log('✅ Firebase Admin SDK initialized successfully');
            }
            this.bucket = admin.storage();
            this.logger.log(`📦 Firebase Storage bucket configured: ${this.configService.get('FIREBASE_STORAGE_BUCKET')}`);
        }
        catch (error) {
            this.logger.error('❌ Error initializing Firebase:', error);
            throw error;
        }
    }
    async uploadFile(file, subfolder, options) {
        try {
            this.validateFile(file);
            const isImage = this.isImageFile(file);
            let buffer = file.buffer;
            let optimizedSize = file.size;
            const originalSize = file.size;
            if (isImage) {
                const optimizationOptions = { ...this.defaultImageOptions, ...options };
                buffer = await this.optimizeImage(file.buffer, optimizationOptions);
                optimizedSize = buffer.length;
                const compressionPercent = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
                this.logger.log(`🖼️ Image optimized: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${compressionPercent}% reduction)`);
            }
            const fileExtension = isImage && options?.format ? `.${options.format}` : path.extname(file.originalname);
            const fileName = `${(0, uuid_1.v4)()}${fileExtension}`;
            const filePath = subfolder ? `${subfolder}/${fileName}` : fileName;
            const fileUpload = this.bucket.bucket().file(filePath);
            await fileUpload.save(buffer, {
                metadata: {
                    contentType: isImage && options?.format ? `image/${options.format}` : file.mimetype,
                    metadata: {
                        originalName: file.originalname,
                        uploadedAt: new Date().toISOString(),
                        optimized: isImage.toString(),
                    },
                },
                public: true,
            });
            const publicUrl = `https://storage.googleapis.com/${this.bucket.bucket().name}/${filePath}`;
            this.logger.log(`✅ File uploaded successfully: ${publicUrl}`);
            return {
                url: publicUrl,
                fileName: filePath,
                size: optimizedSize,
                originalSize,
                compressionRatio: originalSize > 0 ? optimizedSize / originalSize : 1,
            };
        }
        catch (error) {
            this.logger.error('❌ Error uploading file to Firebase:', error);
            throw new common_1.BadRequestException('Erro ao fazer upload do arquivo');
        }
    }
    async uploadMultipleFiles(files, subfolder, options) {
        const uploadPromises = files.map(file => this.uploadFile(file, subfolder, options));
        return Promise.all(uploadPromises);
    }
    async deleteFile(fileUrl) {
        try {
            const fileName = this.extractFilePathFromUrl(fileUrl);
            if (!fileName) {
                this.logger.warn(`Invalid file URL: ${fileUrl}`);
                return false;
            }
            const file = this.bucket.bucket().file(fileName);
            await file.delete();
            this.logger.log(`✅ File deleted successfully: ${fileUrl}`);
            return true;
        }
        catch (error) {
            if (error.code === 404) {
                this.logger.warn(`File not found: ${fileUrl}`);
                return false;
            }
            this.logger.error('❌ Error deleting file from Firebase:', error);
            return false;
        }
    }
    async deleteMultipleFiles(fileUrls) {
        const results = await Promise.allSettled(fileUrls.map(url => this.deleteFile(url)));
        const deleted = results.filter(result => result.status === 'fulfilled' && result.value === true).length;
        const failed = results.length - deleted;
        this.logger.log(`🗑️ Deleted ${deleted}/${fileUrls.length} files (${failed} failed)`);
        return { deleted, failed };
    }
    async optimizeImage(buffer, options) {
        const { maxWidth, maxHeight, quality, format } = options;
        let image = sharp(buffer);
        const metadata = await image.metadata();
        if (metadata.width > maxWidth || metadata.height > maxHeight) {
            image = image.resize(maxWidth, maxHeight, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        }
        switch (format) {
            case 'jpeg':
                image = image.jpeg({ quality, progressive: true });
                break;
            case 'png':
                image = image.png({ quality, compressionLevel: 9 });
                break;
            case 'webp':
            default:
                image = image.webp({ quality });
                break;
        }
        return image.toBuffer();
    }
    validateFile(file) {
        if (!file) {
            throw new common_1.BadRequestException('Nenhum arquivo foi enviado');
        }
        if (file.size > this.maxFileSize) {
            throw new common_1.BadRequestException(`Arquivo muito grande. Tamanho máximo permitido: ${this.maxFileSize / 1024 / 1024}MB`);
        }
    }
    isImageFile(file) {
        const imageMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
        ];
        return imageMimeTypes.includes(file.mimetype);
    }
    extractFilePathFromUrl(url) {
        try {
            const match = url.match(/https:\/\/storage\.googleapis\.com\/[^\/]+\/(.+)/);
            if (match && match[1]) {
                return decodeURIComponent(match[1]);
            }
            const firebaseMatch = url.match(/\/o\/(.+?)\?/);
            if (firebaseMatch && firebaseMatch[1]) {
                return decodeURIComponent(firebaseMatch[1]);
            }
            return null;
        }
        catch (error) {
            this.logger.error('Error extracting file path from URL:', error);
            return null;
        }
    }
    async fileExists(fileUrl) {
        try {
            const fileName = this.extractFilePathFromUrl(fileUrl);
            if (!fileName)
                return false;
            const file = this.bucket.bucket().file(fileName);
            const [exists] = await file.exists();
            return exists;
        }
        catch (error) {
            this.logger.error('Error checking file existence:', error);
            return false;
        }
    }
    async getFileInfo(fileUrl) {
        try {
            const fileName = this.extractFilePathFromUrl(fileUrl);
            if (!fileName) {
                return { exists: false };
            }
            const file = this.bucket.bucket().file(fileName);
            const [metadata] = await file.getMetadata();
            return {
                exists: true,
                size: typeof metadata.size === 'string' ? parseInt(metadata.size) : metadata.size,
                contentType: metadata.contentType,
            };
        }
        catch (error) {
            if (error.code === 404) {
                return { exists: false };
            }
            this.logger.error('Error getting file info:', error);
            return { exists: false };
        }
    }
    getOptimizationPreset(preset) {
        const presets = {
            thumbnail: {
                maxWidth: 300,
                maxHeight: 300,
                quality: 80,
                format: 'webp',
            },
            product: {
                maxWidth: 1200,
                maxHeight: 1200,
                quality: 85,
                format: 'webp',
            },
            logo: {
                maxWidth: 500,
                maxHeight: 500,
                quality: 90,
                format: 'png',
            },
            document: {
                maxWidth: 1920,
                maxHeight: 1920,
                quality: 90,
                format: 'jpeg',
            },
        };
        return presets[preset] || this.defaultImageOptions;
    }
};
exports.FirebaseStorageService = FirebaseStorageService;
exports.FirebaseStorageService = FirebaseStorageService = FirebaseStorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FirebaseStorageService);
//# sourceMappingURL=firebase-storage.service.js.map
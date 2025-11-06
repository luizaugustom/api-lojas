import { ConfigService } from '@nestjs/config';
export interface ImageOptimizationOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
}
export interface UploadResult {
    url: string;
    fileName: string;
    size: number;
    originalSize: number;
    compressionRatio: number;
}
export declare class FirebaseStorageService {
    private readonly configService;
    private readonly logger;
    private storage;
    private bucketName;
    private readonly maxFileSize;
    private readonly defaultImageOptions;
    private getCleanBucketName;
    constructor(configService: ConfigService);
    private initializeFirebase;
    private getBucket;
    uploadFile(file: Express.Multer.File, subfolder?: string, options?: ImageOptimizationOptions): Promise<UploadResult>;
    uploadMultipleFiles(files: Express.Multer.File[], subfolder?: string, options?: ImageOptimizationOptions): Promise<UploadResult[]>;
    deleteFile(fileUrl: string): Promise<boolean>;
    deleteMultipleFiles(fileUrls: string[]): Promise<{
        deleted: number;
        failed: number;
    }>;
    private optimizeImage;
    private validateFile;
    private isImageFile;
    private extractFilePathFromUrl;
    fileExists(fileUrl: string): Promise<boolean>;
    getFileInfo(fileUrl: string): Promise<{
        exists: boolean;
        size?: number;
        contentType?: string;
    }>;
    getOptimizationPreset(preset: 'thumbnail' | 'product' | 'logo' | 'document'): ImageOptimizationOptions;
}

import { ConfigService } from '@nestjs/config';
export declare class UploadService {
    private readonly configService;
    private readonly logger;
    private readonly uploadPath;
    private readonly maxFileSize;
    constructor(configService: ConfigService);
    private ensureUploadDirectory;
    uploadFile(file: Express.Multer.File, subfolder?: string): Promise<string>;
    uploadMultipleFiles(files: Express.Multer.File[], subfolder?: string): Promise<string[]>;
    deleteFile(fileUrl: string): Promise<boolean>;
    deleteMultipleFiles(fileUrls: string[]): Promise<{
        deleted: number;
        failed: number;
    }>;
    private validateFile;
    getFileInfo(fileUrl: string): Promise<{
        exists: boolean;
        size?: number;
        path?: string;
    }>;
    resizeImage(file: Express.Multer.File, maxWidth?: number, maxHeight?: number): Promise<Buffer>;
    optimizeImage(file: Express.Multer.File): Promise<Buffer>;
    getUploadPath(): string;
    getMaxFileSize(): number;
}

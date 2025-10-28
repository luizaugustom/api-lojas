import { ConfigService } from '@nestjs/config';
import { FirebaseStorageService } from '../../shared/services/firebase-storage.service';
export declare class UploadService {
    private readonly configService;
    private readonly firebaseStorage;
    private readonly logger;
    private readonly maxFileSize;
    private readonly useFirebase;
    constructor(configService: ConfigService, firebaseStorage: FirebaseStorageService);
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
        contentType?: string;
    }>;
    fileExists(fileUrl: string): Promise<boolean>;
    getMaxFileSize(): number;
    private getOptimizationPreset;
}

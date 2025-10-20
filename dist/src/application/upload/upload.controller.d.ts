import { UploadService } from './upload.service';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    uploadSingle(file: Express.Multer.File, subfolder?: string): Promise<{
        success: boolean;
        fileUrl: string;
        originalName: string;
        size: number;
        mimetype: string;
    }>;
    uploadMultiple(files: Express.Multer.File[], subfolder?: string): Promise<{
        success: boolean;
        uploaded: number;
        files: {
            success: boolean;
            fileUrl: string;
            originalName: string;
            size: number;
            mimetype: string;
        }[];
    }>;
    deleteFile(fileUrl: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteMultipleFiles(fileUrls: string[]): Promise<{
        message: string;
        deleted: number;
        failed: number;
        success: boolean;
    }>;
    getFileInfo(fileUrl: string): Promise<{
        exists: boolean;
        size?: number;
        path?: string;
        fileUrl: string;
    }>;
    resizeImage(file: Express.Multer.File, maxWidth?: string, maxHeight?: string): Promise<{
        success: boolean;
        message: string;
        originalSize: number;
        resizedSize: number;
    }>;
    optimizeImage(file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        originalSize: number;
        optimizedSize: number;
        savings: number;
    }>;
}

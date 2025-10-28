import { UploadService } from '../../upload/upload.service';
import { ProductPhotoValidationService } from './product-photo-validation.service';
export declare class ProductPhotoService {
    private readonly uploadService;
    private readonly validationService;
    private readonly logger;
    constructor(uploadService: UploadService, validationService: ProductPhotoValidationService);
    uploadProductPhotos(companyId: string, files: Express.Multer.File[], currentPhotosCount?: number): Promise<string[]>;
    deleteProductPhotos(photoUrls: string[]): Promise<void>;
    prepareProductPhotos(companyId: string, newFiles: Express.Multer.File[], existingPhotos?: string[], photosToDelete?: string[]): Promise<string[]>;
}

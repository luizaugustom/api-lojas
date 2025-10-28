import { PrismaService } from '../../../infrastructure/database/prisma.service';
export declare class ProductPhotoValidationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validatePhotoLimit(companyId: string, currentPhotosCount: number, newPhotosCount: number): Promise<void>;
    validateImageFile(file: Express.Multer.File): void;
    validateImageFiles(files: Express.Multer.File[]): void;
    getMaxPhotosForCompany(companyId: string): Promise<number>;
}

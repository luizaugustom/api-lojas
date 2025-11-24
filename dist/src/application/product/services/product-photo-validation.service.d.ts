import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { PlanLimitsService } from '../../../shared/services/plan-limits.service';
export declare class ProductPhotoValidationService {
    private readonly prisma;
    private readonly planLimitsService;
    constructor(prisma: PrismaService, planLimitsService: PlanLimitsService);
    validatePhotoLimit(companyId: string, currentPhotosCount: number, newPhotosCount: number): Promise<void>;
    validateImageFile(file: Express.Multer.File): void;
    validateImageFiles(files: Express.Multer.File[]): void;
    getMaxPhotosForCompany(companyId: string): Promise<number | null>;
}

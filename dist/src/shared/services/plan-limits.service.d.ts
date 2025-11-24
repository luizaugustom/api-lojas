import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PlanType } from '@prisma/client';
export interface PlanLimits {
    maxProducts: number | null;
    maxSellers: number | null;
    maxBillsToPay: number | null;
    maxCustomers: number | null;
    photoUploadEnabled: boolean;
    maxPhotosPerProduct: number | null;
    nfceEmissionEnabled: boolean;
    nfeEmissionEnabled: boolean;
}
export declare class PlanLimitsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPlanLimits(plan: PlanType): PlanLimits;
    getCompanyLimits(companyId: string): Promise<PlanLimits>;
    validateProductLimit(companyId: string): Promise<void>;
    validateSellerLimit(companyId: string): Promise<void>;
    validateBillToPayLimit(companyId: string): Promise<void>;
    getCompanyUsageStats(companyId: string): Promise<{
        plan: import(".prisma/client").$Enums.PlanType;
        limits: PlanLimits;
        usage: {
            products: {
                current: number;
                max: number;
                percentage: number;
                available: number;
            };
            sellers: {
                current: number;
                max: number;
                percentage: number;
                available: number;
            };
            billsToPay: {
                current: number;
                max: number;
                percentage: number;
                available: number;
            };
            customers: {
                current: number;
                max: number;
                percentage: number;
                available: number;
            };
        };
    }>;
    validateCustomerLimit(companyId: string): Promise<void>;
    validatePhotoUploadEnabled(companyId: string): Promise<void>;
    validatePhotoLimitPerProduct(companyId: string, currentPhotosCount: number, newPhotosCount: number): Promise<void>;
    validateNfceEmissionEnabled(companyId: string): Promise<void>;
    validateNfeEmissionEnabled(companyId: string): Promise<void>;
    checkNearLimits(companyId: string): Promise<{
        nearLimit: boolean;
        warnings: string[];
    }>;
}

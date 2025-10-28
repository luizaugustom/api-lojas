import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PlanType } from '@prisma/client';
export interface PlanLimits {
    maxProducts: number | null;
    maxSellers: number | null;
    maxBillsToPay: number | null;
}
export declare class PlanLimitsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPlanLimits(plan: PlanType): PlanLimits;
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
        };
    }>;
    checkNearLimits(companyId: string): Promise<{
        nearLimit: boolean;
        warnings: string[];
    }>;
}

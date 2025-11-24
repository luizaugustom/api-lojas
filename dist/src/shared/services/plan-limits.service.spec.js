"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const plan_limits_service_1 = require("./plan-limits.service");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
describe('PlanLimitsService', () => {
    let service;
    let prisma;
    const mockPrismaService = {
        company: {
            findUnique: jest.fn(),
        },
        product: {
            count: jest.fn(),
        },
        seller: {
            count: jest.fn(),
        },
        billToPay: {
            count: jest.fn(),
        },
        customer: {
            count: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                plan_limits_service_1.PlanLimitsService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();
        service = module.get(plan_limits_service_1.PlanLimitsService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('getPlanLimits', () => {
        it('should return PRO plan limits (unlimited)', () => {
            const limits = service.getPlanLimits(client_1.PlanType.PRO);
            expect(limits).toEqual({
                maxProducts: null,
                maxSellers: null,
                maxBillsToPay: null,
                maxCustomers: null,
                photoUploadEnabled: true,
                maxPhotosPerProduct: null,
                nfceEmissionEnabled: true,
                nfeEmissionEnabled: true,
            });
        });
        it('should return TRIAL_7_DAYS plan limits (unlimited)', () => {
            const limits = service.getPlanLimits(client_1.PlanType.TRIAL_7_DAYS);
            expect(limits).toEqual({
                maxProducts: null,
                maxSellers: null,
                maxBillsToPay: null,
                maxCustomers: null,
                photoUploadEnabled: true,
                maxPhotosPerProduct: null,
                nfceEmissionEnabled: true,
                nfeEmissionEnabled: true,
            });
        });
    });
    describe('validateProductLimit', () => {
        it('should allow product creation for PRO plan (unlimited)', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue({
                plan: client_1.PlanType.PRO,
                maxProducts: null,
            });
            mockPrismaService.product.count.mockResolvedValue(10000);
            await expect(service.validateProductLimit('company-id')).resolves.not.toThrow();
        });
        it('should throw error when custom product limit is reached', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue({
                plan: client_1.PlanType.PRO,
                maxProducts: 100,
            });
            mockPrismaService.product.count.mockResolvedValue(100);
            await expect(service.validateProductLimit('company-id')).rejects.toThrow(common_1.BadRequestException);
        });
        it('should allow unlimited products for PRO plan', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue({ plan: client_1.PlanType.PRO });
            mockPrismaService.product.count.mockResolvedValue(10000);
            await expect(service.validateProductLimit('company-id')).resolves.not.toThrow();
        });
        it('should throw error when company not found', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue(null);
            await expect(service.validateProductLimit('company-id')).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('validateSellerLimit', () => {
        it('should allow seller creation for PRO plan (unlimited)', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue({
                plan: client_1.PlanType.PRO,
                maxSellers: null,
            });
            mockPrismaService.seller.count.mockResolvedValue(100);
            await expect(service.validateSellerLimit('company-id')).resolves.not.toThrow();
        });
        it('should throw error when custom seller limit is reached', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue({
                plan: client_1.PlanType.PRO,
                maxSellers: 5,
            });
            mockPrismaService.seller.count.mockResolvedValue(5);
            await expect(service.validateSellerLimit('company-id')).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('validateBillToPayLimit', () => {
        it('should allow bill creation for PRO plan (unlimited)', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue({ plan: client_1.PlanType.PRO });
            mockPrismaService.billToPay.count.mockResolvedValue(1000);
            await expect(service.validateBillToPayLimit('company-id')).resolves.not.toThrow();
        });
        it('should allow unlimited bills for PRO plan', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue({ plan: client_1.PlanType.PRO });
            mockPrismaService.billToPay.count.mockResolvedValue(1000);
            await expect(service.validateBillToPayLimit('company-id')).resolves.not.toThrow();
        });
    });
    describe('getCompanyUsageStats', () => {
        it('should return usage statistics for PRO plan with custom limits', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue({
                plan: client_1.PlanType.PRO,
                maxProducts: 1000,
                maxSellers: 10,
                maxCustomers: null,
                photoUploadEnabled: true,
                maxPhotosPerProduct: null,
                nfceEmissionEnabled: true,
                nfeEmissionEnabled: true,
            });
            mockPrismaService.product.count.mockResolvedValue(800);
            mockPrismaService.seller.count.mockResolvedValue(5);
            mockPrismaService.billToPay.count.mockResolvedValue(3);
            mockPrismaService.customer.count.mockResolvedValue(500);
            const stats = await service.getCompanyUsageStats('company-id');
            expect(stats.plan).toBe(client_1.PlanType.PRO);
            expect(stats.limits.maxProducts).toBe(1000);
            expect(stats.limits.maxSellers).toBe(10);
            expect(stats.usage.products.percentage).toBe(80);
        });
        it('should return usage statistics for PRO plan (unlimited)', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue({ plan: client_1.PlanType.PRO });
            mockPrismaService.product.count.mockResolvedValue(5000);
            mockPrismaService.seller.count.mockResolvedValue(10);
            mockPrismaService.billToPay.count.mockResolvedValue(100);
            const stats = await service.getCompanyUsageStats('company-id');
            expect(stats.usage.products.max).toBeNull();
            expect(stats.usage.sellers.max).toBeNull();
            expect(stats.usage.billsToPay.max).toBeNull();
            expect(stats.usage.products.percentage).toBe(0);
        });
    });
    describe('checkNearLimits', () => {
        it('should return warnings when near custom limits (>= 80%)', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue({
                plan: client_1.PlanType.PRO,
                maxProducts: 1000,
                maxSellers: 10,
                maxCustomers: null,
                photoUploadEnabled: true,
                maxPhotosPerProduct: null,
                nfceEmissionEnabled: true,
                nfeEmissionEnabled: true,
            });
            mockPrismaService.product.count.mockResolvedValue(850);
            mockPrismaService.seller.count.mockResolvedValue(9);
            mockPrismaService.billToPay.count.mockResolvedValue(0);
            mockPrismaService.customer.count.mockResolvedValue(0);
            const result = await service.checkNearLimits('company-id');
            expect(result.nearLimit).toBe(true);
            expect(result.warnings.length).toBeGreaterThan(0);
        });
        it('should return no warnings when below 80% limit', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue({
                plan: client_1.PlanType.PRO,
                maxProducts: 1000,
                maxSellers: 10,
                maxCustomers: null,
                photoUploadEnabled: true,
                maxPhotosPerProduct: null,
                nfceEmissionEnabled: true,
                nfeEmissionEnabled: true,
            });
            mockPrismaService.product.count.mockResolvedValue(500);
            mockPrismaService.seller.count.mockResolvedValue(5);
            mockPrismaService.billToPay.count.mockResolvedValue(0);
            mockPrismaService.customer.count.mockResolvedValue(0);
            const result = await service.checkNearLimits('company-id');
            expect(result.nearLimit).toBe(false);
            expect(result.warnings).toHaveLength(0);
        });
        it('should return no warnings for PRO plan', async () => {
            mockPrismaService.company.findUnique.mockResolvedValue({ plan: client_1.PlanType.PRO });
            mockPrismaService.product.count.mockResolvedValue(10000);
            mockPrismaService.seller.count.mockResolvedValue(100);
            mockPrismaService.billToPay.count.mockResolvedValue(1000);
            const result = await service.checkNearLimits('company-id');
            expect(result.nearLimit).toBe(false);
            expect(result.warnings).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=plan-limits.service.spec.js.map
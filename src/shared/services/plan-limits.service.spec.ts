import { Test, TestingModule } from '@nestjs/testing';
import { PlanLimitsService } from './plan-limits.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { PlanType } from '@prisma/client';

describe('PlanLimitsService', () => {
  let service: PlanLimitsService;
  let prisma: PrismaService;

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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanLimitsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PlanLimitsService>(PlanLimitsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlanLimits', () => {
    it('should return BASIC plan limits', () => {
      const limits = service.getPlanLimits(PlanType.BASIC);
      expect(limits).toEqual({
        maxProducts: 250,
        maxSellers: 1,
        maxBillsToPay: 5,
      });
    });

    it('should return PLUS plan limits', () => {
      const limits = service.getPlanLimits(PlanType.PLUS);
      expect(limits).toEqual({
        maxProducts: 800,
        maxSellers: 2,
        maxBillsToPay: 15,
      });
    });

    it('should return PRO plan limits (unlimited)', () => {
      const limits = service.getPlanLimits(PlanType.PRO);
      expect(limits).toEqual({
        maxProducts: null,
        maxSellers: null,
        maxBillsToPay: null,
      });
    });
  });

  describe('validateProductLimit', () => {
    it('should allow product creation for BASIC plan under limit', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ plan: PlanType.BASIC });
      mockPrismaService.product.count.mockResolvedValue(200);

      await expect(service.validateProductLimit('company-id')).resolves.not.toThrow();
    });

    it('should throw error when BASIC plan product limit is reached', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ plan: PlanType.BASIC });
      mockPrismaService.product.count.mockResolvedValue(250);

      await expect(service.validateProductLimit('company-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow unlimited products for PRO plan', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ plan: PlanType.PRO });
      mockPrismaService.product.count.mockResolvedValue(10000);

      await expect(service.validateProductLimit('company-id')).resolves.not.toThrow();
    });

    it('should throw error when company not found', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue(null);

      await expect(service.validateProductLimit('company-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateSellerLimit', () => {
    it('should allow seller creation for BASIC plan under limit', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ plan: PlanType.BASIC });
      mockPrismaService.seller.count.mockResolvedValue(0);

      await expect(service.validateSellerLimit('company-id')).resolves.not.toThrow();
    });

    it('should throw error when BASIC plan seller limit is reached', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ plan: PlanType.BASIC });
      mockPrismaService.seller.count.mockResolvedValue(1);

      await expect(service.validateSellerLimit('company-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow 2 sellers for PLUS plan', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ plan: PlanType.PLUS });
      mockPrismaService.seller.count.mockResolvedValue(1);

      await expect(service.validateSellerLimit('company-id')).resolves.not.toThrow();
    });

    it('should throw error when PLUS plan seller limit is reached', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ plan: PlanType.PLUS });
      mockPrismaService.seller.count.mockResolvedValue(2);

      await expect(service.validateSellerLimit('company-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateBillToPayLimit', () => {
    it('should allow bill creation for BASIC plan under limit', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ plan: PlanType.BASIC });
      mockPrismaService.billToPay.count.mockResolvedValue(4);

      await expect(service.validateBillToPayLimit('company-id')).resolves.not.toThrow();
    });

    it('should throw error when BASIC plan bill limit is reached', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ plan: PlanType.BASIC });
      mockPrismaService.billToPay.count.mockResolvedValue(5);

      await expect(service.validateBillToPayLimit('company-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow unlimited bills for PRO plan', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ plan: PlanType.PRO });
      mockPrismaService.billToPay.count.mockResolvedValue(1000);

      await expect(service.validateBillToPayLimit('company-id')).resolves.not.toThrow();
    });
  });

  describe('getCompanyUsageStats', () => {
    it('should return usage statistics for BASIC plan', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ plan: PlanType.BASIC });
      mockPrismaService.product.count.mockResolvedValue(200);
      mockPrismaService.seller.count.mockResolvedValue(1);
      mockPrismaService.billToPay.count.mockResolvedValue(3);

      const stats = await service.getCompanyUsageStats('company-id');

      expect(stats).toEqual({
        plan: PlanType.BASIC,
        limits: {
          maxProducts: 250,
          maxSellers: 1,
          maxBillsToPay: 5,
        },
        usage: {
          products: {
            current: 200,
            max: 250,
            percentage: 80,
            available: 50,
          },
          sellers: {
            current: 1,
            max: 1,
            percentage: 100,
            available: 0,
          },
          billsToPay: {
            current: 3,
            max: 5,
            percentage: 60,
            available: 2,
          },
        },
      });
    });

    it('should return usage statistics for PRO plan (unlimited)', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ plan: PlanType.PRO });
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
    it('should return warnings when near limits (>= 80%)', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ plan: PlanType.BASIC });
      mockPrismaService.product.count.mockResolvedValue(200);
      mockPrismaService.seller.count.mockResolvedValue(1);
      mockPrismaService.billToPay.count.mockResolvedValue(4);

      const result = await service.checkNearLimits('company-id');

      expect(result.nearLimit).toBe(true);
      expect(result.warnings).toHaveLength(3);
    });

    it('should return no warnings when below 80% limit', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ plan: PlanType.BASIC });
      mockPrismaService.product.count.mockResolvedValue(100);
      mockPrismaService.seller.count.mockResolvedValue(0);
      mockPrismaService.billToPay.count.mockResolvedValue(2);

      const result = await service.checkNearLimits('company-id');

      expect(result.nearLimit).toBe(false);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return no warnings for PRO plan', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ plan: PlanType.PRO });
      mockPrismaService.product.count.mockResolvedValue(10000);
      mockPrismaService.seller.count.mockResolvedValue(100);
      mockPrismaService.billToPay.count.mockResolvedValue(1000);

      const result = await service.checkNearLimits('company-id');

      expect(result.nearLimit).toBe(false);
      expect(result.warnings).toHaveLength(0);
    });
  });
});


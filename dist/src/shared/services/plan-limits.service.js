"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanLimitsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const client_1 = require("@prisma/client");
let PlanLimitsService = class PlanLimitsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getPlanLimits(plan) {
        switch (plan) {
            case client_1.PlanType.BASIC:
                return {
                    maxProducts: 250,
                    maxSellers: 1,
                    maxBillsToPay: 5,
                };
            case client_1.PlanType.PLUS:
                return {
                    maxProducts: 800,
                    maxSellers: 2,
                    maxBillsToPay: 15,
                };
            case client_1.PlanType.PRO:
                return {
                    maxProducts: null,
                    maxSellers: null,
                    maxBillsToPay: null,
                };
            case client_1.PlanType.TRIAL_7_DAYS:
                return {
                    maxProducts: 800,
                    maxSellers: 2,
                    maxBillsToPay: 15,
                };
            default:
                return {
                    maxProducts: 250,
                    maxSellers: 1,
                    maxBillsToPay: 5,
                };
        }
    }
    async validateProductLimit(companyId) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: { plan: true },
        });
        if (!company) {
            throw new common_1.BadRequestException('Empresa não encontrada');
        }
        const limits = this.getPlanLimits(company.plan);
        if (limits.maxProducts === null) {
            return;
        }
        const currentCount = await this.prisma.product.count({
            where: { companyId },
        });
        if (currentCount >= limits.maxProducts) {
            throw new common_1.BadRequestException(`Limite de produtos atingido. Seu plano ${company.plan} permite no máximo ${limits.maxProducts} produtos. Faça upgrade para adicionar mais produtos.`);
        }
    }
    async validateSellerLimit(companyId) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: { plan: true },
        });
        if (!company) {
            throw new common_1.BadRequestException('Empresa não encontrada');
        }
        const limits = this.getPlanLimits(company.plan);
        if (limits.maxSellers === null) {
            return;
        }
        const currentCount = await this.prisma.seller.count({
            where: { companyId },
        });
        if (currentCount >= limits.maxSellers) {
            throw new common_1.BadRequestException(`Limite de vendedores atingido. Seu plano ${company.plan} permite no máximo ${limits.maxSellers} vendedor(es). Faça upgrade para adicionar mais vendedores.`);
        }
    }
    async validateBillToPayLimit(companyId) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: { plan: true },
        });
        if (!company) {
            throw new common_1.BadRequestException('Empresa não encontrada');
        }
        const limits = this.getPlanLimits(company.plan);
        if (limits.maxBillsToPay === null) {
            return;
        }
        const currentCount = await this.prisma.billToPay.count({
            where: {
                companyId,
                isPaid: false,
            },
        });
        if (currentCount >= limits.maxBillsToPay) {
            throw new common_1.BadRequestException(`Limite de contas a pagar atingido. Seu plano ${company.plan} permite no máximo ${limits.maxBillsToPay} conta(s) a pagar pendente(s). Faça upgrade para adicionar mais contas ou pague as contas existentes.`);
        }
    }
    async getCompanyUsageStats(companyId) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: { plan: true },
        });
        if (!company) {
            throw new common_1.BadRequestException('Empresa não encontrada');
        }
        const limits = this.getPlanLimits(company.plan);
        const [productsCount, sellersCount, billsToPayCount] = await Promise.all([
            this.prisma.product.count({ where: { companyId } }),
            this.prisma.seller.count({ where: { companyId } }),
            this.prisma.billToPay.count({
                where: {
                    companyId,
                    isPaid: false,
                }
            }),
        ]);
        return {
            plan: company.plan,
            limits,
            usage: {
                products: {
                    current: productsCount,
                    max: limits.maxProducts,
                    percentage: limits.maxProducts
                        ? Math.round((productsCount / limits.maxProducts) * 100)
                        : 0,
                    available: limits.maxProducts
                        ? limits.maxProducts - productsCount
                        : null,
                },
                sellers: {
                    current: sellersCount,
                    max: limits.maxSellers,
                    percentage: limits.maxSellers
                        ? Math.round((sellersCount / limits.maxSellers) * 100)
                        : 0,
                    available: limits.maxSellers
                        ? limits.maxSellers - sellersCount
                        : null,
                },
                billsToPay: {
                    current: billsToPayCount,
                    max: limits.maxBillsToPay,
                    percentage: limits.maxBillsToPay
                        ? Math.round((billsToPayCount / limits.maxBillsToPay) * 100)
                        : 0,
                    available: limits.maxBillsToPay
                        ? limits.maxBillsToPay - billsToPayCount
                        : null,
                },
            },
        };
    }
    async checkNearLimits(companyId) {
        const stats = await this.getCompanyUsageStats(companyId);
        const warnings = [];
        let nearLimit = false;
        if (stats.usage.products.percentage >= 80 && stats.limits.maxProducts) {
            warnings.push(`Você está usando ${stats.usage.products.percentage}% do seu limite de produtos (${stats.usage.products.current}/${stats.usage.products.max})`);
            nearLimit = true;
        }
        if (stats.usage.sellers.percentage >= 80 && stats.limits.maxSellers) {
            warnings.push(`Você está usando ${stats.usage.sellers.percentage}% do seu limite de vendedores (${stats.usage.sellers.current}/${stats.usage.sellers.max})`);
            nearLimit = true;
        }
        if (stats.usage.billsToPay.percentage >= 80 && stats.limits.maxBillsToPay) {
            warnings.push(`Você está usando ${stats.usage.billsToPay.percentage}% do seu limite de contas a pagar (${stats.usage.billsToPay.current}/${stats.usage.billsToPay.max})`);
            nearLimit = true;
        }
        return {
            nearLimit,
            warnings,
        };
    }
};
exports.PlanLimitsService = PlanLimitsService;
exports.PlanLimitsService = PlanLimitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlanLimitsService);
//# sourceMappingURL=plan-limits.service.js.map
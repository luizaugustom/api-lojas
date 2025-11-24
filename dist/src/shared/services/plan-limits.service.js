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
                    maxCustomers: null,
                    photoUploadEnabled: true,
                    maxPhotosPerProduct: null,
                    nfceEmissionEnabled: true,
                    nfeEmissionEnabled: true,
                };
            case client_1.PlanType.PLUS:
                return {
                    maxProducts: 800,
                    maxSellers: 2,
                    maxBillsToPay: 15,
                    maxCustomers: null,
                    photoUploadEnabled: true,
                    maxPhotosPerProduct: null,
                    nfceEmissionEnabled: true,
                    nfeEmissionEnabled: true,
                };
            case client_1.PlanType.PRO:
                return {
                    maxProducts: null,
                    maxSellers: null,
                    maxBillsToPay: null,
                    maxCustomers: null,
                    photoUploadEnabled: true,
                    maxPhotosPerProduct: null,
                    nfceEmissionEnabled: true,
                    nfeEmissionEnabled: true,
                };
            case client_1.PlanType.TRIAL_7_DAYS:
                return {
                    maxProducts: 800,
                    maxSellers: 2,
                    maxBillsToPay: 15,
                    maxCustomers: null,
                    photoUploadEnabled: true,
                    maxPhotosPerProduct: null,
                    nfceEmissionEnabled: true,
                    nfeEmissionEnabled: true,
                };
            default:
                return {
                    maxProducts: 250,
                    maxSellers: 1,
                    maxBillsToPay: 5,
                    maxCustomers: null,
                    photoUploadEnabled: true,
                    maxPhotosPerProduct: null,
                    nfceEmissionEnabled: true,
                    nfeEmissionEnabled: true,
                };
        }
    }
    async getCompanyLimits(companyId) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: {
                maxProducts: true,
                maxCustomers: true,
                maxSellers: true,
                photoUploadEnabled: true,
                maxPhotosPerProduct: true,
                nfceEmissionEnabled: true,
                nfeEmissionEnabled: true,
                plan: true,
            },
        });
        if (!company) {
            throw new common_1.BadRequestException('Empresa não encontrada');
        }
        return {
            maxProducts: company.maxProducts ?? null,
            maxSellers: company.maxSellers ?? null,
            maxBillsToPay: null,
            maxCustomers: company.maxCustomers ?? null,
            photoUploadEnabled: company.photoUploadEnabled ?? true,
            maxPhotosPerProduct: company.maxPhotosPerProduct ?? null,
            nfceEmissionEnabled: company.nfceEmissionEnabled ?? true,
            nfeEmissionEnabled: company.nfeEmissionEnabled ?? true,
        };
    }
    async validateProductLimit(companyId) {
        const limits = await this.getCompanyLimits(companyId);
        if (limits.maxProducts === null) {
            return;
        }
        const currentCount = await this.prisma.product.count({
            where: { companyId },
        });
        if (currentCount >= limits.maxProducts) {
            throw new common_1.BadRequestException(`Limite de produtos atingido. Você pode cadastrar no máximo ${limits.maxProducts} produtos. Entre em contato com o administrador para ajustar o limite.`);
        }
    }
    async validateSellerLimit(companyId) {
        const limits = await this.getCompanyLimits(companyId);
        if (limits.maxSellers === null) {
            return;
        }
        const currentCount = await this.prisma.seller.count({
            where: { companyId },
        });
        if (currentCount >= limits.maxSellers) {
            throw new common_1.BadRequestException(`Limite de vendedores atingido. Você pode cadastrar no máximo ${limits.maxSellers} vendedor(es). Entre em contato com o administrador para ajustar o limite.`);
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
        const limits = await this.getCompanyLimits(companyId);
        const [productsCount, sellersCount, billsToPayCount, customersCount] = await Promise.all([
            this.prisma.product.count({ where: { companyId } }),
            this.prisma.seller.count({ where: { companyId } }),
            this.prisma.billToPay.count({
                where: {
                    companyId,
                    isPaid: false,
                }
            }),
            this.prisma.customer.count({ where: { companyId } }),
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
                customers: {
                    current: customersCount,
                    max: limits.maxCustomers,
                    percentage: limits.maxCustomers
                        ? Math.round((customersCount / limits.maxCustomers) * 100)
                        : 0,
                    available: limits.maxCustomers
                        ? limits.maxCustomers - customersCount
                        : null,
                },
            },
        };
    }
    async validateCustomerLimit(companyId) {
        const limits = await this.getCompanyLimits(companyId);
        if (limits.maxCustomers === null) {
            return;
        }
        const currentCount = await this.prisma.customer.count({
            where: { companyId },
        });
        if (currentCount >= limits.maxCustomers) {
            throw new common_1.BadRequestException(`Limite de clientes atingido. Você pode cadastrar no máximo ${limits.maxCustomers} clientes. Entre em contato com o administrador para ajustar o limite.`);
        }
    }
    async validatePhotoUploadEnabled(companyId) {
        const limits = await this.getCompanyLimits(companyId);
        if (!limits.photoUploadEnabled) {
            throw new common_1.BadRequestException('Upload de fotos está desabilitado para sua empresa. Entre em contato com o administrador para habilitar.');
        }
    }
    async validatePhotoLimitPerProduct(companyId, currentPhotosCount, newPhotosCount) {
        const limits = await this.getCompanyLimits(companyId);
        if (limits.maxPhotosPerProduct === null) {
            return;
        }
        const totalPhotos = currentPhotosCount + newPhotosCount;
        if (totalPhotos > limits.maxPhotosPerProduct) {
            throw new common_1.BadRequestException(`Limite de fotos por produto excedido. Você pode adicionar no máximo ${limits.maxPhotosPerProduct} foto(s) por produto. ` +
                `Atualmente: ${currentPhotosCount} foto(s), tentando adicionar: ${newPhotosCount}.`);
        }
    }
    async validateNfceEmissionEnabled(companyId) {
        const limits = await this.getCompanyLimits(companyId);
        if (!limits.nfceEmissionEnabled) {
            throw new common_1.BadRequestException('Emissão de NFCe está desabilitada para sua empresa. Entre em contato com o administrador para habilitar.');
        }
    }
    async validateNfeEmissionEnabled(companyId) {
        const limits = await this.getCompanyLimits(companyId);
        if (!limits.nfeEmissionEnabled) {
            throw new common_1.BadRequestException('Emissão de NFe está desabilitada para sua empresa. Entre em contato com o administrador para habilitar.');
        }
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
        if (stats.usage.customers.percentage >= 80 && stats.limits.maxCustomers) {
            warnings.push(`Você está usando ${stats.usage.customers.percentage}% do seu limite de clientes (${stats.usage.customers.current}/${stats.usage.customers.max})`);
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
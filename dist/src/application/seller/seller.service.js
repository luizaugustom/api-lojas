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
var SellerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const hash_service_1 = require("../../shared/services/hash.service");
const plan_limits_service_1 = require("../../shared/services/plan-limits.service");
const update_seller_data_period_dto_1 = require("./dto/update-seller-data-period.dto");
let SellerService = SellerService_1 = class SellerService {
    constructor(prisma, hashService, planLimitsService) {
        this.prisma = prisma;
        this.hashService = hashService;
        this.planLimitsService = planLimitsService;
        this.logger = new common_1.Logger(SellerService_1.name);
    }
    async create(companyId, createSellerDto) {
        try {
            await this.planLimitsService.validateSellerLimit(companyId);
            const hashedPassword = await this.hashService.hashPassword(createSellerDto.password);
            const data = {
                ...createSellerDto,
                password: hashedPassword,
                companyId,
            };
            if (!data.birthDate || data.birthDate === '') {
                delete data.birthDate;
            }
            const seller = await this.prisma.seller.create({
                data,
                select: {
                    id: true,
                    login: true,
                    name: true,
                    cpf: true,
                    email: true,
                    phone: true,
                    commissionRate: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            this.logger.log(`Seller created: ${seller.id} for company: ${companyId}`);
            return seller;
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Login já está em uso');
            }
            this.logger.error('Error creating seller:', error);
            throw error;
        }
    }
    async findAll(companyId) {
        const where = companyId ? { companyId } : {};
        const sellers = await this.prisma.seller.findMany({
            where,
            select: {
                id: true,
                login: true,
                name: true,
                cpf: true,
                email: true,
                phone: true,
                commissionRate: true,
                createdAt: true,
                updatedAt: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        sales: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const sellersWithStats = await Promise.all(sellers.map(async (seller) => {
            const monthlySales = await this.prisma.sale.aggregate({
                where: {
                    sellerId: seller.id,
                    saleDate: {
                        gte: startOfMonth,
                    },
                },
                _sum: {
                    total: true,
                },
                _count: {
                    id: true,
                },
            });
            const totalSales = await this.prisma.sale.aggregate({
                where: { sellerId: seller.id },
                _sum: {
                    total: true,
                },
            });
            return {
                ...seller,
                monthlySalesValue: monthlySales._sum.total || 0,
                monthlySalesCount: monthlySales._count.id || 0,
                totalRevenue: totalSales._sum.total || 0,
            };
        }));
        return sellersWithStats;
    }
    async findOne(id, companyId) {
        const where = { id };
        if (companyId) {
            where.companyId = companyId;
        }
        const seller = await this.prisma.seller.findUnique({
            where,
            select: {
                id: true,
                login: true,
                name: true,
                cpf: true,
                birthDate: true,
                email: true,
                phone: true,
                commissionRate: true,
                createdAt: true,
                updatedAt: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        sales: true,
                    },
                },
            },
        });
        if (!seller) {
            throw new common_1.NotFoundException('Vendedor não encontrado');
        }
        return seller;
    }
    async update(id, updateSellerDto, companyId) {
        try {
            const where = { id };
            if (companyId) {
                where.companyId = companyId;
            }
            const existingSeller = await this.prisma.seller.findUnique({
                where,
            });
            if (!existingSeller) {
                throw new common_1.NotFoundException('Vendedor não encontrado');
            }
            const updateData = { ...updateSellerDto };
            if (!updateSellerDto.password || updateSellerDto.password.trim() === '') {
                delete updateData.password;
            }
            else {
                updateData.password = await this.hashService.hashPassword(updateSellerDto.password);
            }
            if (!updateData.birthDate || updateData.birthDate === '') {
                delete updateData.birthDate;
            }
            const seller = await this.prisma.seller.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    login: true,
                    name: true,
                    cpf: true,
                    email: true,
                    phone: true,
                    commissionRate: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            this.logger.log(`Seller updated: ${seller.id}`);
            return seller;
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Login já está em uso');
            }
            this.logger.error('Error updating seller:', error);
            throw error;
        }
    }
    async updateDataPeriod(id, dataPeriod) {
        if (!update_seller_data_period_dto_1.SELLER_ALLOWED_PERIODS.includes(dataPeriod)) {
            throw new common_1.ForbiddenException('Período não permitido para vendedor');
        }
        const updated = await this.prisma.seller.update({
            where: { id },
            data: {
                defaultDataPeriod: dataPeriod,
            },
            select: {
                id: true,
                defaultDataPeriod: true,
            },
        });
        this.logger.log(`Seller ${id} updated default data period to ${updated.defaultDataPeriod}`);
        return {
            message: 'Período padrão atualizado com sucesso',
            dataPeriod: updated.defaultDataPeriod,
        };
    }
    async remove(id, companyId) {
        try {
            const where = { id };
            if (companyId) {
                where.companyId = companyId;
            }
            const existingSeller = await this.prisma.seller.findUnique({
                where,
            });
            if (!existingSeller) {
                throw new common_1.NotFoundException('Vendedor não encontrado');
            }
            await this.prisma.seller.delete({
                where: { id },
            });
            this.logger.log(`Seller deleted: ${id}`);
            return { message: 'Vendedor removido com sucesso' };
        }
        catch (error) {
            this.logger.error('Error deleting seller:', error);
            throw error;
        }
    }
    async getSellerStats(id, companyId) {
        const where = { id };
        if (companyId) {
            where.companyId = companyId;
        }
        const seller = await this.prisma.seller.findUnique({
            where,
            include: {
                _count: {
                    select: {
                        sales: true,
                    },
                },
            },
        });
        if (!seller) {
            throw new common_1.NotFoundException('Vendedor não encontrado');
        }
        const saleWhere = { sellerId: id };
        if (companyId) {
            saleWhere.companyId = companyId;
        }
        const totalSalesAggregate = await this.prisma.sale.aggregate({
            where: saleWhere,
            _sum: {
                total: true,
            },
        });
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const monthlySales = await this.prisma.sale.aggregate({
            where: {
                ...saleWhere,
                saleDate: {
                    gte: startOfMonth,
                },
            },
            _sum: {
                total: true,
            },
            _count: {
                id: true,
            },
        });
        const startOfPeriod = new Date();
        startOfPeriod.setDate(startOfPeriod.getDate() - 30);
        startOfPeriod.setHours(0, 0, 0, 0);
        const salesInPeriod = await this.prisma.sale.findMany({
            where: {
                ...saleWhere,
                saleDate: {
                    gte: startOfPeriod,
                },
            },
            select: {
                saleDate: true,
                total: true,
            },
            orderBy: {
                saleDate: 'asc',
            },
        });
        const salesByDateMap = new Map();
        for (const sale of salesInPeriod) {
            const dateKey = sale.saleDate.toISOString().split('T')[0];
            const entry = salesByDateMap.get(dateKey) ?? { total: 0, revenue: 0 };
            entry.total += 1;
            entry.revenue += Number(sale.total || 0);
            salesByDateMap.set(dateKey, entry);
        }
        const salesByPeriod = Array.from(salesByDateMap.entries())
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, data]) => ({
            date,
            total: data.total,
            revenue: Number(data.revenue),
        }));
        const topProductsRaw = await this.prisma.saleItem.groupBy({
            by: ['productId'],
            where: {
                sale: {
                    ...saleWhere,
                    saleDate: {
                        gte: startOfPeriod,
                    },
                },
            },
            _sum: {
                quantity: true,
                totalPrice: true,
            },
            orderBy: {
                _sum: {
                    quantity: 'desc',
                },
            },
            take: 5,
        });
        const productIds = topProductsRaw.map((item) => item.productId);
        const products = productIds.length
            ? await this.prisma.product.findMany({
                where: {
                    id: {
                        in: productIds,
                    },
                },
                select: {
                    id: true,
                    name: true,
                },
            })
            : [];
        const productNameMap = new Map(products.map((product) => [product.id, product.name]));
        const topProducts = topProductsRaw.map((item) => ({
            productId: item.productId,
            productName: productNameMap.get(item.productId) ?? 'Produto desconhecido',
            quantity: item._sum.quantity ?? 0,
            revenue: Number(item._sum.totalPrice ?? 0),
        }));
        const totalSalesCount = seller._count.sales;
        const totalRevenue = Number(totalSalesAggregate._sum.total || 0);
        const averageSaleValue = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;
        return {
            totalSales: totalSalesCount,
            totalRevenue: totalRevenue,
            averageSaleValue: averageSaleValue,
            monthlySales: monthlySales._count.id,
            monthlySalesValue: Number(monthlySales._sum.total || 0),
            salesByPeriod,
            topProducts,
        };
    }
    async getSellerSales(id, companyId, page = 1, limit = 10, startDate, endDate) {
        const where = { sellerId: id };
        if (companyId) {
            where.companyId = companyId;
        }
        if (startDate || endDate) {
            where.saleDate = {};
            if (startDate) {
                where.saleDate.gte = new Date(startDate);
            }
            if (endDate) {
                where.saleDate.lte = new Date(endDate);
            }
        }
        const [sales, total] = await Promise.all([
            this.prisma.sale.findMany({
                where,
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    barcode: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    saleDate: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.sale.count({ where }),
        ]);
        return {
            sales,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
};
exports.SellerService = SellerService;
exports.SellerService = SellerService = SellerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        hash_service_1.HashService,
        plan_limits_service_1.PlanLimitsService])
], SellerService);
//# sourceMappingURL=seller.service.js.map
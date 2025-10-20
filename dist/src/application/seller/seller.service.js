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
let SellerService = SellerService_1 = class SellerService {
    constructor(prisma, hashService) {
        this.prisma = prisma;
        this.hashService = hashService;
        this.logger = new common_1.Logger(SellerService_1.name);
    }
    async create(companyId, createSellerDto) {
        try {
            const hashedPassword = await this.hashService.hashPassword(createSellerDto.password);
            const seller = await this.prisma.seller.create({
                data: {
                    ...createSellerDto,
                    password: hashedPassword,
                    companyId,
                },
                select: {
                    id: true,
                    login: true,
                    name: true,
                    cpf: true,
                    email: true,
                    phone: true,
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
        return this.prisma.seller.findMany({
            where,
            select: {
                id: true,
                login: true,
                name: true,
                cpf: true,
                email: true,
                phone: true,
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
            if (updateSellerDto.password) {
                updateData.password = await this.hashService.hashPassword(updateSellerDto.password);
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
        const totalSales = await this.prisma.sale.aggregate({
            where: { sellerId: id },
            _sum: {
                total: true,
            },
        });
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const monthlySales = await this.prisma.sale.aggregate({
            where: {
                sellerId: id,
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
        return {
            totalSales: seller._count.sales,
            totalSalesValue: totalSales._sum.total || 0,
            monthlySales: monthlySales._count.id,
            monthlySalesValue: monthlySales._sum.total || 0,
        };
    }
    async getSellerSales(id, companyId, page = 1, limit = 10) {
        const where = { sellerId: id };
        if (companyId) {
            where.companyId = companyId;
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
        hash_service_1.HashService])
], SellerService);
//# sourceMappingURL=seller.service.js.map
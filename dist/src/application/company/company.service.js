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
var CompanyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const hash_service_1 = require("../../shared/services/hash.service");
let CompanyService = CompanyService_1 = class CompanyService {
    constructor(prisma, hashService) {
        this.prisma = prisma;
        this.hashService = hashService;
        this.logger = new common_1.Logger(CompanyService_1.name);
    }
    async create(adminId, createCompanyDto) {
        try {
            const hashedPassword = await this.hashService.hashPassword(createCompanyDto.password);
            const company = await this.prisma.company.create({
                data: {
                    ...createCompanyDto,
                    password: hashedPassword,
                    adminId,
                },
                select: {
                    id: true,
                    name: true,
                    login: true,
                    cnpj: true,
                    email: true,
                    phone: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            this.logger.log(`Company created: ${company.id} by admin: ${adminId}`);
            return company;
        }
        catch (error) {
            if (error.code === 'P2002') {
                const field = error.meta?.target?.[0];
                if (field === 'login') {
                    throw new common_1.ConflictException('Login já está em uso');
                }
                if (field === 'cnpj') {
                    throw new common_1.ConflictException('CNPJ já está em uso');
                }
                if (field === 'email') {
                    throw new common_1.ConflictException('Email já está em uso');
                }
            }
            this.logger.error('Error creating company:', error);
            throw error;
        }
    }
    async findAll(adminId) {
        const where = adminId ? { adminId } : {};
        return this.prisma.company.findMany({
            where,
            select: {
                id: true,
                name: true,
                login: true,
                cnpj: true,
                email: true,
                phone: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        sellers: true,
                        products: true,
                        sales: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findOne(id) {
        const company = await this.prisma.company.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                login: true,
                cnpj: true,
                email: true,
                phone: true,
                stateRegistration: true,
                municipalRegistration: true,
                logoUrl: true,
                brandColor: true,
                isActive: true,
                zipCode: true,
                state: true,
                city: true,
                district: true,
                street: true,
                number: true,
                complement: true,
                beneficiaryName: true,
                beneficiaryCpfCnpj: true,
                bankCode: true,
                bankName: true,
                agency: true,
                accountNumber: true,
                accountType: true,
                createdAt: true,
                updatedAt: true,
                admin: {
                    select: {
                        id: true,
                        login: true,
                    },
                },
                _count: {
                    select: {
                        sellers: true,
                        products: true,
                        sales: true,
                        customers: true,
                    },
                },
            },
        });
        if (!company) {
            throw new common_1.NotFoundException('Empresa não encontrada');
        }
        return company;
    }
    async update(id, updateCompanyDto) {
        try {
            const existingCompany = await this.prisma.company.findUnique({
                where: { id },
            });
            if (!existingCompany) {
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
            const updateData = { ...updateCompanyDto };
            if (updateCompanyDto.password) {
                updateData.password = await this.hashService.hashPassword(updateCompanyDto.password);
            }
            const company = await this.prisma.company.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    login: true,
                    cnpj: true,
                    email: true,
                    phone: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            this.logger.log(`Company updated: ${company.id}`);
            return company;
        }
        catch (error) {
            if (error.code === 'P2002') {
                const field = error.meta?.target?.[0];
                if (field === 'login') {
                    throw new common_1.ConflictException('Login já está em uso');
                }
                if (field === 'cnpj') {
                    throw new common_1.ConflictException('CNPJ já está em uso');
                }
                if (field === 'email') {
                    throw new common_1.ConflictException('Email já está em uso');
                }
            }
            this.logger.error('Error updating company:', error);
            throw error;
        }
    }
    async remove(id) {
        try {
            const existingCompany = await this.prisma.company.findUnique({
                where: { id },
            });
            if (!existingCompany) {
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
            await this.prisma.company.delete({
                where: { id },
            });
            this.logger.log(`Company deleted: ${id}`);
            return { message: 'Empresa removida com sucesso' };
        }
        catch (error) {
            this.logger.error('Error deleting company:', error);
            throw error;
        }
    }
    async getCompanyStats(id) {
        const company = await this.prisma.company.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        sellers: true,
                        products: true,
                        sales: true,
                        customers: true,
                        billsToPay: true,
                    },
                },
            },
        });
        if (!company) {
            throw new common_1.NotFoundException('Empresa não encontrada');
        }
        const totalSales = await this.prisma.sale.aggregate({
            where: { companyId: id },
            _sum: {
                total: true,
            },
        });
        const pendingBills = await this.prisma.billToPay.aggregate({
            where: {
                companyId: id,
                isPaid: false,
            },
            _sum: {
                amount: true,
            },
        });
        return {
            ...company._count,
            totalSalesValue: totalSales._sum.total || 0,
            pendingBillsValue: pendingBills._sum.amount || 0,
        };
    }
    async activate(id) {
        try {
            const existingCompany = await this.prisma.company.findUnique({
                where: { id },
            });
            if (!existingCompany) {
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
            const company = await this.prisma.company.update({
                where: { id },
                data: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    login: true,
                    cnpj: true,
                    email: true,
                    phone: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            this.logger.log(`Company activated: ${company.id}`);
            return company;
        }
        catch (error) {
            this.logger.error('Error activating company:', error);
            throw error;
        }
    }
    async deactivate(id) {
        try {
            const existingCompany = await this.prisma.company.findUnique({
                where: { id },
            });
            if (!existingCompany) {
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
            const company = await this.prisma.company.update({
                where: { id },
                data: { isActive: false },
                select: {
                    id: true,
                    name: true,
                    login: true,
                    cnpj: true,
                    email: true,
                    phone: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            this.logger.log(`Company deactivated: ${company.id}`);
            return company;
        }
        catch (error) {
            this.logger.error('Error deactivating company:', error);
            throw error;
        }
    }
};
exports.CompanyService = CompanyService;
exports.CompanyService = CompanyService = CompanyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        hash_service_1.HashService])
], CompanyService);
//# sourceMappingURL=company.service.js.map
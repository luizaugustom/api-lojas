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
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const hash_service_1 = require("../../shared/services/hash.service");
const encryption_service_1 = require("../../shared/services/encryption.service");
let AdminService = AdminService_1 = class AdminService {
    constructor(prisma, hashService, encryptionService) {
        this.prisma = prisma;
        this.hashService = hashService;
        this.encryptionService = encryptionService;
        this.logger = new common_1.Logger(AdminService_1.name);
    }
    async create(createAdminDto) {
        try {
            const hashedPassword = await this.hashService.hashPassword(createAdminDto.password);
            const admin = await this.prisma.admin.create({
                data: {
                    login: createAdminDto.login,
                    password: hashedPassword,
                },
                select: {
                    id: true,
                    login: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            this.logger.log(`Admin created: ${admin.id}`);
            return admin;
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Login já está em uso');
            }
            this.logger.error('Error creating admin:', error);
            throw error;
        }
    }
    async findAll() {
        return this.prisma.admin.findMany({
            select: {
                id: true,
                login: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        companies: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findOne(id) {
        const admin = await this.prisma.admin.findUnique({
            where: { id },
            select: {
                id: true,
                login: true,
                createdAt: true,
                updatedAt: true,
                companies: {
                    select: {
                        id: true,
                        name: true,
                        cnpj: true,
                        email: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!admin) {
            throw new common_1.NotFoundException('Admin não encontrado');
        }
        return admin;
    }
    async update(id, updateAdminDto) {
        try {
            const existingAdmin = await this.prisma.admin.findUnique({
                where: { id },
            });
            if (!existingAdmin) {
                throw new common_1.NotFoundException('Admin não encontrado');
            }
            const updateData = { ...updateAdminDto };
            if (updateAdminDto.login) {
                updateData.login = updateAdminDto.login;
            }
            if (!updateAdminDto.password || updateAdminDto.password.trim() === '') {
                delete updateData.password;
            }
            else {
                updateData.password = await this.hashService.hashPassword(updateAdminDto.password);
            }
            const admin = await this.prisma.admin.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    login: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            this.logger.log(`Admin updated: ${admin.id}`);
            return admin;
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Login já está em uso');
            }
            this.logger.error('Error updating admin:', error);
            throw error;
        }
    }
    async remove(id) {
        try {
            const existingAdmin = await this.prisma.admin.findUnique({
                where: { id },
            });
            if (!existingAdmin) {
                throw new common_1.NotFoundException('Admin não encontrado');
            }
            await this.prisma.admin.delete({
                where: { id },
            });
            this.logger.log(`Admin deleted: ${id}`);
            return { message: 'Admin removido com sucesso' };
        }
        catch (error) {
            this.logger.error('Error deleting admin:', error);
            throw error;
        }
    }
    async updateFocusNfeConfig(adminId, updateFocusNfeConfigDto) {
        try {
            const admin = await this.prisma.admin.findUnique({
                where: { id: adminId },
            });
            if (!admin) {
                throw new common_1.NotFoundException('Admin não encontrado');
            }
            const updateData = {};
            if (updateFocusNfeConfigDto.focusNfeApiKey !== undefined) {
                updateData.focusNfeApiKey = updateFocusNfeConfigDto.focusNfeApiKey;
            }
            if (updateFocusNfeConfigDto.focusNfeEnvironment !== undefined) {
                updateData.focusNfeEnvironment = updateFocusNfeConfigDto.focusNfeEnvironment;
            }
            if (updateFocusNfeConfigDto.ibptToken !== undefined) {
                updateData.ibptToken = updateFocusNfeConfigDto.ibptToken;
            }
            const updatedAdmin = await this.prisma.admin.update({
                where: { id: adminId },
                data: updateData,
                select: {
                    id: true,
                    login: true,
                    focusNfeEnvironment: true,
                },
            });
            this.logger.log(`Focus NFe config updated for admin: ${adminId}`);
            return {
                ...updatedAdmin,
                message: 'Configurações do Focus NFe atualizadas com sucesso',
            };
        }
        catch (error) {
            this.logger.error('Error updating Focus NFe config:', error);
            throw error;
        }
    }
    async getFocusNfeConfig(adminId) {
        try {
            const admin = await this.prisma.admin.findUnique({
                where: { id: adminId },
                select: {
                    id: true,
                    login: true,
                    focusNfeApiKey: true,
                    focusNfeEnvironment: true,
                    ibptToken: true,
                },
            });
            if (!admin) {
                throw new common_1.NotFoundException('Admin não encontrado');
            }
            return {
                id: admin.id,
                login: admin.login,
                focusNfeApiKey: admin.focusNfeApiKey
                    ? this.encryptionService.mask(admin.focusNfeApiKey)
                    : null,
                hasFocusNfeApiKey: !!admin.focusNfeApiKey,
                focusNfeEnvironment: admin.focusNfeEnvironment || 'sandbox',
                ibptToken: admin.ibptToken
                    ? this.encryptionService.mask(admin.ibptToken)
                    : null,
                hasIbptToken: !!admin.ibptToken,
            };
        }
        catch (error) {
            this.logger.error('Error getting Focus NFe config:', error);
            throw error;
        }
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        hash_service_1.HashService,
        encryption_service_1.EncryptionService])
], AdminService);
//# sourceMappingURL=admin.service.js.map
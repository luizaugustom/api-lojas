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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const admin_service_1 = require("../admin/admin.service");
const company_service_1 = require("../company/company.service");
const seller_service_1 = require("../seller/seller.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(jwtService, configService, prisma, adminService, companyService, sellerService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.prisma = prisma;
        this.adminService = adminService;
        this.companyService = companyService;
        this.sellerService = sellerService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
    generateRandomToken() {
        return crypto.randomBytes(64).toString('hex');
    }
    async validateUser(login, password) {
        try {
            const [admin, company, seller] = await Promise.all([
                this.prisma.admin.findUnique({ where: { login } }),
                this.prisma.company.findUnique({ where: { login } }),
                this.prisma.seller.findUnique({ where: { login } }),
            ]);
            let user = null;
            let role = '';
            if (admin) {
                user = admin;
                role = 'admin';
            }
            else if (company) {
                user = company;
                role = 'company';
            }
            else if (seller) {
                user = seller;
                role = 'seller';
            }
            if (!user) {
                return null;
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return null;
            }
            let mappedCompanyId = null;
            if (role === 'company') {
                mappedCompanyId = user.id;
            }
            else if (role === 'seller') {
                mappedCompanyId = user.companyId || null;
            }
            return {
                id: user.id,
                login: user.login,
                role,
                companyId: mappedCompanyId,
                name: user.name || null,
            };
        }
        catch (error) {
            this.logger.error('Error validating user:', error);
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
    }
    async login(loginDto) {
        const user = await this.validateUser(loginDto.login, loginDto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Login ou senha inválidos');
        }
        const payload = {
            sub: user.id,
            login: user.login,
            role: user.role,
            companyId: user.companyId,
        };
        const access_token = this.jwtService.sign(payload, { expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m') });
        const refreshToken = this.generateRandomToken();
        const refreshTokenHash = this.hashToken(refreshToken);
        const refreshTtlSeconds = Number(this.configService.get('REFRESH_TOKEN_TTL_SECONDS', 60 * 60 * 24 * 30));
        await this.prisma.refreshToken.create({
            data: {
                tokenHash: refreshTokenHash,
                userId: user.id,
                role: user.role,
                expiresAt: new Date(Date.now() + refreshTtlSeconds * 1000),
            },
        });
        this.logger.log(`User ${user.login} (${user.role}) logged in successfully`);
        return {
            access_token,
            user: {
                id: user.id,
                login: user.login,
                role: user.role,
                companyId: user.companyId,
                name: user.name,
            },
            refresh_token: refreshToken,
        };
    }
    async refresh(refreshToken) {
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token missing');
        }
        const hash = this.hashToken(refreshToken);
        const tokenRecord = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
        if (!tokenRecord || tokenRecord.revoked) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (tokenRecord.expiresAt.getTime() < Date.now()) {
            throw new common_1.UnauthorizedException('Refresh token expired');
        }
        let user = null;
        switch (tokenRecord.role) {
            case 'admin':
                user = await this.prisma.admin.findUnique({ where: { id: tokenRecord.userId } });
                break;
            case 'company':
                user = await this.prisma.company.findUnique({ where: { id: tokenRecord.userId } });
                break;
            case 'seller':
                user = await this.prisma.seller.findUnique({ where: { id: tokenRecord.userId } });
                break;
        }
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const payload = {
            sub: user.id,
            login: user.login,
            role: tokenRecord.role,
            companyId: user.companyId || undefined,
        };
        const access_token = this.jwtService.sign(payload, { expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m') });
        const newRefresh = this.generateRandomToken();
        const newHash = this.hashToken(newRefresh);
        await this.prisma.refreshToken.update({ where: { id: tokenRecord.id }, data: { revoked: true } });
        const refreshTtlSeconds = Number(this.configService.get('REFRESH_TOKEN_TTL_SECONDS', 60 * 60 * 24 * 30));
        await this.prisma.refreshToken.create({
            data: {
                tokenHash: newHash,
                userId: tokenRecord.userId,
                role: tokenRecord.role,
                expiresAt: new Date(Date.now() + refreshTtlSeconds * 1000),
            },
        });
        return {
            access_token,
            refresh_token: newRefresh,
            user: {
                id: user.id,
                login: user.login,
                role: tokenRecord.role,
                companyId: user.companyId || undefined,
                name: user.name || undefined,
            },
        };
    }
    async revokeRefreshToken(refreshToken) {
        if (!refreshToken)
            return;
        const hash = this.hashToken(refreshToken);
        const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
        if (record) {
            await this.prisma.refreshToken.update({ where: { id: record.id }, data: { revoked: true } });
        }
    }
    async validateJwtPayload(payload) {
        try {
            let user = null;
            switch (payload.role) {
                case 'admin':
                    user = await this.prisma.admin.findUnique({
                        where: { id: payload.sub },
                    });
                    break;
                case 'company':
                    user = await this.prisma.company.findUnique({
                        where: { id: payload.sub },
                    });
                    break;
                case 'seller':
                    user = await this.prisma.seller.findUnique({
                        where: { id: payload.sub },
                    });
                    break;
                default:
                    return null;
            }
            if (!user) {
                return null;
            }
            let mappedCompanyId = null;
            if (payload.role === 'company') {
                mappedCompanyId = user.id;
            }
            else if (payload.role === 'seller') {
                mappedCompanyId = user.companyId || null;
            }
            return {
                id: user.id,
                login: user.login,
                role: payload.role,
                companyId: mappedCompanyId,
                name: user.name || null,
            };
        }
        catch (error) {
            this.logger.error('Error validating JWT payload:', error);
            return null;
        }
    }
    async hashPassword(password) {
        const saltRounds = parseInt(this.configService.get('BCRYPT_ROUNDS', '10'), 10) || 10;
        return bcrypt.hash(password, saltRounds);
    }
    async verifyPassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }
    async getProfile(userId, role) {
        try {
            let user = null;
            switch (role) {
                case 'admin':
                    user = await this.prisma.admin.findUnique({
                        where: { id: userId },
                        select: {
                            id: true,
                            login: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    });
                    break;
                case 'company':
                    user = await this.prisma.company.findUnique({
                        where: { id: userId },
                        select: {
                            id: true,
                            login: true,
                            name: true,
                            email: true,
                            phone: true,
                            cnpj: true,
                            plan: true,
                            isActive: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    });
                    break;
                case 'seller':
                    user = await this.prisma.seller.findUnique({
                        where: { id: userId },
                        select: {
                            id: true,
                            login: true,
                            name: true,
                            email: true,
                            phone: true,
                            cpf: true,
                            commissionRate: true,
                            companyId: true,
                            createdAt: true,
                            updatedAt: true,
                            company: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    });
                    break;
            }
            if (!user) {
                throw new common_1.UnauthorizedException('Usuário não encontrado');
            }
            return { ...user, role };
        }
        catch (error) {
            this.logger.error('Error getting profile:', error);
            throw error;
        }
    }
    async updateProfile(userId, role, updateData) {
        try {
            let user = null;
            const { password, ...safeData } = updateData;
            switch (role) {
                case 'admin':
                    user = await this.prisma.admin.update({
                        where: { id: userId },
                        data: safeData,
                        select: {
                            id: true,
                            login: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    });
                    break;
                case 'company':
                    user = await this.prisma.company.update({
                        where: { id: userId },
                        data: safeData,
                        select: {
                            id: true,
                            login: true,
                            name: true,
                            email: true,
                            phone: true,
                            cnpj: true,
                            plan: true,
                            isActive: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    });
                    break;
                case 'seller':
                    user = await this.prisma.seller.update({
                        where: { id: userId },
                        data: safeData,
                        select: {
                            id: true,
                            login: true,
                            name: true,
                            email: true,
                            phone: true,
                            cpf: true,
                            commissionRate: true,
                            companyId: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    });
                    break;
            }
            this.logger.log(`Profile updated for user: ${userId} (${role})`);
            return { ...user, role };
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.BadRequestException('Login ou email já está em uso');
            }
            this.logger.error('Error updating profile:', error);
            throw error;
        }
    }
    async changePassword(userId, role, currentPassword, newPassword) {
        try {
            let user = null;
            switch (role) {
                case 'admin':
                    user = await this.prisma.admin.findUnique({
                        where: { id: userId },
                    });
                    break;
                case 'company':
                    user = await this.prisma.company.findUnique({
                        where: { id: userId },
                    });
                    break;
                case 'seller':
                    user = await this.prisma.seller.findUnique({
                        where: { id: userId },
                    });
                    break;
            }
            if (!user) {
                throw new common_1.UnauthorizedException('Usuário não encontrado');
            }
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                throw new common_1.BadRequestException('Senha atual incorreta');
            }
            const hashedPassword = await this.hashPassword(newPassword);
            switch (role) {
                case 'admin':
                    await this.prisma.admin.update({
                        where: { id: userId },
                        data: { password: hashedPassword },
                    });
                    break;
                case 'company':
                    await this.prisma.company.update({
                        where: { id: userId },
                        data: { password: hashedPassword },
                    });
                    break;
                case 'seller':
                    await this.prisma.seller.update({
                        where: { id: userId },
                        data: { password: hashedPassword },
                    });
                    break;
            }
            await this.prisma.refreshToken.updateMany({
                where: {
                    userId,
                    role,
                    revoked: false,
                },
                data: {
                    revoked: true,
                },
            });
            this.logger.log(`Password changed for user: ${userId} (${role})`);
            return { message: 'Senha alterada com sucesso. Por favor, faça login novamente.' };
        }
        catch (error) {
            this.logger.error('Error changing password:', error);
            throw error;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => admin_service_1.AdminService))),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => company_service_1.CompanyService))),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => seller_service_1.SellerService))),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService,
        admin_service_1.AdminService,
        company_service_1.CompanyService,
        seller_service_1.SellerService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
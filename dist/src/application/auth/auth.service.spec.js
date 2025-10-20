"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const admin_service_1 = require("../admin/admin.service");
const company_service_1 = require("../company/company.service");
const seller_service_1 = require("../seller/seller.service");
describe('AuthService', () => {
    let service;
    let prismaService;
    let jwtService;
    const mockPrismaService = {
        admin: {
            findUnique: jest.fn(),
        },
        company: {
            findUnique: jest.fn(),
        },
        seller: {
            findUnique: jest.fn(),
        },
    };
    const mockJwtService = {
        sign: jest.fn(),
    };
    const mockConfigService = {
        get: jest.fn((key, defaultValue) => {
            if (key === 'JWT_EXPIRES_IN')
                return '15m';
            if (key === 'BCRYPT_ROUNDS')
                return 12;
            if (key === 'REFRESH_TOKEN_TTL_SECONDS')
                return 60 * 60 * 24 * 30;
            return defaultValue;
        }),
    };
    const mockAdminService = {};
    const mockCompanyService = {};
    const mockSellerService = {};
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: jwt_1.JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: config_1.ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: admin_service_1.AdminService,
                    useValue: mockAdminService,
                },
                {
                    provide: company_service_1.CompanyService,
                    useValue: mockCompanyService,
                },
                {
                    provide: seller_service_1.SellerService,
                    useValue: mockSellerService,
                },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        prismaService = module.get(prisma_service_1.PrismaService);
        jwtService = module.get(jwt_1.JwtService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('validateUser', () => {
        it('should validate admin user successfully', async () => {
            const mockAdmin = {
                id: '1',
                login: 'admin@test.com',
                password: '$2b$12$hashedpassword',
            };
            mockPrismaService.admin.findUnique.mockResolvedValue(mockAdmin);
            mockPrismaService.company.findUnique.mockResolvedValue(null);
            mockPrismaService.seller.findUnique.mockResolvedValue(null);
            jest.spyOn(service, 'verifyPassword').mockResolvedValue(true);
            const result = await service.validateUser('admin@test.com', 'password');
            expect(result).toEqual({
                id: '1',
                login: 'admin@test.com',
                role: 'admin',
                companyId: null,
                name: null,
            });
        });
        it('should return null for invalid credentials', async () => {
            mockPrismaService.admin.findUnique.mockResolvedValue(null);
            mockPrismaService.company.findUnique.mockResolvedValue(null);
            mockPrismaService.seller.findUnique.mockResolvedValue(null);
            const result = await service.validateUser('invalid@test.com', 'password');
            expect(result).toBeNull();
        });
    });
    describe('login', () => {
        it('should login successfully', async () => {
            const mockUser = {
                id: '1',
                login: 'admin@test.com',
                role: 'admin',
                companyId: null,
                name: null,
            };
            jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
            mockJwtService.sign.mockReturnValue('jwt-token');
            const loginDto = {
                login: 'admin@test.com',
                password: 'password',
            };
            const result = await service.login(loginDto);
            expect(result).toEqual({
                access_token: 'jwt-token',
                user: mockUser,
            });
        });
        it('should throw UnauthorizedException for invalid credentials', async () => {
            jest.spyOn(service, 'validateUser').mockResolvedValue(null);
            const loginDto = {
                login: 'invalid@test.com',
                password: 'wrongpassword',
            };
            await expect(service.login(loginDto)).rejects.toThrow('Login ou senha inválidos');
        });
    });
    describe('hashPassword', () => {
        it('should hash password successfully', async () => {
            const password = 'testpassword';
            const hashedPassword = await service.hashPassword(password);
            expect(hashedPassword).toBeDefined();
            expect(hashedPassword).not.toBe(password);
            expect(hashedPassword.length).toBeGreaterThan(0);
        });
    });
    describe('verifyPassword', () => {
        it('should verify password successfully', async () => {
            const password = 'testpassword';
            const hashedPassword = await service.hashPassword(password);
            const isValid = await service.verifyPassword(password, hashedPassword);
            expect(isValid).toBe(true);
        });
        it('should return false for invalid password', async () => {
            const password = 'testpassword';
            const wrongPassword = 'wrongpassword';
            const hashedPassword = await service.hashPassword(password);
            const isValid = await service.verifyPassword(wrongPassword, hashedPassword);
            expect(isValid).toBe(false);
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map
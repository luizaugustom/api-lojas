import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AdminService } from '../admin/admin.service';
import { CompanyService } from '../company/company.service';
import { SellerService } from '../seller/seller.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

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
    get: jest.fn().mockReturnValue('test-secret'),
  };

  const mockAdminService = {};
  const mockCompanyService = {};
  const mockSellerService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
        {
          provide: SellerService,
          useValue: mockSellerService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
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

      // Mock bcrypt.compare
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

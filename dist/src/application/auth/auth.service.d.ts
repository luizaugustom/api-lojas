import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AdminService } from '../admin/admin.service';
import { CompanyService } from '../company/company.service';
import { SellerService } from '../seller/seller.service';
import { LoginDto } from './dto/login.dto';
export interface JwtPayload {
    sub: string;
    email?: string;
    login: string;
    role: string;
    companyId?: string;
}
export interface LoginResponse {
    access_token: string;
    user: {
        id: string;
        login: string;
        role: string;
        companyId?: string;
        name?: string;
    };
}
export declare class AuthService {
    private readonly jwtService;
    private readonly configService;
    private readonly prisma;
    private readonly adminService;
    private readonly companyService;
    private readonly sellerService;
    private readonly logger;
    constructor(jwtService: JwtService, configService: ConfigService, prisma: PrismaService, adminService: AdminService, companyService: CompanyService, sellerService: SellerService);
    private hashToken;
    private generateRandomToken;
    validateUser(login: string, password: string): Promise<any>;
    login(loginDto: LoginDto): Promise<LoginResponse>;
    refresh(refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: any;
            login: any;
            role: string;
            companyId: string;
            name: any;
        };
    }>;
    revokeRefreshToken(refreshToken: string): Promise<void>;
    validateJwtPayload(payload: JwtPayload): Promise<any>;
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
}

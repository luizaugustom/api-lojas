import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly adminService: AdminService,
    private readonly companyService: CompanyService,
    private readonly sellerService: SellerService,
  ) {}

  async validateUser(login: string, password: string): Promise<any> {
    try {
      // Try to find user in different tables
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
      } else if (company) {
        user = company;
        role = 'company';
      } else if (seller) {
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

      return {
        id: user.id,
        login: user.login,
        role,
        companyId: user.companyId || null,
        name: user.name || null,
      };
    } catch (error) {
      this.logger.error('Error validating user:', error);
      throw new UnauthorizedException('Credenciais inválidas');
    }
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.validateUser(loginDto.login, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Login ou senha inválidos');
    }

    const payload: JwtPayload = {
      sub: user.id,
      login: user.login,
      role: user.role,
      companyId: user.companyId,
    };

    const access_token = this.jwtService.sign(payload);

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
    };
  }

  async validateJwtPayload(payload: JwtPayload): Promise<any> {
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

      return {
        id: user.id,
        login: user.login,
        role: payload.role,
        companyId: user.companyId || null,
        name: user.name || null,
      };
    } catch (error) {
      this.logger.error('Error validating JWT payload:', error);
      return null;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get('BCRYPT_ROUNDS', 12);
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}

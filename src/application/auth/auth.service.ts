import { Injectable, UnauthorizedException, Logger, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
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
    plan?: string; // Plano da empresa (apenas para role 'company')
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  @Inject(forwardRef(() => AdminService))
  private readonly adminService: AdminService,
  @Inject(forwardRef(() => CompanyService))
  private readonly companyService: CompanyService,
  @Inject(forwardRef(() => SellerService))
  private readonly sellerService: SellerService,
  ) {}

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateRandomToken() {
    return crypto.randomBytes(64).toString('hex');
  }

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

      // Verificar se empresa está ativa (para login de empresa)
      if (role === 'company') {
        if (!(user as any).isActive) {
          this.logger.warn(`Login bloqueado: Empresa ${user.login} está desativada`);
          return null;
        }
      }

      // Mapear companyId para cada role
      let mappedCompanyId: string | null = null;
      let plan: string | undefined = undefined;
      
      if (role === 'company') {
        mappedCompanyId = user.id; // a própria empresa
        plan = (user as any).plan; // Incluir o plano da empresa
      } else if (role === 'seller') {
        mappedCompanyId = user.companyId || null;
        // Se for vendedor, buscar o plano e verificar se a empresa está ativa
        if (mappedCompanyId) {
          const company = await this.prisma.company.findUnique({
            where: { id: mappedCompanyId },
            select: { plan: true, isActive: true },
          });
          
          // Bloquear login se a empresa estiver desativada
          if (!company || !company.isActive) {
            this.logger.warn(`Login bloqueado: Vendedor ${user.login} pertence à empresa ${mappedCompanyId} que está desativada`);
            return null;
          }
          
          plan = company.plan;
        }
      }

      return {
        id: user.id,
        login: user.login,
        role,
        companyId: mappedCompanyId,
        name: user.name || null,
        plan,
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

    const access_token = this.jwtService.sign(payload, { expiresIn: this.configService.get('JWT_EXPIRES_IN', '22h') });

    // Generate refresh token (random string) and persist its hash
    const refreshToken = this.generateRandomToken();
    const refreshTokenHash = this.hashToken(refreshToken);
    const refreshTtlSeconds = Number(this.configService.get('REFRESH_TOKEN_TTL_SECONDS', 60 * 60 * 24 * 30)); // default 30 days

    // persist
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
        plan: user.plan,
      },
      // also return refreshToken value so controller can set cookie
      refresh_token: refreshToken,
    } as any;
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const hash = this.hashToken(refreshToken);
    const tokenRecord = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash } });

    if (!tokenRecord || tokenRecord.revoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // find user details
    let user: any = null;
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
      throw new UnauthorizedException('User not found');
    }

    // Verificar se empresa está ativa (para refresh de empresa)
    if (tokenRecord.role === 'company') {
      if (!(user as any).isActive) {
        this.logger.warn(`Refresh bloqueado: Empresa ${user.login} está desativada`);
        throw new UnauthorizedException('Empresa desativada');
      }
    }

    // Verificar se empresa está ativa (para refresh de vendedor)
    if (tokenRecord.role === 'seller' && user.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: user.companyId as string },
        select: { isActive: true },
      });
      
      if (!company || !company.isActive) {
        this.logger.warn(`Refresh bloqueado: Vendedor ${user.login} pertence à empresa ${user.companyId} que está desativada`);
        throw new UnauthorizedException('Empresa desativada');
      }
    }

    const payload: JwtPayload = {
      sub: user.id,
      login: user.login,
      role: tokenRecord.role,
      companyId: (user.companyId as string) || undefined,
    };

    const access_token = this.jwtService.sign(payload, { expiresIn: this.configService.get('JWT_EXPIRES_IN', '22h') });

    // Optional: rotate refresh token. We'll issue a new one and revoke the old
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

    // Buscar plano se for empresa ou vendedor
    let plan: string | undefined = undefined;
    if (tokenRecord.role === 'company') {
      plan = (user as any).plan;
    } else if (tokenRecord.role === 'seller' && user.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: user.companyId as string },
        select: { plan: true, isActive: true },
      });
      plan = company?.plan;
    }

    return {
      access_token,
      refresh_token: newRefresh,
      user: {
        id: user.id,
        login: user.login,
        role: tokenRecord.role,
        companyId: (user.companyId as string) || undefined,
        name: user.name || undefined,
        plan,
      },
    };
  }

  async revokeRefreshToken(refreshToken: string) {
    if (!refreshToken) return;
    const hash = this.hashToken(refreshToken);
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
    if (record) {
      await this.prisma.refreshToken.update({ where: { id: record.id }, data: { revoked: true } });
    }
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

      // Verificar se empresa está ativa (para validação de token JWT de empresa)
      if (payload.role === 'company') {
        if (!(user as any).isActive) {
          this.logger.warn(`Validação JWT bloqueada: Empresa ${user.login} está desativada`);
          return null;
        }
      }

      // Ajustar companyId no objeto do usuário retornado ao request
      let mappedCompanyId: string | null = null;
      let plan: string | undefined = undefined;
      
      if (payload.role === 'company') {
        mappedCompanyId = user.id;
        plan = (user as any).plan; // Incluir o plano da empresa
      } else if (payload.role === 'seller') {
        mappedCompanyId = user.companyId || null;
        // Se for vendedor, buscar o plano e verificar se a empresa está ativa
        if (mappedCompanyId) {
          const company = await this.prisma.company.findUnique({
            where: { id: mappedCompanyId },
            select: { plan: true, isActive: true },
          });
          
          // Bloquear acesso se a empresa estiver desativada
          if (!company || !company.isActive) {
            this.logger.warn(`Validação JWT bloqueada: Vendedor ${user.login} pertence à empresa ${mappedCompanyId} que está desativada`);
            return null;
          }
          
          plan = company.plan;
        }
      }

      return {
        id: user.id,
        login: user.login,
        role: payload.role,
        companyId: mappedCompanyId,
        name: user.name || null,
        plan,
      };
    } catch (error) {
      this.logger.error('Error validating JWT payload:', error);
      return null;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(this.configService.get('BCRYPT_ROUNDS', '10'), 10) || 10;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async getProfile(userId: string, role: string) {
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
        throw new UnauthorizedException('Usuário não encontrado');
      }

      return { ...user, role };
    } catch (error) {
      this.logger.error('Error getting profile:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, role: string, updateData: any) {
    try {
      let user = null;

      // Remove campos não permitidos
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
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Login ou email já está em uso');
      }
      this.logger.error('Error updating profile:', error);
      throw error;
    }
  }

  async changePassword(userId: string, role: string, currentPassword: string, newPassword: string) {
    try {
      // Buscar usuário atual com senha
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
        throw new UnauthorizedException('Usuário não encontrado');
      }

      // Validar senha atual
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Senha atual incorreta');
      }

      // Hash da nova senha
      const hashedPassword = await this.hashPassword(newPassword);

      // Atualizar senha
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

      // Revogar todos os refresh tokens do usuário para forçar novo login
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
    } catch (error) {
      this.logger.error('Error changing password:', error);
      throw error;
    }
  }
}

import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { HashService } from '../../shared/services/hash.service';
import { EncryptionService } from '../../shared/services/encryption.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UpdateFocusNfeConfigDto } from './dto/update-focus-nfe-config.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(createAdminDto: CreateAdminDto) {
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
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Login já está em uso');
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

  async findOne(id: string) {
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
      throw new NotFoundException('Admin não encontrado');
    }

    return admin;
  }

  async update(id: string, updateAdminDto: UpdateAdminDto) {
    try {
      const existingAdmin = await this.prisma.admin.findUnique({
        where: { id },
      });

      if (!existingAdmin) {
        throw new NotFoundException('Admin não encontrado');
      }

      const updateData: any = { ...updateAdminDto };

      if (updateAdminDto.login) {
        updateData.login = updateAdminDto.login;
      }

      // Remove password field if empty or undefined
      if (!updateAdminDto.password || updateAdminDto.password.trim() === '') {
        delete updateData.password;
      } else {
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
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Login já está em uso');
      }
      this.logger.error('Error updating admin:', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const existingAdmin = await this.prisma.admin.findUnique({
        where: { id },
      });

      if (!existingAdmin) {
        throw new NotFoundException('Admin não encontrado');
      }

      await this.prisma.admin.delete({
        where: { id },
      });

      this.logger.log(`Admin deleted: ${id}`);
      return { message: 'Admin removido com sucesso' };
    } catch (error) {
      this.logger.error('Error deleting admin:', error);
      throw error;
    }
  }

  /**
   * Atualizar configurações globais do Focus NFe
   */
  async updateFocusNfeConfig(adminId: string, updateFocusNfeConfigDto: UpdateFocusNfeConfigDto) {
    try {
      const admin = await this.prisma.admin.findUnique({
        where: { id: adminId },
      });

      if (!admin) {
        throw new NotFoundException('Admin não encontrado');
      }

      const updateData: any = {};

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
          // Não retornar API keys por segurança
        },
      });

      this.logger.log(`Focus NFe config updated for admin: ${adminId}`);
      return {
        ...updatedAdmin,
        message: 'Configurações do Focus NFe atualizadas com sucesso',
      };
    } catch (error) {
      this.logger.error('Error updating Focus NFe config:', error);
      throw error;
    }
  }

  /**
   * Obter configurações globais do Focus NFe (dados sensíveis mascarados)
   */
  async getFocusNfeConfig(adminId: string) {
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
        throw new NotFoundException('Admin não encontrado');
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
    } catch (error) {
      this.logger.error('Error getting Focus NFe config:', error);
      throw error;
    }
  }
}

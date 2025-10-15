import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async create(createAdminDto: CreateAdminDto) {
    try {
      const hashedPassword = await this.authService.hashPassword(createAdminDto.password);

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

      const updateData: any = {};

      if (updateAdminDto.login) {
        updateData.login = updateAdminDto.login;
      }

      if (updateAdminDto.password) {
        updateData.password = await this.authService.hashPassword(updateAdminDto.password);
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
}

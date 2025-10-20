import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { HashService } from '../../shared/services/hash.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
  ) {}

  async create(adminId: string, createCompanyDto: CreateCompanyDto) {
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
    } catch (error) {
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        if (field === 'login') {
          throw new ConflictException('Login já está em uso');
        }
        if (field === 'cnpj') {
          throw new ConflictException('CNPJ já está em uso');
        }
        if (field === 'email') {
          throw new ConflictException('Email já está em uso');
        }
      }
      this.logger.error('Error creating company:', error);
      throw error;
    }
  }

  async findAll(adminId?: string) {
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

  async findOne(id: string) {
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
      throw new NotFoundException('Empresa não encontrada');
    }

    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    try {
      const existingCompany = await this.prisma.company.findUnique({
        where: { id },
      });

      if (!existingCompany) {
        throw new NotFoundException('Empresa não encontrada');
      }

      const updateData: any = { ...updateCompanyDto };

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
    } catch (error) {
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        if (field === 'login') {
          throw new ConflictException('Login já está em uso');
        }
        if (field === 'cnpj') {
          throw new ConflictException('CNPJ já está em uso');
        }
        if (field === 'email') {
          throw new ConflictException('Email já está em uso');
        }
      }
      this.logger.error('Error updating company:', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const existingCompany = await this.prisma.company.findUnique({
        where: { id },
      });

      if (!existingCompany) {
        throw new NotFoundException('Empresa não encontrada');
      }

      await this.prisma.company.delete({
        where: { id },
      });

      this.logger.log(`Company deleted: ${id}`);
      return { message: 'Empresa removida com sucesso' };
    } catch (error) {
      this.logger.error('Error deleting company:', error);
      throw error;
    }
  }

  async getCompanyStats(id: string) {
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
      throw new NotFoundException('Empresa não encontrada');
    }

    // Calculate total sales value
    const totalSales = await this.prisma.sale.aggregate({
      where: { companyId: id },
      _sum: {
        total: true,
      },
    });

    // Calculate pending bills
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

  async activate(id: string) {
    try {
      const existingCompany = await this.prisma.company.findUnique({
        where: { id },
      });

      if (!existingCompany) {
        throw new NotFoundException('Empresa não encontrada');
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
    } catch (error) {
      this.logger.error('Error activating company:', error);
      throw error;
    }
  }

  async deactivate(id: string) {
    try {
      const existingCompany = await this.prisma.company.findUnique({
        where: { id },
      });

      if (!existingCompany) {
        throw new NotFoundException('Empresa não encontrada');
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
    } catch (error) {
      this.logger.error('Error deactivating company:', error);
      throw error;
    }
  }
}

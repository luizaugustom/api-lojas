import { Injectable, ConflictException, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { HashService } from '../../shared/services/hash.service';
import { EncryptionService } from '../../shared/services/encryption.service';
import { ValidationService } from '../../shared/services/validation.service';
import { UploadService } from '../upload/upload.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateFiscalConfigDto } from './dto/update-fiscal-config.dto';
import { UpdateCatalogPageDto } from './dto/update-catalog-page.dto';
import { PlanType, DataPeriodFilter } from '@prisma/client';
import axios from 'axios';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly encryptionService: EncryptionService,
    private readonly validationService: ValidationService,
    private readonly uploadService: UploadService,
  ) {}

  async create(adminId: string, createCompanyDto: CreateCompanyDto) {
    try {
      // Validar CNPJ com dígitos verificadores
      this.validationService.validateCNPJ(createCompanyDto.cnpj);
      
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
          plan: true,
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
      // Verificar se é erro de enum inválido
      if (error.code === 'P2003' || error.message?.includes('PlanType') || error.message?.includes('TRIAL_7_DAYS')) {
        this.logger.error('Erro ao criar empresa: Enum PlanType não inclui TRIAL_7_DAYS. Aplique a migration do banco de dados.', error);
        throw new BadRequestException(
          'Erro: O plano TRIAL_7_DAYS não está disponível no banco de dados. Por favor, aplique a migration do Prisma: npx prisma migrate deploy'
        );
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
        plan: true,
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
        plan: true,
        isActive: true,
        defaultDataPeriod: true,
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

  async updateDataPeriod(id: string, dataPeriod: DataPeriodFilter) {
    const updated = await this.prisma.company.update({
      where: { id },
      data: {
        defaultDataPeriod: dataPeriod,
      },
      select: {
        id: true,
        defaultDataPeriod: true,
      },
    });

    this.logger.log(`Company ${id} updated default data period to ${updated.defaultDataPeriod}`);

    return {
      message: 'Período padrão atualizado com sucesso',
      dataPeriod: updated.defaultDataPeriod,
    };
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    try {
      const existingCompany = await this.prisma.company.findUnique({
        where: { id },
      });

      if (!existingCompany) {
        throw new NotFoundException('Empresa não encontrada');
      }

      // Validar CNPJ se fornecido
      if (updateCompanyDto.cnpj) {
        this.validationService.validateCNPJ(updateCompanyDto.cnpj);
      }

      const updateData: any = { ...updateCompanyDto };

      // Remove password field if empty or undefined
      if (!updateCompanyDto.password || updateCompanyDto.password.trim() === '') {
        delete updateData.password;
      } else {
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
          plan: true,
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
          plan: true,
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
          plan: true,
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

  /**
   * Atualizar configurações fiscais da empresa
   */
  async updateFiscalConfig(companyId: string, updateFiscalConfigDto: UpdateFiscalConfigDto) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      // Validar CNAE se fornecido
      if (updateFiscalConfigDto.cnae) {
        this.validationService.validateCNAE(updateFiscalConfigDto.cnae);
      }

      // Validar código IBGE se fornecido
      if (updateFiscalConfigDto.municipioIbge) {
        this.validationService.validateMunicipioIBGE(updateFiscalConfigDto.municipioIbge);
      }

      // Preparar dados para atualização
      const updateData: any = {};

      // Campos que vão sem criptografia
      if (updateFiscalConfigDto.taxRegime !== undefined) {
        updateData.taxRegime = updateFiscalConfigDto.taxRegime;
      }

      if (updateFiscalConfigDto.cnae !== undefined) {
        updateData.cnae = updateFiscalConfigDto.cnae;
      }

      if (updateFiscalConfigDto.nfceSerie !== undefined) {
        updateData.nfceSerie = updateFiscalConfigDto.nfceSerie;
      }

      if (updateFiscalConfigDto.municipioIbge !== undefined) {
        updateData.municipioIbge = updateFiscalConfigDto.municipioIbge;
      }

      if (updateFiscalConfigDto.idTokenCsc !== undefined) {
        updateData.idTokenCsc = updateFiscalConfigDto.idTokenCsc;
      }

      // Campos sensíveis - criptografar
      if (updateFiscalConfigDto.certificatePassword) {
        updateData.certificatePassword = this.encryptionService.encrypt(
          updateFiscalConfigDto.certificatePassword
        );
      }

      if (updateFiscalConfigDto.csc) {
        updateData.csc = this.encryptionService.encrypt(updateFiscalConfigDto.csc);
      }

      // Atualizar no banco
      const updatedCompany = await this.prisma.company.update({
        where: { id: companyId },
        data: updateData,
        select: {
          id: true,
          name: true,
          cnpj: true,
          stateRegistration: true,
          nfceSerie: true,
          municipioIbge: true,
          idTokenCsc: true,
          // Não retornar dados sensíveis
        },
      });

      this.logger.log(`Fiscal config updated for company: ${companyId}`);
      return {
        ...updatedCompany,
        message: 'Configurações fiscais atualizadas com sucesso',
      };
    } catch (error) {
      this.logger.error('Error updating fiscal config:', error);
      throw error;
    }
  }

  /**
   * Obter configurações fiscais (com dados sensíveis mascarados)
   */
  async getFiscalConfig(companyId: string) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          name: true,
          cnpj: true,
          stateRegistration: true,
          municipalRegistration: true,
          state: true,
          city: true,
          taxRegime: true,
          cnae: true,
          certificatePassword: true,
          nfceSerie: true,
          municipioIbge: true,
          csc: true,
          idTokenCsc: true,
        },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      // Mascarar dados sensíveis
      return {
        id: company.id,
        name: company.name,
        cnpj: company.cnpj,
        stateRegistration: company.stateRegistration,
        municipalRegistration: company.municipalRegistration,
        state: company.state,
        city: company.city,
        taxRegime: company.taxRegime,
        cnae: company.cnae,
        hasCertificatePassword: !!company.certificatePassword,
        certificatePasswordMasked: company.certificatePassword
          ? this.encryptionService.mask('********')
          : null,
        nfceSerie: company.nfceSerie,
        municipioIbge: company.municipioIbge,
        hasCsc: !!company.csc,
        cscMasked: company.csc ? this.encryptionService.mask('********') : null,
        idTokenCsc: company.idTokenCsc,
      };
    } catch (error) {
      this.logger.error('Error getting fiscal config:', error);
      throw error;
    }
  }

  /**
   * Verifica se a empresa tem configuração fiscal válida para emissão de NFCe
   */
  async hasValidFiscalConfig(companyId: string): Promise<boolean> {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: {
          cnpj: true,
          stateRegistration: true,
          certificatePassword: true,
          nfceSerie: true,
          municipioIbge: true,
          csc: true,
          idTokenCsc: true,
          state: true,
          city: true,
        },
      });

      if (!company) {
        return false;
      }

      // Verificar campos obrigatórios para emissão de NFCe
      const hasRequiredFields = !!(
        company.cnpj &&
        company.stateRegistration &&
        company.certificatePassword &&
        company.nfceSerie &&
        company.municipioIbge &&
        company.csc &&
        company.idTokenCsc &&
        company.state &&
        company.city
      );

      return hasRequiredFields;
    } catch (error) {
      this.logger.error('Error checking fiscal config:', error);
      return false;
    }
  }

  /**
   * Upload do certificado digital para o Focus NFe
   */
  async uploadCertificateToFocusNfe(companyId: string, file: Express.Multer.File) {
    try {
      // Validar arquivo
      if (!file) {
        throw new BadRequestException('Arquivo de certificado é obrigatório');
      }

      // Validar extensão
      if (!file.originalname.endsWith('.pfx') && !file.originalname.endsWith('.p12')) {
        throw new BadRequestException('Arquivo deve ser .pfx ou .p12');
      }

      // Buscar dados da empresa
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: {
          cnpj: true,
          certificatePassword: true,
          admin: {
            select: {
              focusNfeApiKey: true,
              focusNfeEnvironment: true,
            },
          },
        },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      if (!company.admin.focusNfeApiKey) {
        throw new BadRequestException('API Key do Focus NFe não configurada. Solicite ao administrador.');
      }

      if (!company.certificatePassword) {
        throw new BadRequestException('Configure a senha do certificado antes de fazer upload');
      }

      // Descriptografar senha do certificado
      const certificatePassword = this.encryptionService.decrypt(company.certificatePassword);

      // Preparar dados para envio
      const formData = new FormData();
      formData.append('certificado', file.buffer, {
        filename: file.originalname,
        contentType: 'application/x-pkcs12',
      });
      formData.append('senha', certificatePassword);

      // Determinar URL base
      const baseUrl = company.admin.focusNfeEnvironment === 'production'
        ? 'https://api.focusnfe.com.br'
        : 'https://homologacao.focusnfe.com.br';

      // Enviar para Focus NFe
      const response = await axios.post(
        `${baseUrl}/v2/empresas/${company.cnpj.replace(/\D/g, '')}/certificado`,
        formData,
        {
          headers: {
            'Authorization': company.admin.focusNfeApiKey,
            ...formData.getHeaders(),
          },
          timeout: 30000, // 30 segundos
        }
      );

      this.logger.log(`Certificado enviado ao Focus NFe para empresa: ${companyId}`);
      
      return {
        message: 'Certificado enviado com sucesso ao Focus NFe!',
        status: 'success',
        focusNfeResponse: response.data,
      };
    } catch (error: any) {
      // Se já é uma exceção do NestJS, propagar diretamente
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Erro ao enviar certificado ao Focus NFe:', error);
      
      if (error.response?.data) {
        // Erro da API Focus NFe
        const focusError = error.response.data;
        throw new BadRequestException(
          focusError.mensagem || 
          focusError.message || 
          'Erro ao enviar certificado ao Focus NFe'
        );
      }
      
      throw new BadRequestException(
        error.message || 'Erro ao enviar certificado ao Focus NFe'
      );
    }
  }

  /**
   * Upload do logo da empresa
   */
  async uploadLogo(companyId: string, file: Express.Multer.File) {
    try {
      // Validar se a empresa existe
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true, logoUrl: true },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      // Validar arquivo
      this.validateLogoFile(file);

      // Se já existe um logo, remover o antigo
      if (company.logoUrl) {
        await this.removeLogoFile(company.logoUrl);
      }

      // Fazer upload do novo logo
      const logoUrl = await this.uploadService.uploadFile(file, 'logos');

      // Atualizar no banco de dados
      await this.prisma.company.update({
        where: { id: companyId },
        data: { logoUrl },
      });

      this.logger.log(`Logo uploaded for company ${companyId}: ${logoUrl}`);

      return {
        success: true,
        logoUrl,
        message: 'Logo enviado com sucesso',
      };
    } catch (error) {
      this.logger.error('Error uploading logo:', error);
      throw error;
    }
  }

  /**
   * Remover logo da empresa
   */
  async removeLogo(companyId: string) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true, logoUrl: true },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      if (!company.logoUrl) {
        throw new BadRequestException('Empresa não possui logo');
      }

      // Remover arquivo do sistema
      await this.removeLogoFile(company.logoUrl);

      // Atualizar no banco de dados
      await this.prisma.company.update({
        where: { id: companyId },
        data: { logoUrl: null },
      });

      this.logger.log(`Logo removed for company ${companyId}`);

      return {
        success: true,
        message: 'Logo removido com sucesso',
      };
    } catch (error) {
      this.logger.error('Error removing logo:', error);
      throw error;
    }
  }

  /**
   * Validar arquivo de logo
   */
  private validateLogoFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    // Validar tipo de arquivo
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido. Apenas imagens são aceitas.');
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Arquivo muito grande. Tamanho máximo permitido: 5MB');
    }
  }

  /**
   * Remover arquivo de logo do sistema de arquivos
   */
  private async removeLogoFile(logoUrl: string) {
    try {
      // Extrair o caminho do arquivo da URL
      const fileName = logoUrl.split('/').pop();
      if (!fileName) return;

      const filePath = path.join(process.cwd(), 'uploads', 'logos', fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Logo file removed: ${filePath}`);
      }
    } catch (error) {
      this.logger.warn(`Error removing logo file: ${error.message}`);
      // Não falhar se não conseguir remover o arquivo
    }
  }

  /**
   * Ativar/desativar envio automático de mensagens de cobrança
   */
  async toggleAutoMessages(companyId: string, enabled: boolean) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true, autoMessageEnabled: true },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      const updatedCompany = await this.prisma.company.update({
        where: { id: companyId },
        data: { autoMessageEnabled: enabled },
        select: {
          id: true,
          name: true,
          autoMessageEnabled: true,
        },
      });

      this.logger.log(
        `Envio automático de mensagens ${enabled ? 'ativado' : 'desativado'} para empresa ${companyId}`
      );

      return {
        success: true,
        autoMessageEnabled: updatedCompany.autoMessageEnabled,
        message: `Envio automático de mensagens de cobrança ${
          enabled ? 'ativado' : 'desativado'
        } com sucesso!`,
      };
    } catch (error) {
      this.logger.error('Error toggling auto messages:', error);
      throw error;
    }
  }

  /**
   * Obter status do envio automático de mensagens
   */
  async getAutoMessageStatus(companyId: string) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          name: true,
          autoMessageEnabled: true,
        },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      // Contar parcelas não pagas com mensagens enviadas
      const stats = await this.prisma.installment.aggregate({
        where: {
          companyId,
          isPaid: false,
        },
        _count: {
          id: true,
        },
        _sum: {
          messageCount: true,
        },
      });

      return {
        autoMessageEnabled: company.autoMessageEnabled,
        totalUnpaidInstallments: stats._count.id || 0,
        totalMessagesSent: stats._sum.messageCount || 0,
      };
    } catch (error) {
      this.logger.error('Error getting auto message status:', error);
      throw error;
    }
  }

  /**
   * Atualizar configurações da página de catálogo
   */
  async updateCatalogPage(companyId: string, updateCatalogPageDto: UpdateCatalogPageDto) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true, catalogPageUrl: true, catalogPageEnabled: true },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      const updateData: any = {};

      // Validar URL única se estiver sendo alterada
      if (updateCatalogPageDto.catalogPageUrl !== undefined) {
        if (updateCatalogPageDto.catalogPageUrl) {
          // Verificar se a URL já está em uso por outra empresa
          const existingCompany = await this.prisma.company.findFirst({
            where: {
              catalogPageUrl: updateCatalogPageDto.catalogPageUrl,
              id: { not: companyId },
            },
          });

          if (existingCompany) {
            throw new ConflictException(
              `A URL "${updateCatalogPageDto.catalogPageUrl}" já está em uso por outra empresa`
            );
          }
        }
        updateData.catalogPageUrl = updateCatalogPageDto.catalogPageUrl;
      }

      if (updateCatalogPageDto.catalogPageEnabled !== undefined) {
        updateData.catalogPageEnabled = updateCatalogPageDto.catalogPageEnabled;
      }

      const updatedCompany = await this.prisma.company.update({
        where: { id: companyId },
        data: updateData,
        select: {
          id: true,
          name: true,
          catalogPageUrl: true,
          catalogPageEnabled: true,
        },
      });

      this.logger.log(`Catalog page updated for company ${companyId}: ${JSON.stringify(updateData)}`);

      return {
        success: true,
        ...updatedCompany,
        message: 'Configurações da página de catálogo atualizadas com sucesso!',
      };
    } catch (error) {
      this.logger.error('Error updating catalog page:', error);
      throw error;
    }
  }

  /**
   * Obter configurações da página de catálogo
   */
  async getCatalogPageConfig(companyId: string) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          name: true,
          catalogPageUrl: true,
          catalogPageEnabled: true,
        },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      return {
        catalogPageUrl: company.catalogPageUrl,
        catalogPageEnabled: company.catalogPageEnabled,
        pageUrl: company.catalogPageUrl
          ? `/catalogo/${company.catalogPageUrl}`
          : null,
      };
    } catch (error) {
      this.logger.error('Error getting catalog page config:', error);
      throw error;
    }
  }

  /**
   * Obter dados públicos do catálogo por URL
   */
  async getPublicCatalogData(url: string) {
    try {
      const company = await this.prisma.company.findFirst({
        where: {
          catalogPageUrl: url,
          catalogPageEnabled: true,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          logoUrl: true,
          brandColor: true,
          plan: true,
          street: true,
          number: true,
          district: true,
          city: true,
          state: true,
          zipCode: true,
          complement: true,
          products: {
            where: {
              stockQuantity: {
                gt: 0, // Apenas produtos com estoque
              },
            },
            select: {
              id: true,
              name: true,
              photos: true,
              price: true,
              stockQuantity: true,
              size: true,
              category: true,
            },
            orderBy: {
              name: 'asc',
            },
          },
        },
      });

      if (!company) {
        throw new NotFoundException(
          'Página de catálogo não encontrada ou não está habilitada'
        );
      }

      // Verificar se a empresa tem plano PRO
      if (company.plan !== PlanType.PRO) {
        throw new NotFoundException(
          'O catálogo público está disponível apenas para empresas com plano PRO'
        );
      }

      // Formatar endereço completo
      const addressParts = [
        company.street,
        company.number,
        company.district,
        company.city,
        company.state,
        company.zipCode,
      ].filter(Boolean);

      const fullAddress = addressParts.join(', ');

      return {
        company: {
          id: company.id,
          name: company.name,
          phone: company.phone,
          email: company.email,
          logoUrl: company.logoUrl,
          brandColor: company.brandColor,
          address: fullAddress,
        },
        products: company.products.map((product) => ({
          ...product,
          price: product.price.toString(),
        })),
      };
    } catch (error) {
      this.logger.error('Error getting public catalog data:', error);
      throw error;
    }
  }
}

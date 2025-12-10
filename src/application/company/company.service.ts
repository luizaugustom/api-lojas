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
import { UpdateFocusNfeConfigDto } from './dto/update-focus-nfe-config.dto';
import { PlanType, DataPeriodFilter } from '@prisma/client';
import axios from 'axios';
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
          brandColor: true,
          logoUrl: true,
          maxProducts: true,
          maxCustomers: true,
          maxSellers: true,
          maxPhotosPerProduct: true,
          photoUploadEnabled: true,
          nfceEmissionEnabled: true,
          nfeEmissionEnabled: true,
          catalogPageAllowed: true,
          autoMessageAllowed: true,
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
        brandColor: true,
        logoUrl: true,
        maxProducts: true,
        maxCustomers: true,
        maxSellers: true,
        maxPhotosPerProduct: true,
        photoUploadEnabled: true,
        nfceEmissionEnabled: true,
        nfeEmissionEnabled: true,
        catalogPageAllowed: true,
        autoMessageAllowed: true,
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
        // Plan Limits Configuration
        maxProducts: true,
        maxCustomers: true,
        maxSellers: true,
        photoUploadEnabled: true,
        maxPhotosPerProduct: true,
        nfceEmissionEnabled: true,
        nfeEmissionEnabled: true,
        // Feature Permissions
        catalogPageAllowed: true,
        autoMessageAllowed: true,
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
          brandColor: true,
          logoUrl: true,
          maxProducts: true,
          maxCustomers: true,
          maxSellers: true,
          maxPhotosPerProduct: true,
          photoUploadEnabled: true,
          nfceEmissionEnabled: true,
          nfeEmissionEnabled: true,
          catalogPageAllowed: true,
          autoMessageAllowed: true,
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

      if (updateFiscalConfigDto.stateRegistration !== undefined) {
        updateData.stateRegistration = updateFiscalConfigDto.stateRegistration;
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

      if (updateFiscalConfigDto.certificateFileUrl !== undefined) {
        updateData.certificateFileUrl = updateFiscalConfigDto.certificateFileUrl;
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
          certificateFileUrl: true,
          nfceSerie: true,
          municipioIbge: true,
          csc: true,
          idTokenCsc: true,
          focusNfeApiKey: true,
          focusNfeEnvironment: true,
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
        certificateFileUrl: company.certificateFileUrl,
        nfceSerie: company.nfceSerie,
        municipioIbge: company.municipioIbge,
        hasCsc: !!company.csc,
        cscMasked: company.csc ? this.encryptionService.mask('********') : null,
        idTokenCsc: company.idTokenCsc,
        // Informações sobre configuração do Focus NFe (empresa ou admin como fallback)
        hasFocusNfeApiKey: !!(company.focusNfeApiKey || company.admin.focusNfeApiKey),
        adminHasFocusNfeApiKey: !!company.admin.focusNfeApiKey,
        focusNfeEnvironment: company.focusNfeEnvironment || company.admin.focusNfeEnvironment || 'sandbox',
      };
    } catch (error) {
      this.logger.error('Error getting fiscal config:', error);
      throw error;
    }
  }

  /**
   * Obter configurações fiscais completas para admin (sem mascaramento)
   */
  async getFiscalConfigForAdmin(companyId: string) {
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
          certificateFileUrl: true,
          nfceSerie: true,
          municipioIbge: true,
          csc: true,
          idTokenCsc: true,
          focusNfeApiKey: true,
          focusNfeEnvironment: true,
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

      // Descriptografar dados sensíveis para admin
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
        certificatePassword: company.certificatePassword
          ? this.encryptionService.decrypt(company.certificatePassword)
          : null,
        certificateFileUrl: company.certificateFileUrl,
        nfceSerie: company.nfceSerie,
        municipioIbge: company.municipioIbge,
        csc: company.csc ? this.encryptionService.decrypt(company.csc) : null,
        idTokenCsc: company.idTokenCsc,
        focusNfeApiKey: company.focusNfeApiKey || company.admin.focusNfeApiKey,
        focusNfeEnvironment: company.focusNfeEnvironment || company.admin.focusNfeEnvironment || 'sandbox',
      };
    } catch (error) {
      this.logger.error('Error getting fiscal config for admin:', error);
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
   * Testa a conexão com o Focus NFe
   */
  async testFocusNfeConnection(companyId: string) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: {
          cnpj: true,
          name: true,
          focusNfeApiKey: true,
          focusNfeEnvironment: true,
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

      // Usar configuração da empresa, com fallback para admin
      const apiKey = company.focusNfeApiKey || company.admin.focusNfeApiKey;
      const environment = company.focusNfeEnvironment || company.admin.focusNfeEnvironment || 'sandbox';

      if (!apiKey) {
        return {
          success: false,
          message: 'API Key do Focus NFe não configurada. Configure na página de empresas.',
        };
      }

      const cnpjNumeros = company.cnpj.replace(/\D/g, '');
      const baseUrl = environment === 'production'
        ? 'https://api.focusnfe.com.br'
        : 'https://homologacao.focusnfe.com.br';

      this.logger.log(`Testando conexão com Focus NFe - CNPJ: ${cnpjNumeros}, Ambiente: ${environment}`);

      try {
        const response = await axios.get(
          `${baseUrl}/v2/empresas?cnpj=${cnpjNumeros}`,
          {
            auth: {
              username: apiKey,
              password: '',
            },
            timeout: 10000,
          }
        );

        return {
          success: true,
          message: 'Conexão com Focus NFe estabelecida com sucesso',
          empresaCadastrada: response.data && response.data.length > 0,
          ambiente: environment,
          dados: response.data,
        };
      } catch (error: any) {
        this.logger.error('Erro ao testar conexão com Focus NFe:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });

        return {
          success: false,
          message: `Erro na comunicação com Focus NFe: ${error.message}`,
          detalhe: error.response?.data,
          status: error.response?.status,
        };
      }
    } catch (error) {
      this.logger.error('Erro ao testar conexão:', error);
      throw error;
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

      // Validar tamanho do arquivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException('Arquivo muito grande. Tamanho máximo: 10MB');
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
          certificateFileUrl: true,
          name: true,
          email: true,
          phone: true,
          stateRegistration: true,
          municipalRegistration: true,
          taxRegime: true,
          zipCode: true,
          state: true,
          city: true,
          district: true,
          street: true,
          number: true,
          complement: true,
          focusNfeApiKey: true,
          focusNfeEnvironment: true,
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

      // Usar configuração da empresa, com fallback para admin
      const apiKey = company.focusNfeApiKey || company.admin.focusNfeApiKey;
      const environment = company.focusNfeEnvironment || company.admin.focusNfeEnvironment || 'sandbox';

      if (!apiKey) {
        throw new BadRequestException('API Key do Focus NFe não configurada. Configure na página de empresas.');
      }

      if (!company.certificatePassword) {
        throw new BadRequestException('Configure a senha do certificado antes de fazer upload');
      }

      // Validar CNPJ
      const cnpjNumeros = company.cnpj.replace(/\D/g, '');
      if (cnpjNumeros.length !== 14) {
        throw new BadRequestException('CNPJ inválido');
      }

      // Descriptografar senha do certificado
      const certificatePassword = this.encryptionService.decrypt(company.certificatePassword);

      this.logger.log(`Preparando upload do certificado - Arquivo: ${file.originalname}, Tamanho: ${file.size} bytes`);

      // Fazer upload do certificado para Firebase Storage e salvar URL no banco
      let certificateFileUrl: string | null = null;
      try {
        // Buscar empresa novamente para pegar certificateFileUrl atual
        const companyWithCert = await this.prisma.company.findUnique({
          where: { id: companyId },
          select: { certificateFileUrl: true },
        });

        // Se já existe um certificado, remover o antigo
        if (companyWithCert?.certificateFileUrl) {
          try {
            await this.uploadService.deleteFile(companyWithCert.certificateFileUrl);
            this.logger.log(`Certificado antigo removido: ${companyWithCert.certificateFileUrl}`);
          } catch (error) {
            this.logger.warn('Erro ao remover certificado antigo:', error);
          }
        }

        // Fazer upload do novo certificado
        certificateFileUrl = await this.uploadService.uploadFile(file, 'certificates');
        
        // Atualizar URL do certificado no banco
        await this.prisma.company.update({
          where: { id: companyId },
          data: { certificateFileUrl },
        });

        this.logger.log(`Certificado salvo no storage: ${certificateFileUrl}`);
      } catch (error) {
        this.logger.error('Erro ao fazer upload do certificado para storage:', error);
        // Continuar mesmo se falhar o upload para storage, pois ainda precisa enviar para Focus NFe
      }

      // Converter o buffer do arquivo para base64
      const certificadoBase64 = file.buffer.toString('base64');

      // Determinar URL base
      const baseUrl = environment === 'production'
        ? 'https://api.focusnfe.com.br'
        : 'https://homologacao.focusnfe.com.br';

      this.logger.log(`Enviando certificado para Focus NFe - CNPJ: ${company.cnpj}, Ambiente: ${environment}`);

      // PASSO 1: Buscar ID da empresa no Focus NFe usando o CNPJ
      this.logger.log(`Buscando empresa no Focus NFe por CNPJ: ${cnpjNumeros}`);
      
      let empresaId: string | null = null;
      
      try {
        const consultaResponse = await axios.get(
          `${baseUrl}/v2/empresas?cnpj=${cnpjNumeros}`,
          {
            auth: {
              username: apiKey,
              password: '',
            },
            timeout: 30000,
          }
        );

        const empresas = consultaResponse.data;
        
        if (empresas && Array.isArray(empresas) && empresas.length > 0) {
          empresaId = empresas[0].id;
          this.logger.log(`✅ Empresa encontrada no Focus NFe! ID: ${empresaId}`);
        } else {
          this.logger.warn(`⚠️ Empresa não encontrada no Focus NFe`);
        }
        
      } catch (consultaError: any) {
        this.logger.error('Erro ao consultar empresa:', {
          message: consultaError.message,
          response: consultaError.response?.data,
          status: consultaError.response?.status,
        });
      }

      // PASSO 2: Se empresa não existe, mostrar mensagem de erro
      if (!empresaId) {
        throw new BadRequestException(
          `❌ EMPRESA NÃO CADASTRADA NO FOCUS NFE\n\n` +
          `O CNPJ ${company.cnpj} não foi encontrado no Focus NFe.\n\n` +
          `📋 AÇÃO NECESSÁRIA:\n` +
          `1. Acesse o painel Focus NFe: https://app.focusnfe.com.br\n` +
          `2. Faça login com a API Key: sZpZRkLG1uzJk7ge73fkBdSlXLMD4ZUi\n` +
          `3. Vá em "Empresas" → "Nova Empresa"\n` +
          `4. Cadastre a empresa:\n` +
          `   • CNPJ: ${company.cnpj}\n` +
          `   • Razão Social: ${company.name}\n` +
          `   • Inscrição Estadual: ${company.stateRegistration || '(não informada)'}\n` +
          `   • Endereço completo\n` +
          `   • Regime tributário\n` +
          `5. Marque "Habilita NFe" e "Habilita NFCe"\n` +
          `6. Após cadastrar, volte aqui e faça upload do certificado\n\n` +
          `⚠️ O cadastro de empresas emitentes no Focus NFe é MANUAL pelo painel.`
        );
      }

      // PASSO 3: Atualizar empresa com o certificado
      this.logger.log(`Enviando certificado para empresa ID: ${empresaId}`);
      
      const certificadoPayload = {
        arquivo_certificado_base64: certificadoBase64,
        senha_certificado: certificatePassword,
      };

      let response;
      
      try {
        response = await axios.put(
          `${baseUrl}/v2/empresas/${empresaId}`,
          certificadoPayload,
          {
            auth: {
              username: apiKey,
              password: '',
            },
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );

        this.logger.log('✅ Certificado enviado com sucesso!');
        this.logger.log(`Response: ${JSON.stringify(response.data)}`);

        return {
          success: true,
          message: 'Certificado enviado com sucesso para o Focus NFe',
          empresaId: empresaId,
          data: response.data,
        };

      } catch (error: any) {
        this.logger.error('Erro ao enviar certificado:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          url: error.config?.url,
        });

        throw new BadRequestException(
          `Erro ao enviar certificado: ${error.response?.data?.mensagem || error.message}`
        );
      }

      // Código antigo removido
      if (false) {
        // Criar nova empresa no Focus NFe
        this.logger.log(`Criando empresa no Focus NFe - CNPJ: ${cnpjNumeros}, Nome: ${company.name}`);
        
        // Mapear regime tributário
        const regimeTributarioMap = {
          'SIMPLES_NACIONAL': 1,
          'SIMPLES_NACIONAL_EXCESSO': 2,
          'REGIME_NORMAL': 3,
          'MEI': 4,
        };
        
        const empresaPayload: any = {
          nome: company.name,
          cnpj: cnpjNumeros,
          arquivo_certificado_base64: certificadoBase64,
          senha_certificado: certificatePassword,
          habilita_nfce: true,
          habilita_nfe: true,
        };

        // Adicionar campos obrigatórios e opcionais
        if (company.email) empresaPayload.email = company.email;
        if (company.phone) empresaPayload.telefone = company.phone.replace(/\D/g, '');
        if (company.stateRegistration) empresaPayload.inscricao_estadual = company.stateRegistration;
        if (company.municipalRegistration) empresaPayload.inscricao_municipal = company.municipalRegistration;
        if (company.taxRegime) empresaPayload.regime_tributario = regimeTributarioMap[company.taxRegime] || 1;
        if (company.street) empresaPayload.logradouro = company.street;
        if (company.number) empresaPayload.numero = company.number;
        if (company.complement) empresaPayload.complemento = company.complement;
        if (company.district) empresaPayload.bairro = company.district;
        if (company.city) empresaPayload.municipio = company.city;
        if (company.state) empresaPayload.uf = company.state;
        if (company.zipCode) empresaPayload.cep = company.zipCode.replace(/\D/g, '');
        
        try {
          response = await axios.post(
            `${baseUrl}/v2/empresas`,
            empresaPayload,
            {
              auth: {
                username: apiKey,
                password: '',
              },
              headers: {
                'Content-Type': 'application/json',
              },
              timeout: 30000,
            }
          );

          this.logger.log('Empresa criada com sucesso no Focus NFe');
          this.logger.log(`Response data: ${JSON.stringify(response.data)}`);
        } catch (createError: any) {
          this.logger.error('Erro ao criar empresa no Focus NFe:', {
            message: createError.message,
            response: createError.response?.data,
            status: createError.response?.status,
            url: `${baseUrl}/v2/empresas`,
          });
          throw new BadRequestException(
            `Erro ao criar empresa: ${createError.response?.data?.mensagem || createError.message}`
          );
        }
      } else {
        // Atualizar empresa existente com o certificado
        this.logger.log(`Atualizando certificado da empresa existente - ID: ${empresaId}`);
        
        try {
          response = await axios.put(
            `${baseUrl}/v2/empresas/${empresaId}`,
            {
              arquivo_certificado_base64: certificadoBase64,
              senha_certificado: certificatePassword,
            },
            {
              auth: {
                username: apiKey,
                password: '',
              },
              headers: {
                'Content-Type': 'application/json',
              },
              timeout: 30000,
            }
          );

          this.logger.log(`Certificado atualizado com sucesso no Focus NFe`);
        } catch (updateError: any) {
          this.logger.error('Erro ao atualizar certificado no Focus NFe:', {
            message: updateError.message,
            response: updateError.response?.data,
            status: updateError.response?.status,
            url: `${baseUrl}/v2/empresas/${empresaId}`,
          });
          throw new BadRequestException(
            `Erro ao enviar certificado: ${updateError.response?.data?.mensagem || updateError.message}`
          );
        }
      }

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

      this.logger.error('Erro ao enviar certificado ao Focus NFe:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        url: error.config?.url,
        method: error.config?.method,
        stack: error.stack,
      });
      
      if (error.response?.data) {
        // Erro da API Focus NFe
        const focusError = error.response.data;
        const errorMessage = focusError.mensagem || 
                           focusError.message || 
                           focusError.erros?.[0]?.mensagem ||
                           JSON.stringify(focusError);
        
        throw new BadRequestException(
          `Erro do Focus NFe: ${errorMessage}`
        );
      }
      
      throw new BadRequestException(
        `Erro ao enviar certificado: ${error.message || 'Erro desconhecido'}`
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
        select: { id: true, name: true, autoMessageEnabled: true, autoMessageAllowed: true },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      // Validar se a empresa tem permissão para usar mensagens automáticas
      if (enabled && !company.autoMessageAllowed) {
        throw new BadRequestException(
          'A empresa não tem permissão para usar mensagens automáticas de cobrança. Entre em contato com o administrador.'
        );
      }

      const updatedCompany = await this.prisma.company.update({
        where: { id: companyId },
        data: { autoMessageEnabled: enabled },
        select: {
          id: true,
          name: true,
          autoMessageEnabled: true,
          autoMessageAllowed: true,
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
        select: { id: true, name: true, catalogPageUrl: true, catalogPageEnabled: true, catalogPageAllowed: true, plan: true },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      // Validar se a empresa tem permissão para usar catálogo digital
      if (updateCatalogPageDto.catalogPageEnabled === true) {
        // Verificar se catalogPageAllowed existe e é true
        if (company.catalogPageAllowed === false || company.catalogPageAllowed === null || company.catalogPageAllowed === undefined) {
          throw new BadRequestException(
            'A empresa não tem permissão para usar catálogo digital. Entre em contato com o administrador para autorizar esta funcionalidade.'
          );
        }
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
          catalogPageAllowed: true,
        },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      return {
        catalogPageUrl: company.catalogPageUrl,
        catalogPageEnabled: company.catalogPageEnabled,
        catalogPageAllowed: company.catalogPageAllowed ?? true, // Default para true se null/undefined
        pageUrl: company.catalogPageUrl
          ? `/catalog/${company.catalogPageUrl}`
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
          catalogPageAllowed: true,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          logoUrl: true,
          brandColor: true,
          plan: true,
          catalogPageAllowed: true,
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
              unitOfMeasure: true,
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

      // Verificar se a empresa tem permissão para usar catálogo digital
      if (!company.catalogPageAllowed) {
        throw new NotFoundException(
          'A empresa não tem permissão para usar catálogo digital. Entre em contato com o administrador.'
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

  /**
   * Atualizar configuração do Focus NFe da empresa (apenas admin)
   */
  async updateFocusNfeConfig(companyId: string, updateFocusNfeConfigDto: UpdateFocusNfeConfigDto) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
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

      const updatedCompany = await this.prisma.company.update({
        where: { id: companyId },
        data: updateData,
        select: {
          id: true,
          name: true,
          focusNfeApiKey: true,
          focusNfeEnvironment: true,
          ibptToken: true,
        },
      });

      this.logger.log(`Focus NFe config updated for company: ${companyId}`);
      return {
        id: updatedCompany.id,
        name: updatedCompany.name,
        hasFocusNfeApiKey: !!updatedCompany.focusNfeApiKey,
        focusNfeApiKey: updatedCompany.focusNfeApiKey
          ? this.encryptionService.mask(updatedCompany.focusNfeApiKey)
          : null,
        focusNfeEnvironment: updatedCompany.focusNfeEnvironment || 'sandbox',
        hasIbptToken: !!updatedCompany.ibptToken,
        ibptToken: updatedCompany.ibptToken
          ? this.encryptionService.mask(updatedCompany.ibptToken)
          : null,
        message: 'Configurações do Focus NFe atualizadas com sucesso',
      };
    } catch (error) {
      this.logger.error('Error updating Focus NFe config:', error);
      throw error;
    }
  }

  /**
   * Obter configuração do Focus NFe da empresa (dados sensíveis mascarados)
   */
  async getFocusNfeConfig(companyId: string) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          name: true,
          focusNfeApiKey: true,
          focusNfeEnvironment: true,
          ibptToken: true,
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

      // Usar configuração da empresa, com fallback para admin
      const apiKey = company.focusNfeApiKey || company.admin.focusNfeApiKey;
      const environment = company.focusNfeEnvironment || company.admin.focusNfeEnvironment || 'sandbox';

      return {
        id: company.id,
        name: company.name,
        hasFocusNfeApiKey: !!apiKey,
        focusNfeApiKey: apiKey ? this.encryptionService.mask(apiKey) : null,
        focusNfeEnvironment: environment,
        isUsingCompanyConfig: !!company.focusNfeApiKey,
        isUsingAdminConfig: !company.focusNfeApiKey && !!company.admin.focusNfeApiKey,
        hasIbptToken: !!company.ibptToken,
        ibptToken: company.ibptToken
          ? this.encryptionService.mask(company.ibptToken)
          : null,
      };
    } catch (error) {
      this.logger.error('Error getting Focus NFe config:', error);
      throw error;
    }
  }
}

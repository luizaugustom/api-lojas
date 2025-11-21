"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CompanyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const hash_service_1 = require("../../shared/services/hash.service");
const encryption_service_1 = require("../../shared/services/encryption.service");
const validation_service_1 = require("../../shared/services/validation.service");
const upload_service_1 = require("../upload/upload.service");
const client_1 = require("@prisma/client");
const axios_1 = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
let CompanyService = CompanyService_1 = class CompanyService {
    constructor(prisma, hashService, encryptionService, validationService, uploadService) {
        this.prisma = prisma;
        this.hashService = hashService;
        this.encryptionService = encryptionService;
        this.validationService = validationService;
        this.uploadService = uploadService;
        this.logger = new common_1.Logger(CompanyService_1.name);
    }
    async create(adminId, createCompanyDto) {
        try {
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
        }
        catch (error) {
            if (error.code === 'P2002') {
                const field = error.meta?.target?.[0];
                if (field === 'login') {
                    throw new common_1.ConflictException('Login já está em uso');
                }
                if (field === 'cnpj') {
                    throw new common_1.ConflictException('CNPJ já está em uso');
                }
                if (field === 'email') {
                    throw new common_1.ConflictException('Email já está em uso');
                }
            }
            if (error.code === 'P2003' || error.message?.includes('PlanType') || error.message?.includes('TRIAL_7_DAYS')) {
                this.logger.error('Erro ao criar empresa: Enum PlanType não inclui TRIAL_7_DAYS. Aplique a migration do banco de dados.', error);
                throw new common_1.BadRequestException('Erro: O plano TRIAL_7_DAYS não está disponível no banco de dados. Por favor, aplique a migration do Prisma: npx prisma migrate deploy');
            }
            this.logger.error('Error creating company:', error);
            throw error;
        }
    }
    async findAll(adminId) {
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
    async findOne(id) {
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
            throw new common_1.NotFoundException('Empresa não encontrada');
        }
        return company;
    }
    async updateDataPeriod(id, dataPeriod) {
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
    async update(id, updateCompanyDto) {
        try {
            const existingCompany = await this.prisma.company.findUnique({
                where: { id },
            });
            if (!existingCompany) {
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
            if (updateCompanyDto.cnpj) {
                this.validationService.validateCNPJ(updateCompanyDto.cnpj);
            }
            const updateData = { ...updateCompanyDto };
            if (!updateCompanyDto.password || updateCompanyDto.password.trim() === '') {
                delete updateData.password;
            }
            else {
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
        }
        catch (error) {
            if (error.code === 'P2002') {
                const field = error.meta?.target?.[0];
                if (field === 'login') {
                    throw new common_1.ConflictException('Login já está em uso');
                }
                if (field === 'cnpj') {
                    throw new common_1.ConflictException('CNPJ já está em uso');
                }
                if (field === 'email') {
                    throw new common_1.ConflictException('Email já está em uso');
                }
            }
            this.logger.error('Error updating company:', error);
            throw error;
        }
    }
    async remove(id) {
        try {
            const existingCompany = await this.prisma.company.findUnique({
                where: { id },
            });
            if (!existingCompany) {
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
            await this.prisma.company.delete({
                where: { id },
            });
            this.logger.log(`Company deleted: ${id}`);
            return { message: 'Empresa removida com sucesso' };
        }
        catch (error) {
            this.logger.error('Error deleting company:', error);
            throw error;
        }
    }
    async getCompanyStats(id) {
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
            throw new common_1.NotFoundException('Empresa não encontrada');
        }
        const totalSales = await this.prisma.sale.aggregate({
            where: { companyId: id },
            _sum: {
                total: true,
            },
        });
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
    async activate(id) {
        try {
            const existingCompany = await this.prisma.company.findUnique({
                where: { id },
            });
            if (!existingCompany) {
                throw new common_1.NotFoundException('Empresa não encontrada');
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
        }
        catch (error) {
            this.logger.error('Error activating company:', error);
            throw error;
        }
    }
    async deactivate(id) {
        try {
            const existingCompany = await this.prisma.company.findUnique({
                where: { id },
            });
            if (!existingCompany) {
                throw new common_1.NotFoundException('Empresa não encontrada');
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
        }
        catch (error) {
            this.logger.error('Error deactivating company:', error);
            throw error;
        }
    }
    async updateFiscalConfig(companyId, updateFiscalConfigDto) {
        try {
            const company = await this.prisma.company.findUnique({
                where: { id: companyId },
            });
            if (!company) {
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
            if (updateFiscalConfigDto.cnae) {
                this.validationService.validateCNAE(updateFiscalConfigDto.cnae);
            }
            if (updateFiscalConfigDto.municipioIbge) {
                this.validationService.validateMunicipioIBGE(updateFiscalConfigDto.municipioIbge);
            }
            const updateData = {};
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
            if (updateFiscalConfigDto.certificatePassword) {
                updateData.certificatePassword = this.encryptionService.encrypt(updateFiscalConfigDto.certificatePassword);
            }
            if (updateFiscalConfigDto.csc) {
                updateData.csc = this.encryptionService.encrypt(updateFiscalConfigDto.csc);
            }
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
                },
            });
            this.logger.log(`Fiscal config updated for company: ${companyId}`);
            return {
                ...updatedCompany,
                message: 'Configurações fiscais atualizadas com sucesso',
            };
        }
        catch (error) {
            this.logger.error('Error updating fiscal config:', error);
            throw error;
        }
    }
    async getFiscalConfig(companyId) {
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
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
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
        }
        catch (error) {
            this.logger.error('Error getting fiscal config:', error);
            throw error;
        }
    }
    async hasValidFiscalConfig(companyId) {
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
            const hasRequiredFields = !!(company.cnpj &&
                company.stateRegistration &&
                company.certificatePassword &&
                company.nfceSerie &&
                company.municipioIbge &&
                company.csc &&
                company.idTokenCsc &&
                company.state &&
                company.city);
            return hasRequiredFields;
        }
        catch (error) {
            this.logger.error('Error checking fiscal config:', error);
            return false;
        }
    }
    async uploadCertificateToFocusNfe(companyId, file) {
        try {
            if (!file) {
                throw new common_1.BadRequestException('Arquivo de certificado é obrigatório');
            }
            if (!file.originalname.endsWith('.pfx') && !file.originalname.endsWith('.p12')) {
                throw new common_1.BadRequestException('Arquivo deve ser .pfx ou .p12');
            }
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
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
            if (!company.admin.focusNfeApiKey) {
                throw new common_1.BadRequestException('API Key do Focus NFe não configurada. Solicite ao administrador.');
            }
            if (!company.certificatePassword) {
                throw new common_1.BadRequestException('Configure a senha do certificado antes de fazer upload');
            }
            const certificatePassword = this.encryptionService.decrypt(company.certificatePassword);
            const formData = new FormData();
            formData.append('certificado', file.buffer, {
                filename: file.originalname,
                contentType: 'application/x-pkcs12',
            });
            formData.append('senha', certificatePassword);
            const baseUrl = company.admin.focusNfeEnvironment === 'production'
                ? 'https://api.focusnfe.com.br'
                : 'https://homologacao.focusnfe.com.br';
            const response = await axios_1.default.post(`${baseUrl}/v2/empresas/${company.cnpj.replace(/\D/g, '')}/certificado`, formData, {
                headers: {
                    'Authorization': company.admin.focusNfeApiKey,
                    ...formData.getHeaders(),
                },
                timeout: 30000,
            });
            this.logger.log(`Certificado enviado ao Focus NFe para empresa: ${companyId}`);
            return {
                message: 'Certificado enviado com sucesso ao Focus NFe!',
                status: 'success',
                focusNfeResponse: response.data,
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error('Erro ao enviar certificado ao Focus NFe:', error);
            if (error.response?.data) {
                const focusError = error.response.data;
                throw new common_1.BadRequestException(focusError.mensagem ||
                    focusError.message ||
                    'Erro ao enviar certificado ao Focus NFe');
            }
            throw new common_1.BadRequestException(error.message || 'Erro ao enviar certificado ao Focus NFe');
        }
    }
    async uploadLogo(companyId, file) {
        try {
            const company = await this.prisma.company.findUnique({
                where: { id: companyId },
                select: { id: true, name: true, logoUrl: true },
            });
            if (!company) {
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
            this.validateLogoFile(file);
            if (company.logoUrl) {
                await this.removeLogoFile(company.logoUrl);
            }
            const logoUrl = await this.uploadService.uploadFile(file, 'logos');
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
        }
        catch (error) {
            this.logger.error('Error uploading logo:', error);
            throw error;
        }
    }
    async removeLogo(companyId) {
        try {
            const company = await this.prisma.company.findUnique({
                where: { id: companyId },
                select: { id: true, name: true, logoUrl: true },
            });
            if (!company) {
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
            if (!company.logoUrl) {
                throw new common_1.BadRequestException('Empresa não possui logo');
            }
            await this.removeLogoFile(company.logoUrl);
            await this.prisma.company.update({
                where: { id: companyId },
                data: { logoUrl: null },
            });
            this.logger.log(`Logo removed for company ${companyId}`);
            return {
                success: true,
                message: 'Logo removido com sucesso',
            };
        }
        catch (error) {
            this.logger.error('Error removing logo:', error);
            throw error;
        }
    }
    validateLogoFile(file) {
        if (!file) {
            throw new common_1.BadRequestException('Nenhum arquivo foi enviado');
        }
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Tipo de arquivo não permitido. Apenas imagens são aceitas.');
        }
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new common_1.BadRequestException('Arquivo muito grande. Tamanho máximo permitido: 5MB');
        }
    }
    async removeLogoFile(logoUrl) {
        try {
            const fileName = logoUrl.split('/').pop();
            if (!fileName)
                return;
            const filePath = path.join(process.cwd(), 'uploads', 'logos', fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                this.logger.log(`Logo file removed: ${filePath}`);
            }
        }
        catch (error) {
            this.logger.warn(`Error removing logo file: ${error.message}`);
        }
    }
    async toggleAutoMessages(companyId, enabled) {
        try {
            const company = await this.prisma.company.findUnique({
                where: { id: companyId },
                select: { id: true, name: true, autoMessageEnabled: true },
            });
            if (!company) {
                throw new common_1.NotFoundException('Empresa não encontrada');
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
            this.logger.log(`Envio automático de mensagens ${enabled ? 'ativado' : 'desativado'} para empresa ${companyId}`);
            return {
                success: true,
                autoMessageEnabled: updatedCompany.autoMessageEnabled,
                message: `Envio automático de mensagens de cobrança ${enabled ? 'ativado' : 'desativado'} com sucesso!`,
            };
        }
        catch (error) {
            this.logger.error('Error toggling auto messages:', error);
            throw error;
        }
    }
    async getAutoMessageStatus(companyId) {
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
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
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
        }
        catch (error) {
            this.logger.error('Error getting auto message status:', error);
            throw error;
        }
    }
    async updateCatalogPage(companyId, updateCatalogPageDto) {
        try {
            const company = await this.prisma.company.findUnique({
                where: { id: companyId },
                select: { id: true, name: true, catalogPageUrl: true, catalogPageEnabled: true, plan: true },
            });
            if (!company) {
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
            if (updateCatalogPageDto.catalogPageEnabled === true && company.plan !== client_1.PlanType.PRO) {
                throw new common_1.BadRequestException('O catálogo público está disponível apenas para empresas com plano PRO');
            }
            const updateData = {};
            if (updateCatalogPageDto.catalogPageUrl !== undefined) {
                if (updateCatalogPageDto.catalogPageUrl) {
                    const existingCompany = await this.prisma.company.findFirst({
                        where: {
                            catalogPageUrl: updateCatalogPageDto.catalogPageUrl,
                            id: { not: companyId },
                        },
                    });
                    if (existingCompany) {
                        throw new common_1.ConflictException(`A URL "${updateCatalogPageDto.catalogPageUrl}" já está em uso por outra empresa`);
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
        }
        catch (error) {
            this.logger.error('Error updating catalog page:', error);
            throw error;
        }
    }
    async getCatalogPageConfig(companyId) {
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
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
            return {
                catalogPageUrl: company.catalogPageUrl,
                catalogPageEnabled: company.catalogPageEnabled,
                pageUrl: company.catalogPageUrl
                    ? `/catalog/${company.catalogPageUrl}`
                    : null,
            };
        }
        catch (error) {
            this.logger.error('Error getting catalog page config:', error);
            throw error;
        }
    }
    async getPublicCatalogData(url) {
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
                                gt: 0,
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
                throw new common_1.NotFoundException('Página de catálogo não encontrada ou não está habilitada');
            }
            if (company.plan !== client_1.PlanType.PRO) {
                throw new common_1.NotFoundException('O catálogo público está disponível apenas para empresas com plano PRO');
            }
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
        }
        catch (error) {
            this.logger.error('Error getting public catalog data:', error);
            throw error;
        }
    }
};
exports.CompanyService = CompanyService;
exports.CompanyService = CompanyService = CompanyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        hash_service_1.HashService,
        encryption_service_1.EncryptionService,
        validation_service_1.ValidationService,
        upload_service_1.UploadService])
], CompanyService);
//# sourceMappingURL=company.service.js.map
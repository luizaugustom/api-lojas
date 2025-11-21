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
var FiscalApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiscalApiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const axios_1 = require("axios");
const FormData = require("form-data");
const fs = require("fs");
let FiscalApiService = FiscalApiService_1 = class FiscalApiService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(FiscalApiService_1.name);
        this.config = this.loadFiscalConfig();
        this.httpClient = this.createHttpClient();
    }
    async getFocusNfeApiKey() {
        try {
            const admin = await this.prisma.admin.findFirst({
                select: {
                    focusNfeApiKey: true,
                },
            });
            const apiKey = admin?.focusNfeApiKey || this.config.apiKey || '';
            if (!apiKey || apiKey.trim() === '') {
                this.logger.warn('API Key do Focus NFe não encontrada. ' +
                    'Configure em Configurações > Fiscal ou na variável de ambiente FOCUSNFE_API_KEY.');
            }
            return apiKey;
        }
        catch (error) {
            this.logger.error('Erro ao buscar API Key do banco de dados:', error);
            return this.config.apiKey || '';
        }
    }
    async getFocusNfeEnvironment() {
        try {
            const admin = await this.prisma.admin.findFirst({
                select: {
                    focusNfeEnvironment: true,
                },
            });
            const environment = admin?.focusNfeEnvironment || this.config.environment;
            if (!environment || (environment !== 'sandbox' && environment !== 'production')) {
                this.logger.warn(`Ambiente inválido: ${environment}. Usando padrão: ${this.config.environment}`);
                return this.config.environment;
            }
            return environment;
        }
        catch (error) {
            this.logger.error('Erro ao buscar ambiente do banco de dados:', error);
            return this.config.environment;
        }
    }
    loadFiscalConfig() {
        const provider = this.configService.get('FISCAL_PROVIDER', 'mock');
        const configs = {
            'nfe.io': {
                provider: 'nfe.io',
                baseUrl: this.configService.get('NFEIO_BASE_URL', 'https://api.nfe.io/v1'),
                apiKey: this.configService.get('NFEIO_API_KEY', ''),
                environment: this.configService.get('FISCAL_ENVIRONMENT', 'sandbox'),
                certificatePath: this.configService.get('FISCAL_CERTIFICATE_PATH', ''),
                certificatePassword: this.configService.get('FISCAL_CERTIFICATE_PASSWORD', ''),
            },
            'tecnospeed': {
                provider: 'tecnospeed',
                baseUrl: this.configService.get('TECNOSPEED_BASE_URL', 'https://api.tecnospeed.com.br'),
                apiKey: this.configService.get('TECNOSPEED_API_KEY', ''),
                environment: this.configService.get('FISCAL_ENVIRONMENT', 'sandbox'),
                certificatePath: this.configService.get('FISCAL_CERTIFICATE_PATH', ''),
                certificatePassword: this.configService.get('FISCAL_CERTIFICATE_PASSWORD', ''),
            },
            'focusnfe': {
                provider: 'focusnfe',
                baseUrl: this.configService.get('FOCUSNFE_BASE_URL', 'https://homologacao.focusnfe.com.br'),
                apiKey: this.configService.get('FOCUSNFE_API_KEY', ''),
                environment: this.configService.get('FISCAL_ENVIRONMENT', 'sandbox'),
                certificatePath: this.configService.get('FISCAL_CERTIFICATE_PATH', ''),
                certificatePassword: this.configService.get('FISCAL_CERTIFICATE_PASSWORD', ''),
            },
            'enotas': {
                provider: 'enotas',
                baseUrl: this.configService.get('ENOTAS_BASE_URL', 'https://app.enotas.com.br/api'),
                apiKey: this.configService.get('ENOTAS_API_KEY', ''),
                environment: this.configService.get('FISCAL_ENVIRONMENT', 'sandbox'),
                certificatePath: this.configService.get('FISCAL_CERTIFICATE_PATH', ''),
                certificatePassword: this.configService.get('FISCAL_CERTIFICATE_PASSWORD', ''),
            },
            'mock': {
                provider: 'mock',
                baseUrl: 'http://localhost:3000',
                apiKey: 'mock-key',
                environment: 'sandbox',
            },
        };
        return configs[provider];
    }
    createHttpClient() {
        const client = axios_1.default.create({
            baseURL: this.config.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'API-Lojas-SaaS/1.0',
            },
        });
        switch (this.config.provider) {
            case 'nfe.io':
                client.defaults.headers.common['Authorization'] = `Bearer ${this.config.apiKey}`;
                break;
            case 'tecnospeed':
                client.defaults.headers.common['X-API-KEY'] = this.config.apiKey;
                break;
            case 'focusnfe':
                client.defaults.auth = {
                    username: this.config.apiKey,
                    password: '',
                };
                break;
            case 'enotas':
                client.defaults.headers.common['Authorization'] = `Bearer ${this.config.apiKey}`;
                break;
        }
        client.interceptors.request.use((config) => {
            this.logger.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
            return config;
        }, (error) => {
            this.logger.error('Request error:', error);
            return Promise.reject(error);
        });
        client.interceptors.response.use((response) => {
            this.logger.log(`Response received: ${response.status} ${response.statusText}`);
            return response;
        }, (error) => {
            this.logger.error('Response error:', error.response?.data || error.message);
            return Promise.reject(error);
        });
        return client;
    }
    async generateNFCe(request) {
        try {
            this.logger.log(`Generating NFCe using ${this.config.provider} provider`);
            switch (this.config.provider) {
                case 'nfe.io':
                    return await this.generateNFCeNfeIo(request);
                case 'tecnospeed':
                    return await this.generateNFCeTecnoSpeed(request);
                case 'focusnfe':
                    return await this.generateNFCeFocusNFe(request);
                case 'enotas':
                    return await this.generateNFCeEnotas(request);
                case 'mock':
                    return await this.generateNFCeMock(request);
                default:
                    throw new common_1.BadRequestException(`Provider ${this.config.provider} not supported`);
            }
        }
        catch (error) {
            this.logger.error('Error generating NFCe:', error);
            return {
                success: false,
                documentNumber: '',
                accessKey: '',
                status: 'Erro',
                error: error.message || 'Erro desconhecido na geração da NFCe',
            };
        }
    }
    async generateNFCeNfeIo(request) {
        const endpoint = this.config.environment === 'production'
            ? '/nfce'
            : '/nfce/sandbox';
        const totalTaxValue = request.totalTaxValue ??
            request.items.reduce((sum, item) => sum + (item.taxValue || 0), 0);
        const payload = {
            natureza_operacao: request.operationNature || 'Venda',
            data_emissao: new Date().toISOString(),
            data_saida_entrada: new Date().toISOString(),
            tipo_documento: 65,
            local_destino: 1,
            finalidade_emissao: request.emissionPurpose ?? 1,
            consumidor_final: 1,
            presenca_comprador: 1,
            modalidade_frete: 9,
            tipo_pagamento: this.mapPaymentMethods(request.payments),
            itens: request.items.map(item => ({
                codigo: item.productId,
                descricao: item.productName,
                ncm: item.ncm || '99999999',
                cfop: item.cfop || '5102',
                unidade_comercial: item.unitOfMeasure || 'UN',
                quantidade_comercial: item.quantity,
                valor_unitario_comercial: item.unitPrice,
                valor_total_bruto: item.totalPrice,
                codigo_barras_comercial: item.barcode,
                ...(item.taxValue && { valor_total_tributos_item: item.taxValue }),
            })),
            valor_total: request.totalValue,
            valor_frete: 0,
            valor_seguro: 0,
            valor_desconto: 0,
            valor_outras_despesas: 0,
            valor_total_tributos: Number(totalTaxValue.toFixed(2)),
            valor_total_produtos: request.totalValue,
            valor_total_servicos: 0,
            valor_total_nota: request.totalValue,
        };
        if (request.referenceAccessKey) {
            payload.notas_referenciadas = [
                {
                    chave_acesso: request.referenceAccessKey,
                },
            ];
        }
        const response = await this.httpClient.post(endpoint, payload);
        return {
            success: true,
            documentNumber: response.data.numero,
            accessKey: response.data.chave_acesso,
            status: response.data.status,
            xmlContent: response.data.xml,
            pdfUrl: response.data.pdf_url,
            qrCodeUrl: response.data.qr_code_url,
        };
    }
    async generateNFCeTecnoSpeed(request) {
        const endpoint = '/nfce/emitir';
        const payload = {
            ambiente: this.config.environment === 'production' ? 1 : 2,
            natureza_operacao: request.operationNature || 'Venda',
            tipo_operacao: 'S',
            modelo: 65,
            serie: 1,
            numero: 1,
            data_emissao: new Date().toISOString(),
            data_saida_entrada: new Date().toISOString(),
            tipo_documento: request.documentType ?? 0,
            local_destino: 1,
            finalidade_emissao: request.emissionPurpose ?? 1,
            consumidor_final: 1,
            presenca_comprador: 1,
            modalidade_frete: 9,
            itens: request.items.map(item => ({
                codigo: item.productId,
                descricao: item.productName,
                ncm: item.ncm || '99999999',
                cfop: item.cfop || '5102',
                unidade: item.unitOfMeasure || 'UN',
                quantidade: item.quantity,
                valor_unitario: item.unitPrice,
                valor_total: item.totalPrice,
                codigo_barras: item.barcode,
                ...(item.taxValue && { valor_total_tributos_item: item.taxValue }),
            })),
            totalizadores: {
                valor_total_produtos: request.totalValue,
                valor_total_servicos: 0,
                valor_total_nota: request.totalValue,
                valor_frete: 0,
                valor_seguro: 0,
                valor_desconto: 0,
                valor_outras_despesas: 0,
                valor_total_tributos: Number((request.totalTaxValue ?? request.items.reduce((sum, item) => sum + (item.taxValue || 0), 0)).toFixed(2)),
            },
        };
        if (request.referenceAccessKey) {
            payload.documento_referenciado = {
                chave: request.referenceAccessKey,
            };
        }
        payload.pagamentos = this.mapPaymentMethods(request.payments);
        const response = await this.httpClient.post(endpoint, payload);
        return {
            success: true,
            documentNumber: response.data.numero,
            accessKey: response.data.chave_acesso,
            status: response.data.status,
            xmlContent: response.data.xml,
            pdfUrl: response.data.pdf_url,
            qrCodeUrl: response.data.qr_code_url,
        };
    }
    async generateNFCeFocusNFe(request) {
        const apiKey = await this.getFocusNfeApiKey();
        const environment = await this.getFocusNfeEnvironment();
        if (!apiKey || apiKey.trim() === '') {
            const errorMsg = 'API Key do Focus NFe não configurada. Configure em Configurações > Fiscal ou na variável de ambiente FOCUSNFE_API_KEY.';
            this.logger.error(errorMsg);
            throw new common_1.BadRequestException(errorMsg);
        }
        const baseUrl = environment === 'production'
            ? 'https://api.focusnfe.com.br'
            : 'https://homologacao.focusnfe.com.br';
        this.logger.log(`Usando Focus NFe - Ambiente: ${environment}, Base URL: ${baseUrl}`);
        this.logger.debug(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
        const httpClient = axios_1.default.create({
            baseURL: baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'API-Lojas-SaaS/1.0',
            },
            auth: {
                username: apiKey,
                password: '',
            },
        });
        httpClient.interceptors.response.use((response) => response, (error) => {
            if (error.response?.status === 401) {
                const errorMsg = `Erro de autenticação no Focus NFe. Verifique se a API Key está correta e válida. Ambiente: ${environment}`;
                this.logger.error(errorMsg);
                this.logger.error(`Detalhes: ${JSON.stringify(error.response?.data || error.message)}`);
                throw new common_1.BadRequestException('Erro de autenticação no Focus NFe. Verifique a configuração da API Key.');
            }
            return Promise.reject(error);
        });
        const endpoint = `/v2/nfce?ref=${request.saleId}`;
        const payload = {
            natureza_operacao: request.operationNature || 'Venda',
            data_emissao: new Date().toISOString(),
            data_saida_entrada: new Date().toISOString(),
            tipo_documento: 65,
            local_destino: 1,
            finalidade_emissao: request.emissionPurpose ?? 1,
            consumidor_final: 1,
            presenca_comprador: 1,
            modalidade_frete: 9,
            itens: request.items.map(item => ({
                codigo: item.productId,
                descricao: item.productName,
                ncm: item.ncm || '99999999',
                cfop: item.cfop || '5102',
                unidade_comercial: item.unitOfMeasure || 'UN',
                quantidade_comercial: item.quantity,
                valor_unitario_comercial: item.unitPrice,
                valor_total_bruto: item.totalPrice,
                codigo_barras_comercial: item.barcode,
                ...(item.taxValue && { valor_total_tributos_item: item.taxValue }),
            })),
            valor_total: request.totalValue,
            valor_frete: 0,
            valor_seguro: 0,
            valor_desconto: 0,
            valor_outras_despesas: 0,
            valor_total_tributos: Number((request.totalTaxValue ?? request.items.reduce((sum, item) => sum + (item.taxValue || 0), 0)).toFixed(2)),
            valor_total_produtos: request.totalValue,
            valor_total_servicos: 0,
            valor_total_nota: request.totalValue,
        };
        payload.pagamentos = this.mapPaymentMethods(request.payments);
        if (request.referenceAccessKey) {
            payload.notas_referenciadas = [
                {
                    chave: request.referenceAccessKey,
                },
            ];
        }
        if (request.additionalInfo) {
            payload.informacoes_complementares = request.additionalInfo;
        }
        const response = await httpClient.post(endpoint, payload);
        return {
            success: true,
            documentNumber: response.data.numero,
            accessKey: response.data.chave_acesso,
            status: response.data.status,
            xmlContent: response.data.xml,
            pdfUrl: response.data.pdf_url,
            qrCodeUrl: response.data.qr_code_url,
        };
    }
    async generateNFCeEnotas(request) {
        const endpoint = '/nfce';
        const payload = {
            natureza_operacao: request.operationNature || 'Venda',
            data_emissao: new Date().toISOString(),
            data_saida_entrada: new Date().toISOString(),
            tipo_documento: 65,
            local_destino: 1,
            finalidade_emissao: request.emissionPurpose ?? 1,
            consumidor_final: 1,
            presenca_comprador: 1,
            modalidade_frete: 9,
            itens: request.items.map(item => ({
                codigo: item.productId,
                descricao: item.productName,
                ncm: item.ncm || '99999999',
                cfop: item.cfop || '5102',
                unidade_comercial: item.unitOfMeasure || 'UN',
                quantidade_comercial: item.quantity,
                valor_unitario_comercial: item.unitPrice,
                valor_total_bruto: item.totalPrice,
                codigo_barras_comercial: item.barcode,
                ...(item.taxValue && { valor_total_tributos_item: item.taxValue }),
            })),
            valor_total: request.totalValue,
            valor_frete: 0,
            valor_seguro: 0,
            valor_desconto: 0,
            valor_outras_despesas: 0,
            valor_total_tributos: Number((request.totalTaxValue ?? request.items.reduce((sum, item) => sum + (item.taxValue || 0), 0)).toFixed(2)),
            valor_total_produtos: request.totalValue,
            valor_total_servicos: 0,
            valor_total_nota: request.totalValue,
        };
        payload.pagamentos = this.mapPaymentMethods(request.payments);
        if (request.referenceAccessKey) {
            payload.documentos_referenciados = [
                {
                    chave_acesso: request.referenceAccessKey,
                },
            ];
        }
        if (request.additionalInfo) {
            payload.informacoes_adicionais = request.additionalInfo;
        }
        const response = await this.httpClient.post(endpoint, payload);
        return {
            success: true,
            documentNumber: response.data.numero,
            accessKey: response.data.chave_acesso,
            status: response.data.status,
            xmlContent: response.data.xml,
            pdfUrl: response.data.pdf_url,
            qrCodeUrl: response.data.qr_code_url,
        };
    }
    async generateNFCeMock(request) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            success: true,
            documentNumber: Math.floor(Math.random() * 1000000).toString(),
            accessKey: `NFe${Date.now()}${Math.floor(Math.random() * 1000000)}`,
            status: 'Autorizada',
            xmlContent: '<?xml version="1.0" encoding="UTF-8"?><nfe></nfe>',
            pdfUrl: 'https://example.com/documento.pdf',
            qrCodeUrl: 'https://example.com/qrcode.png',
        };
    }
    async generateNFe(request) {
        try {
            this.logger.log(`Generating NFe for company: ${request.companyId}`);
            const company = await this.prisma.company.findUnique({
                where: { id: request.companyId },
                include: {
                    admin: {
                        select: {
                            focusNfeApiKey: true,
                            focusNfeEnvironment: true,
                        },
                    },
                },
            });
            if (!company || !company.admin) {
                throw new common_1.BadRequestException('Empresa ou configurações fiscais não encontradas');
            }
            if (!company.admin.focusNfeApiKey) {
                throw new common_1.BadRequestException('API Key do Focus NFe não configurada');
            }
            this.validateCompanyFiscalData(company);
            return await this.generateNFeFocusNFe(request, company);
        }
        catch (error) {
            this.logger.error('Error generating NFe:', error);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            return {
                success: false,
                documentNumber: '',
                accessKey: '',
                status: 'Erro',
                error: error.message || 'Erro ao gerar NF-e',
                errors: [error.message],
            };
        }
    }
    validateCompanyFiscalData(company) {
        const errors = [];
        if (!company.cnpj) {
            errors.push('CNPJ da empresa é obrigatório');
        }
        if (!company.name) {
            errors.push('Nome da empresa é obrigatório');
        }
        if (!company.street) {
            errors.push('Endereço da empresa é obrigatório');
        }
        if (!company.number) {
            errors.push('Número do endereço da empresa é obrigatório');
        }
        if (!company.city) {
            errors.push('Cidade da empresa é obrigatória');
        }
        if (!company.state) {
            errors.push('Estado da empresa é obrigatório');
        }
        if (!company.zipCode) {
            errors.push('CEP da empresa é obrigatório');
        }
        if (errors.length > 0) {
            throw new common_1.BadRequestException(`Dados fiscais incompletos da empresa: ${errors.join(', ')}. Configure na seção de empresas.`);
        }
    }
    async generateNFeFocusNFe(request, company) {
        try {
            const apiKey = company.admin.focusNfeApiKey || await this.getFocusNfeApiKey();
            const environment = company.admin.focusNfeEnvironment || await this.getFocusNfeEnvironment();
            if (!apiKey || apiKey.trim() === '') {
                const errorMsg = 'API Key do Focus NFe não configurada. Configure em Configurações > Fiscal ou na variável de ambiente FOCUSNFE_API_KEY.';
                this.logger.error(errorMsg);
                throw new common_1.BadRequestException(errorMsg);
            }
            const baseUrl = environment === 'production'
                ? 'https://api.focusnfe.com.br'
                : 'https://homologacao.focusnfe.com.br';
            this.logger.log(`Usando Focus NFe - Ambiente: ${environment}, Base URL: ${baseUrl}`);
            this.logger.debug(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
            const httpClient = axios_1.default.create({
                baseURL: baseUrl,
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'API-Lojas-SaaS/1.0',
                },
                auth: {
                    username: apiKey,
                    password: '',
                },
            });
            httpClient.interceptors.response.use((response) => response, (error) => {
                if (error.response?.status === 401) {
                    const errorMsg = `Erro de autenticação no Focus NFe. Verifique se a API Key está correta e válida. Ambiente: ${environment}`;
                    this.logger.error(errorMsg);
                    this.logger.error(`Detalhes: ${JSON.stringify(error.response?.data || error.message)}`);
                    throw new common_1.BadRequestException('Erro de autenticação no Focus NFe. Verifique a configuração da API Key.');
                }
                return Promise.reject(error);
            });
            const ref = request.referenceId || `nfe_${Date.now()}`;
            const endpoint = `/v2/nfe?ref=${ref}`;
            const recipientDoc = request.recipient.document.replace(/\D/g, '');
            const isCompany = recipientDoc.length === 14;
            const payload = {
                natureza_operacao: 'Venda',
                data_emissao: new Date().toISOString(),
                data_saida_entrada: new Date().toISOString(),
                tipo_documento: 1,
                finalidade_emissao: '1',
                cnpj_emitente: company.cnpj.replace(/\D/g, ''),
                razao_social: company.name,
                nome_fantasia: company.name,
                endereco: company.street || '',
                numero: company.number || 'S/N',
                complemento: company.complement || '',
                bairro: company.district || '',
                municipio: company.city || '',
                uf: company.state || '',
                cep: company.zipCode?.replace(/\D/g, '') || '',
                telefone: company.phone?.replace(/\D/g, '') || '',
                inscricao_estadual: company.stateRegistration || 'ISENTO',
                inscricao_estadual_indicador: company.stateRegistration ? '1' : '9',
                ...(company.cnae && { cnae: company.cnae }),
                ...(company.municipioIbge && { codigo_municipio: company.municipioIbge }),
                regime_tributario: this.mapTaxRegime(company.taxRegime),
                nome_destinatario: request.recipient.name,
                [isCompany ? 'cnpj_destinatario' : 'cpf_destinatario']: recipientDoc,
                ...(request.recipient.email && { email_destinatario: request.recipient.email }),
                ...(request.recipient.phone && { telefone_destinatario: request.recipient.phone.replace(/\D/g, '') }),
                logradouro_destinatario: request.recipient.address?.street || '',
                numero_destinatario: request.recipient.address?.number || 'S/N',
                complemento_destinatario: request.recipient.address?.complement || '',
                bairro_destinatario: request.recipient.address?.district || '',
                municipio_destinatario: request.recipient.address?.city || '',
                uf_destinatario: request.recipient.address?.state || '',
                cep_destinatario: request.recipient.address?.zipCode?.replace(/\D/g, '') || '',
                indicador_inscricao_estadual_destinatario: '9',
                consumidor_final: '1',
                presenca_comprador: '9',
                modalidade_frete: '9',
                itens: request.items.map((item, index) => {
                    const totalItem = item.quantity * item.unitPrice;
                    return {
                        numero_item: String(index + 1),
                        codigo_produto: `ITEM${index + 1}`,
                        descricao: item.description,
                        ncm: item.ncm || '99999999',
                        cfop: item.cfop,
                        unidade_comercial: item.unitOfMeasure,
                        quantidade_comercial: item.quantity,
                        valor_unitario_comercial: item.unitPrice,
                        valor_unitario_tributavel: item.unitPrice,
                        unidade_tributavel: item.unitOfMeasure,
                        quantidade_tributavel: item.quantity,
                        valor_bruto: totalItem,
                        icms_situacao_tributaria: '102',
                        icms_origem: '0',
                        pis_situacao_tributaria: '07',
                        cofins_situacao_tributaria: '07',
                        ...(item.taxValue && { valor_total_tributos_item: item.taxValue }),
                    };
                }),
                valor_produtos: request.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
                valor_total: request.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
                valor_total_tributos: Number((request.totalTaxValue ?? request.items.reduce((sum, item) => sum + (item.taxValue || 0), 0)).toFixed(2)),
                forma_pagamento: '0',
                meio_pagamento: this.mapPaymentMethodCodeSefaz(request.paymentMethod),
                ...(request.additionalInfo && { informacoes_complementares: request.additionalInfo }),
            };
            httpClient.defaults.timeout = 60000;
            const response = await httpClient.post(endpoint, payload);
            this.logger.log('NFe generated successfully via Focus NFe');
            return {
                success: true,
                documentNumber: response.data.numero || '',
                accessKey: response.data.chave_nfe || response.data.chave_acesso || '',
                status: response.data.status || 'processando',
                xmlContent: response.data.caminho_xml_nota_fiscal || '',
                pdfUrl: response.data.caminho_danfe || '',
            };
        }
        catch (error) {
            this.logger.error('Error in generateNFeFocusNFe:', error);
            if (error.response?.data) {
                const focusError = error.response.data;
                throw new common_1.BadRequestException(focusError.mensagem ||
                    focusError.erro ||
                    JSON.stringify(focusError));
            }
            throw new common_1.BadRequestException(error.message || 'Erro ao gerar NF-e no Focus NFe');
        }
    }
    mapTaxRegime(taxRegime) {
        if (!taxRegime)
            return '1';
        const mapping = {
            'SIMPLES_NACIONAL': '1',
            'LUCRO_PRESUMIDO': '2',
            'LUCRO_REAL': '3',
            'MEI': '4',
        };
        return mapping[taxRegime.toUpperCase()] || '1';
    }
    mapPaymentMethodCodeSefaz(method) {
        if (!method) {
            return '99';
        }
        const normalized = method.toString().toLowerCase();
        const mapping = {
            'cash': '01',
            'dinheiro': '01',
            '01': '01',
            'cheque': '02',
            '02': '02',
            'credit_card': '03',
            'cartao_credito': '03',
            '03': '03',
            'debit_card': '04',
            'cartao_debito': '04',
            '04': '04',
            'store_credit': '05',
            'credito_loja': '05',
            '05': '05',
            'boleto': '15',
            '15': '15',
            'deposito': '16',
            '16': '16',
            'pix': '17',
            '17': '17',
            'transferencia': '18',
            '18': '18',
            'cashback': '19',
            '19': '19',
            'sem_pagamento': '90',
            '90': '90',
        };
        return mapping[normalized] || '99';
    }
    mapPaymentMethods(payments) {
        if (!payments || !payments.length) {
            return [
                {
                    tipo: '99',
                    valor: 0,
                },
            ];
        }
        return payments.map(payment => ({
            tipo: this.mapPaymentMethodCodeSefaz(payment.method),
            valor: Number((payment.amount ?? 0).toFixed(2)),
        }));
    }
    async uploadCertificate(certificatePath, password) {
        try {
            if (!fs.existsSync(certificatePath)) {
                throw new common_1.BadRequestException('Certificado não encontrado');
            }
            const formData = new FormData();
            formData.append('certificate', fs.createReadStream(certificatePath));
            formData.append('password', password);
            const response = await this.httpClient.post('/certificate/upload', formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });
            return response.status === 200;
        }
        catch (error) {
            this.logger.error('Error uploading certificate:', error);
            return false;
        }
    }
    async getFiscalStatus() {
        try {
            const response = await this.httpClient.get('/status');
            return {
                provider: this.config.provider,
                status: 'Connected',
                environment: this.config.environment,
            };
        }
        catch (error) {
            return {
                provider: this.config.provider,
                status: 'Disconnected',
                environment: this.config.environment,
            };
        }
    }
};
exports.FiscalApiService = FiscalApiService;
exports.FiscalApiService = FiscalApiService = FiscalApiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], FiscalApiService);
//# sourceMappingURL=fiscal-api.service.js.map
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

export interface FiscalApiConfig {
  provider: 'nfe.io' | 'tecnospeed' | 'focusnfe' | 'enotas' | 'mock';
  baseUrl: string;
  apiKey: string;
  environment: 'sandbox' | 'production';
  certificatePath?: string;
  certificatePassword?: string;
}

export interface NFCeRequest {
  companyId: string;
  clientCpfCnpj?: string;
  clientName?: string;
  items: Array<{
    productId: string;
    productName: string;
    barcode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    ncm?: string;
    cfop?: string;
  }>;
  totalValue: number;
  paymentMethod: string[];
  saleId: string;
  sellerName: string;
}

export interface NFCeResponse {
  success: boolean;
  documentNumber: string;
  accessKey: string;
  status: string;
  xmlContent?: string;
  pdfUrl?: string;
  qrCodeUrl?: string;
  error?: string;
  errors?: string[];
}

// Interfaces para NF-e
export interface NFeRecipientAddress {
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
}

export interface NFeRecipient {
  document: string;
  name: string;
  email?: string;
  phone?: string;
  address?: NFeRecipientAddress;
}

export interface NFeItem {
  description: string;
  quantity: number;
  unitPrice: number;
  ncm?: string;
  cfop: string;
  unitOfMeasure: string;
}

export interface NFeRequest {
  companyId: string;
  recipient: NFeRecipient;
  items: NFeItem[];
  paymentMethod: string;
  additionalInfo?: string;
  referenceId?: string; // Para referenciar venda ou outro documento
}

export interface NFeResponse {
  success: boolean;
  documentNumber: string;
  accessKey: string;
  status: string;
  xmlContent?: string;
  pdfUrl?: string;
  error?: string;
  errors?: string[];
}

@Injectable()
export class FiscalApiService {
  private readonly logger = new Logger(FiscalApiService.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: FiscalApiConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.config = this.loadFiscalConfig();
    this.httpClient = this.createHttpClient();
  }

  /**
   * Buscar API Key do Focus NFe configurada pelo admin
   * Prioridade: 1) Banco de dados (Admin), 2) Variável de ambiente
   */
  private async getFocusNfeApiKey(): Promise<string> {
    try {
      const admin = await this.prisma.admin.findFirst({
        select: {
          focusNfeApiKey: true,
        },
      });

      const apiKey = admin?.focusNfeApiKey || this.config.apiKey || '';
      
      if (!apiKey || apiKey.trim() === '') {
        this.logger.warn(
          'API Key do Focus NFe não encontrada. ' +
          'Configure em Configurações > Fiscal ou na variável de ambiente FOCUSNFE_API_KEY.'
        );
      }
      
      return apiKey;
    } catch (error) {
      this.logger.error('Erro ao buscar API Key do banco de dados:', error);
      // Retornar API Key da variável de ambiente como fallback
      return this.config.apiKey || '';
    }
  }

  /**
   * Buscar ambiente configurado pelo admin
   * Prioridade: 1) Banco de dados (Admin), 2) Variável de ambiente
   */
  private async getFocusNfeEnvironment(): Promise<'sandbox' | 'production'> {
    try {
      const admin = await this.prisma.admin.findFirst({
        select: {
          focusNfeEnvironment: true,
        },
      });

      const environment = (admin?.focusNfeEnvironment as 'sandbox' | 'production') || this.config.environment;
      
      if (!environment || (environment !== 'sandbox' && environment !== 'production')) {
        this.logger.warn(`Ambiente inválido: ${environment}. Usando padrão: ${this.config.environment}`);
        return this.config.environment;
      }
      
      return environment;
    } catch (error) {
      this.logger.error('Erro ao buscar ambiente do banco de dados:', error);
      // Retornar ambiente da variável de ambiente como fallback
      return this.config.environment;
    }
  }

  private loadFiscalConfig(): FiscalApiConfig {
    const provider = this.configService.get('FISCAL_PROVIDER', 'mock') as FiscalApiConfig['provider'];
    
    const configs = {
      'nfe.io': {
        provider: 'nfe.io' as const,
        baseUrl: this.configService.get('NFEIO_BASE_URL', 'https://api.nfe.io/v1'),
        apiKey: this.configService.get('NFEIO_API_KEY', ''),
        environment: this.configService.get('FISCAL_ENVIRONMENT', 'sandbox') as 'sandbox' | 'production',
        certificatePath: this.configService.get('FISCAL_CERTIFICATE_PATH', ''),
        certificatePassword: this.configService.get('FISCAL_CERTIFICATE_PASSWORD', ''),
      },
      'tecnospeed': {
        provider: 'tecnospeed' as const,
        baseUrl: this.configService.get('TECNOSPEED_BASE_URL', 'https://api.tecnospeed.com.br'),
        apiKey: this.configService.get('TECNOSPEED_API_KEY', ''),
        environment: this.configService.get('FISCAL_ENVIRONMENT', 'sandbox') as 'sandbox' | 'production',
        certificatePath: this.configService.get('FISCAL_CERTIFICATE_PATH', ''),
        certificatePassword: this.configService.get('FISCAL_CERTIFICATE_PASSWORD', ''),
      },
      'focusnfe': {
        provider: 'focusnfe' as const,
        baseUrl: this.configService.get('FOCUSNFE_BASE_URL', 'https://homologacao.focusnfe.com.br'),
        apiKey: this.configService.get('FOCUSNFE_API_KEY', ''),
        environment: this.configService.get('FISCAL_ENVIRONMENT', 'sandbox') as 'sandbox' | 'production',
        certificatePath: this.configService.get('FISCAL_CERTIFICATE_PATH', ''),
        certificatePassword: this.configService.get('FISCAL_CERTIFICATE_PASSWORD', ''),
      },
      'enotas': {
        provider: 'enotas' as const,
        baseUrl: this.configService.get('ENOTAS_BASE_URL', 'https://app.enotas.com.br/api'),
        apiKey: this.configService.get('ENOTAS_API_KEY', ''),
        environment: this.configService.get('FISCAL_ENVIRONMENT', 'sandbox') as 'sandbox' | 'production',
        certificatePath: this.configService.get('FISCAL_CERTIFICATE_PATH', ''),
        certificatePassword: this.configService.get('FISCAL_CERTIFICATE_PASSWORD', ''),
      },
      'mock': {
        provider: 'mock' as const,
        baseUrl: 'http://localhost:3000',
        apiKey: 'mock-key',
        environment: 'sandbox' as const,
      },
    };

    return configs[provider];
  }

  private createHttpClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Lojas-SaaS/1.0',
      },
    });

    // Add authentication based on provider
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

    // Add request/response interceptors
    client.interceptors.request.use(
      (config) => {
        this.logger.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    client.interceptors.response.use(
      (response) => {
        this.logger.log(`Response received: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        this.logger.error('Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    return client;
  }

  async generateNFCe(request: NFCeRequest): Promise<NFCeResponse> {
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
          throw new BadRequestException(`Provider ${this.config.provider} not supported`);
      }
    } catch (error) {
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

  private async generateNFCeNfeIo(request: NFCeRequest): Promise<NFCeResponse> {
    const endpoint = this.config.environment === 'production' 
      ? '/nfce' 
      : '/nfce/sandbox';

    const payload = {
      natureza_operacao: 'Venda',
      data_emissao: new Date().toISOString(),
      data_saida_entrada: new Date().toISOString(),
      tipo_documento: 65, // NFCe
      local_destino: 1, // Operação interna
      finalidade_emissao: 1, // Normal
      consumidor_final: 1, // Sim
      presenca_comprador: 1, // Presencial
      modalidade_frete: 9, // Sem frete
      tipo_pagamento: this.mapPaymentMethods(request.paymentMethod),
      itens: request.items.map(item => ({
        codigo: item.productId,
        descricao: item.productName,
        ncm: item.ncm || '99999999',
        cfop: item.cfop || '5102',
        unidade_comercial: 'UN',
        quantidade_comercial: item.quantity,
        valor_unitario_comercial: item.unitPrice,
        valor_total_bruto: item.totalPrice,
        codigo_barras_comercial: item.barcode,
      })),
      valor_total: request.totalValue,
      valor_frete: 0,
      valor_seguro: 0,
      valor_desconto: 0,
      valor_outras_despesas: 0,
      valor_total_tributos: 0,
      valor_total_produtos: request.totalValue,
      valor_total_servicos: 0,
      valor_total_nota: request.totalValue,
    };

    const response: AxiosResponse = await this.httpClient.post(endpoint, payload);

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

  private async generateNFCeTecnoSpeed(request: NFCeRequest): Promise<NFCeResponse> {
    const endpoint = '/nfce/emitir';

    const payload = {
      ambiente: this.config.environment === 'production' ? 1 : 2,
      natureza_operacao: 'Venda',
      tipo_operacao: 'S',
      modelo: 65, // NFCe
      serie: 1,
      numero: 1,
      data_emissao: new Date().toISOString(),
      data_saida_entrada: new Date().toISOString(),
      tipo_documento: 0, // Entrada
      local_destino: 1, // Operação interna
      finalidade_emissao: 1, // Normal
      consumidor_final: 1, // Sim
      presenca_comprador: 1, // Presencial
      modalidade_frete: 9, // Sem frete
      itens: request.items.map(item => ({
        codigo: item.productId,
        descricao: item.productName,
        ncm: item.ncm || '99999999',
        cfop: item.cfop || '5102',
        unidade: 'UN',
        quantidade: item.quantity,
        valor_unitario: item.unitPrice,
        valor_total: item.totalPrice,
        codigo_barras: item.barcode,
      })),
      totalizadores: {
        valor_total_produtos: request.totalValue,
        valor_total_servicos: 0,
        valor_total_nota: request.totalValue,
        valor_frete: 0,
        valor_seguro: 0,
        valor_desconto: 0,
        valor_outras_despesas: 0,
        valor_total_tributos: 0,
      },
    };

    const response: AxiosResponse = await this.httpClient.post(endpoint, payload);

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

  private async generateNFCeFocusNFe(request: NFCeRequest): Promise<NFCeResponse> {
    // Buscar API Key e ambiente do banco de dados (configuração do admin)
    const apiKey = await this.getFocusNfeApiKey();
    const environment = await this.getFocusNfeEnvironment();
    
    // Validar API Key
    if (!apiKey || apiKey.trim() === '') {
      const errorMsg = 'API Key do Focus NFe não configurada. Configure em Configurações > Fiscal ou na variável de ambiente FOCUSNFE_API_KEY.';
      this.logger.error(errorMsg);
      throw new BadRequestException(errorMsg);
    }
    
    // Determinar URL base baseado no ambiente
    const baseUrl = environment === 'production' 
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';
    
    this.logger.log(`Usando Focus NFe - Ambiente: ${environment}, Base URL: ${baseUrl}`);
    this.logger.debug(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
    
    // Criar cliente HTTP dinâmico com a API Key do banco
    const httpClient = axios.create({
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
    
    // Adicionar interceptor de resposta para melhor tratamento de erros
    httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const errorMsg = `Erro de autenticação no Focus NFe. Verifique se a API Key está correta e válida. Ambiente: ${environment}`;
          this.logger.error(errorMsg);
          this.logger.error(`Detalhes: ${JSON.stringify(error.response?.data || error.message)}`);
          throw new BadRequestException('Erro de autenticação no Focus NFe. Verifique a configuração da API Key.');
        }
        return Promise.reject(error);
      }
    );
    
    const endpoint = `/v2/nfce?ref=${request.saleId}`;

    const payload = {
      natureza_operacao: 'Venda',
      data_emissao: new Date().toISOString(),
      data_saida_entrada: new Date().toISOString(),
      tipo_documento: 65, // NFCe
      local_destino: 1, // Operação interna
      finalidade_emissao: 1, // Normal
      consumidor_final: 1, // Sim
      presenca_comprador: 1, // Presencial
      modalidade_frete: 9, // Sem frete
      itens: request.items.map(item => ({
        codigo: item.productId,
        descricao: item.productName,
        ncm: item.ncm || '99999999',
        cfop: item.cfop || '5102',
        unidade_comercial: 'UN',
        quantidade_comercial: item.quantity,
        valor_unitario_comercial: item.unitPrice,
        valor_total_bruto: item.totalPrice,
        codigo_barras_comercial: item.barcode,
      })),
      valor_total: request.totalValue,
      valor_frete: 0,
      valor_seguro: 0,
      valor_desconto: 0,
      valor_outras_despesas: 0,
      valor_total_tributos: 0,
      valor_total_produtos: request.totalValue,
      valor_total_servicos: 0,
      valor_total_nota: request.totalValue,
    };

    const response: AxiosResponse = await httpClient.post(endpoint, payload);

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

  private async generateNFCeEnotas(request: NFCeRequest): Promise<NFCeResponse> {
    const endpoint = '/nfce';

    const payload = {
      natureza_operacao: 'Venda',
      data_emissao: new Date().toISOString(),
      data_saida_entrada: new Date().toISOString(),
      tipo_documento: 65, // NFCe
      local_destino: 1, // Operação interna
      finalidade_emissao: 1, // Normal
      consumidor_final: 1, // Sim
      presenca_comprador: 1, // Presencial
      modalidade_frete: 9, // Sem frete
      itens: request.items.map(item => ({
        codigo: item.productId,
        descricao: item.productName,
        ncm: item.ncm || '99999999',
        cfop: item.cfop || '5102',
        unidade_comercial: 'UN',
        quantidade_comercial: item.quantity,
        valor_unitario_comercial: item.unitPrice,
        valor_total_bruto: item.totalPrice,
        codigo_barras_comercial: item.barcode,
      })),
      valor_total: request.totalValue,
      valor_frete: 0,
      valor_seguro: 0,
      valor_desconto: 0,
      valor_outras_despesas: 0,
      valor_total_tributos: 0,
      valor_total_produtos: request.totalValue,
      valor_total_servicos: 0,
      valor_total_nota: request.totalValue,
    };

    const response: AxiosResponse = await this.httpClient.post(endpoint, payload);

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

  private async generateNFCeMock(request: NFCeRequest): Promise<NFCeResponse> {
    // Simulate API call delay
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

  /**
   * Gerar NF-e (Nota Fiscal Eletrônica)
   */
  async generateNFe(request: NFeRequest): Promise<NFeResponse> {
    try {
      this.logger.log(`Generating NFe for company: ${request.companyId}`);

      // Buscar dados da empresa
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
        throw new BadRequestException('Empresa ou configurações fiscais não encontradas');
      }

      // Validar se tem configuração do Focus NFe
      if (!company.admin.focusNfeApiKey) {
        throw new BadRequestException('API Key do Focus NFe não configurada');
      }

      // Validar dados obrigatórios da empresa para emissão de NF-e
      this.validateCompanyFiscalData(company);

      // Por enquanto, usar apenas Focus NFe para NF-e
      return await this.generateNFeFocusNFe(request, company);
    } catch (error) {
      this.logger.error('Error generating NFe:', error);
      
      if (error instanceof BadRequestException) {
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

  /**
   * Validar dados fiscais obrigatórios da empresa para emissão de NF-e
   */
  private validateCompanyFiscalData(company: any): void {
    const errors: string[] = [];

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
      throw new BadRequestException(
        `Dados fiscais incompletos da empresa: ${errors.join(', ')}. Configure na seção de empresas.`
      );
    }
  }

  private async generateNFeFocusNFe(request: NFeRequest, company: any): Promise<NFeResponse> {
    try {
      // Buscar API Key e ambiente do banco de dados (configuração do admin)
      const apiKey = company.admin.focusNfeApiKey || await this.getFocusNfeApiKey();
      const environment = company.admin.focusNfeEnvironment || await this.getFocusNfeEnvironment();
      
      // Validar API Key
      if (!apiKey || apiKey.trim() === '') {
        const errorMsg = 'API Key do Focus NFe não configurada. Configure em Configurações > Fiscal ou na variável de ambiente FOCUSNFE_API_KEY.';
        this.logger.error(errorMsg);
        throw new BadRequestException(errorMsg);
      }
      
      // Determinar URL base baseado no ambiente
      const baseUrl = environment === 'production' 
        ? 'https://api.focusnfe.com.br'
        : 'https://homologacao.focusnfe.com.br';
      
      this.logger.log(`Usando Focus NFe - Ambiente: ${environment}, Base URL: ${baseUrl}`);
      this.logger.debug(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
      
      // Criar cliente HTTP dinâmico com a API Key do banco
      const httpClient = axios.create({
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
      
      // Adicionar interceptor de resposta para melhor tratamento de erros
      httpClient.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            const errorMsg = `Erro de autenticação no Focus NFe. Verifique se a API Key está correta e válida. Ambiente: ${environment}`;
            this.logger.error(errorMsg);
            this.logger.error(`Detalhes: ${JSON.stringify(error.response?.data || error.message)}`);
            throw new BadRequestException('Erro de autenticação no Focus NFe. Verifique a configuração da API Key.');
          }
          return Promise.reject(error);
        }
      );
      
      // Endpoint do Focus NFe para NF-e
      const ref = request.referenceId || `nfe_${Date.now()}`;
      const endpoint = `/v2/nfe?ref=${ref}`;

      // Determinar tipo de documento do destinatário
      const recipientDoc = request.recipient.document.replace(/\D/g, '');
      const isCompany = recipientDoc.length === 14;

      // Preparar payload para Focus NFe (modelo 55 - NF-e)
      const payload = {
        natureza_operacao: 'Venda',
        data_emissao: new Date().toISOString(),
        data_saida_entrada: new Date().toISOString(),
        tipo_documento: 1, // 1=Saída
        finalidade_emissao: '1', // 1=Normal
        cnpj_emitente: company.cnpj.replace(/\D/g, ''),
        
        // Dados do emitente (obrigatórios)
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
        inscricao_estadual_indicador: company.stateRegistration ? '1' : '9', // 1=Contribuinte ICMS, 9=Isento
        ...(company.cnae && { cnae: company.cnae }),
        ...(company.municipioIbge && { codigo_municipio: company.municipioIbge }),
        
        // Regime tributário (CRT)
        regime_tributario: this.mapTaxRegime(company.taxRegime),
        
        // Dados do destinatário
        nome_destinatario: request.recipient.name,
        [isCompany ? 'cnpj_destinatario' : 'cpf_destinatario']: recipientDoc,
        ...(request.recipient.email && { email_destinatario: request.recipient.email }),
        ...(request.recipient.phone && { telefone_destinatario: request.recipient.phone.replace(/\D/g, '') }),
        
        // Endereço do destinatário (obrigatório para NF-e)
        logradouro_destinatario: request.recipient.address?.street || '',
        numero_destinatario: request.recipient.address?.number || 'S/N',
        complemento_destinatario: request.recipient.address?.complement || '',
        bairro_destinatario: request.recipient.address?.district || '',
        municipio_destinatario: request.recipient.address?.city || '',
        uf_destinatario: request.recipient.address?.state || '',
        cep_destinatario: request.recipient.address?.zipCode?.replace(/\D/g, '') || '',

        // Indicadores
        indicador_inscricao_estadual_destinatario: '9', // 9=Não contribuinte
        consumidor_final: '1', // 1=Sim
        presenca_comprador: '9', // 9=Operação não presencial (pela internet/telefone)
        modalidade_frete: '9', // 9=Sem frete
        
        // Itens
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
            
            // ICMS - Regime Simples Nacional
            icms_situacao_tributaria: '102', // 102=Tributada sem permissão de crédito
            icms_origem: '0', // 0=Nacional
            
            // PIS
            pis_situacao_tributaria: '07', // 07=Operação isenta
            
            // COFINS
            cofins_situacao_tributaria: '07', // 07=Operação isenta
          };
        }),

        // Totais
        valor_produtos: request.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        valor_total: request.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        
        // Pagamento
        forma_pagamento: '0', // 0=À vista
        meio_pagamento: this.mapPaymentMethodCodeSefaz(request.paymentMethod),
        
        // Informações adicionais
        ...(request.additionalInfo && { informacoes_complementares: request.additionalInfo }),
      };

      // Usar httpClient criado no início do método (com timeout maior para NF-e)
      httpClient.defaults.timeout = 60000; // 60 segundos (NF-e pode demorar mais que NFC-e)
      const response: AxiosResponse = await httpClient.post(endpoint, payload);

      this.logger.log('NFe generated successfully via Focus NFe');

      return {
        success: true,
        documentNumber: response.data.numero || '',
        accessKey: response.data.chave_nfe || response.data.chave_acesso || '',
        status: response.data.status || 'processando',
        xmlContent: response.data.caminho_xml_nota_fiscal || '',
        pdfUrl: response.data.caminho_danfe || '',
      };
    } catch (error) {
      this.logger.error('Error in generateNFeFocusNFe:', error);
      
      if (error.response?.data) {
        const focusError = error.response.data;
        throw new BadRequestException(
          focusError.mensagem || 
          focusError.erro || 
          JSON.stringify(focusError)
        );
      }
      
      throw new BadRequestException(
        error.message || 'Erro ao gerar NF-e no Focus NFe'
      );
    }
  }

  /**
   * Mapear regime tributário para código CRT (Código de Regime Tributário)
   */
  private mapTaxRegime(taxRegime: string | null | undefined): string {
    if (!taxRegime) return '1'; // Default: Simples Nacional
    
    const mapping = {
      'SIMPLES_NACIONAL': '1', // 1=Simples Nacional
      'LUCRO_PRESUMIDO': '2',  // 2=Lucro Presumido
      'LUCRO_REAL': '3',       // 3=Lucro Real
      'MEI': '4',              // 4=MEI
    };
    
    return mapping[taxRegime.toUpperCase() as keyof typeof mapping] || '1';
  }

  /**
   * Mapear forma de pagamento para código SEFAZ
   */
  private mapPaymentMethodCodeSefaz(method: string): string {
    const mapping = {
      '01': '01', // Dinheiro
      '02': '02', // Cheque
      '03': '03', // Cartão de Crédito
      '04': '04', // Cartão de Débito
      '05': '05', // Crédito Loja
      '10': '10', // Vale Alimentação
      '11': '11', // Vale Refeição
      '12': '12', // Vale Presente
      '13': '13', // Vale Combustível
      '15': '15', // Boleto Bancário
      '16': '16', // Depósito Bancário
      '17': '17', // PIX
      '18': '18', // Transferência Bancária
      '19': '19', // Cashback
      '90': '90', // Sem Pagamento
      '99': '99', // Outros
    };
    
    return mapping[method] || '99'; // Default: Outros
  }

  private mapPaymentMethods(paymentMethods: string[]): any {
    // Map internal payment methods to fiscal API format
    const mapping = {
      'cash': { tipo: '01', valor: 0 }, // Dinheiro
      'credit_card': { tipo: '03', valor: 0 }, // Cartão de Crédito
      'debit_card': { tipo: '04', valor: 0 }, // Cartão de Débito
      'pix': { tipo: '99', valor: 0 }, // PIX
      'installment': { tipo: '03', valor: 0 }, // Cartão de Crédito (parcelado)
    };

    return paymentMethods.map(method => mapping[method] || { tipo: '99', valor: 0 });
  }

  async uploadCertificate(certificatePath: string, password: string): Promise<boolean> {
    try {
      if (!fs.existsSync(certificatePath)) {
        throw new BadRequestException('Certificado não encontrado');
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
    } catch (error) {
      this.logger.error('Error uploading certificate:', error);
      return false;
    }
  }

  async getFiscalStatus(): Promise<{ provider: string; status: string; environment: string }> {
    try {
      const response = await this.httpClient.get('/status');
      return {
        provider: this.config.provider,
        status: 'Connected',
        environment: this.config.environment,
      };
    } catch (error) {
      return {
        provider: this.config.provider,
        status: 'Disconnected',
        environment: this.config.environment,
      };
    }
  }
}

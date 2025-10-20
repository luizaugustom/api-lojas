import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

@Injectable()
export class FiscalApiService {
  private readonly logger = new Logger(FiscalApiService.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: FiscalApiConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadFiscalConfig();
    this.httpClient = this.createHttpClient();
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

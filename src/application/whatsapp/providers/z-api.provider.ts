import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { IWhatsAppProvider } from './whatsapp-provider.interface';

/**
 * Provider para Z-API
 * Melhor custo-benefício para produção
 * Documentação: https://developer.z-api.io/
 */
@Injectable()
export class ZApiProvider implements IWhatsAppProvider {
  private readonly logger = new Logger(ZApiProvider.name);
  private readonly apiUrl: string;
  private readonly instanceId: string;
  private readonly token: string;
  private readonly httpClient: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get('Z_API_URL', 'https://api.z-api.io').replace(/\/$/, '');
    this.instanceId = this.configService.get('Z_API_INSTANCE_ID', '');
    this.token = this.configService.get('Z_API_TOKEN', '');

    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': this.token,
      },
    });

    if (!this.instanceId || !this.token) {
      this.logger.warn('Z-API não configurada. Configure Z_API_INSTANCE_ID e Z_API_TOKEN no .env');
    } else {
      this.logger.log(`Z-API configurada: ${this.apiUrl} (Instance: ${this.instanceId})`);
    }
  }

  async checkConnection(): Promise<{ connected: boolean; status?: string }> {
    try {
      if (!this.instanceId || !this.token) {
        return { connected: false, status: 'not_configured' };
      }

      // Verificar status da instância
      // Z-API pode usar diferentes endpoints, tentamos o mais comum
      const url = `${this.apiUrl}/instances/${this.instanceId}/status`;
      
      try {
        const response = await this.httpClient.get(url);

        if (response.status === 200 && response.data) {
          const status = response.data.status || response.data.connected || response.data.state;
          const connected = status === 'connected' || status === 'open' || response.data.connected === true;
          return { connected, status: status || 'unknown' };
        }
      } catch (error) {
        // Se o endpoint de status não existir, tentamos verificar via envio de teste
        // ou assumimos que está conectado se as credenciais estão configuradas
        this.logger.debug(`Endpoint de status não disponível, assumindo conectado se credenciais válidas`);
        return { connected: true, status: 'assumed_connected' };
      }

      return { connected: false, status: 'unknown' };
    } catch (error) {
      this.logger.warn(`Erro ao verificar status da Z-API: ${error.message}`);
      // Em caso de erro, assumimos que pode estar conectado (não bloqueamos envio)
      return { connected: true, status: 'check_failed' };
    }
  }

  async sendMessage(phone: string, message: string): Promise<boolean> {
    try {
      if (!this.instanceId || !this.token) {
        this.logger.warn('Z-API não configurada. Verifique Z_API_INSTANCE_ID e Z_API_TOKEN no .env');
        return false;
      }

      // Formatar telefone
      const formattedPhone = await this.formatPhoneNumber(phone);

      // Z-API pode usar diferentes formatos de URL
      // Tentamos o formato mais comum primeiro
      let url = `${this.apiUrl}/instances/${this.instanceId}/token/${this.token}/send-text`;
      let payload: any = {
        phone: formattedPhone,
        message: message,
      };

      // Algumas versões da Z-API usam formato diferente
      let response;
      try {
        response = await this.httpClient.post(url, payload);
      } catch (error) {
        // Tentar formato alternativo
        if (error.response?.status === 404) {
          // Tentar sem o token na URL (usando header)
          url = `${this.apiUrl}/instances/${this.instanceId}/send-text`;
          response = await this.httpClient.post(url, payload);
        } else {
          throw error;
        }
      }

      if (response.status === 200 || response.status === 201) {
        this.logger.log(`✅ Mensagem Z-API enviada com sucesso | Destino: ${formattedPhone} | Status: ${response.status}`);
        return true;
      }

      this.logger.warn(`⚠️ Resposta inesperada da Z-API | Status: ${response.status} | Destino: ${formattedPhone}`);
      return false;
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar mensagem via Z-API | Destino: ${phone}`, error.message);
      
      if (error.response) {
        this.logger.error(`📊 Detalhes do erro | Status: ${error.response.status} | Resposta: ${JSON.stringify(error.response.data)}`);
        
        // Se for erro 401, credenciais inválidas
        if (error.response.status === 401) {
          this.logger.error(`🔐 Erro de autenticação. Verifique Z_API_TOKEN`);
        }
        
        // Se for erro 404, endpoint pode estar errado
        if (error.response.status === 404) {
          this.logger.error(`🔍 Endpoint não encontrado. Verifique Z_API_INSTANCE_ID e formato da URL`);
        }
      }
      
      return false;
    }
  }

  async validatePhoneNumber(phone: string): Promise<boolean> {
    // Validação básica de telefone brasileiro
    const phoneRegex = /^(\+55)?[\s]?[1-9]{2}[\s]?[9]?[\d]{4}[\s]?[\d]{4}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }

  async formatPhoneNumber(phone: string): Promise<string> {
    // Remove todos os caracteres não numéricos
    const digits = phone.replace(/\D/g, '');
    
    // Adiciona código do país se não estiver presente
    if (digits.length === 11) {
      return `55${digits}`;
    } else if (digits.length === 13 && digits.startsWith('55')) {
      return digits;
    }
    
    throw new Error('Número de telefone inválido');
  }
}


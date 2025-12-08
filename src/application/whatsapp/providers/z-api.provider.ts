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
  private readonly clientToken: string;
  private readonly httpClient: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get('Z_API_URL', 'https://api.z-api.io').replace(/\/$/, '');
    this.instanceId = this.configService.get('Z_API_INSTANCE_ID', '');
    this.token = this.configService.get('Z_API_TOKEN', '');
    this.clientToken = this.configService.get('Z_API_CLIENT_TOKEN', '');

    this.httpClient = axios.create({
      timeout: 15000, // Timeout otimizado para 15s
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!this.instanceId || !this.token) {
      this.logger.warn('⚠️ Z-API não configurada. Configure Z_API_INSTANCE_ID e Z_API_TOKEN no .env');
      this.logger.warn('📖 Documentação: https://developer.z-api.io/');
    } else if (!this.clientToken) {
      this.logger.error('❌ Z-API: Client-Token OBRIGATÓRIO não configurado!');
      this.logger.error('🔑 Configure Z_API_CLIENT_TOKEN no .env');
      this.logger.error('📖 Veja: https://developer.z-api.io/security/client-token');
    } else {
      this.logger.log(`✅ Z-API configurada: ${this.apiUrl} (Instance: ${this.instanceId.substring(0, 8)}...)`);
      this.logger.log(`🔐 Client-Token configurado (${this.clientToken.substring(0, 8)}...)`);
    }
  }

  async checkConnection(): Promise<{ connected: boolean; status?: string }> {
    try {
      if (!this.instanceId || !this.token) {
        this.logger.warn('🔴 Z-API não configurada');
        return { connected: false, status: 'not_configured' };
      }

      // Endpoint correto da Z-API para verificar status
      const url = `${this.apiUrl}/instances/${this.instanceId}/token/${this.token}/status`;
      
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (this.clientToken) {
        headers['Client-Token'] = this.clientToken;
      }
      
      try {
        const response = await this.httpClient.get(url, {
          timeout: 10000, // Timeout menor para verificação de status
          headers,
        });

        if (response.status === 200 && response.data) {
          const status = response.data.status || response.data.connected || response.data.state;
          const connected = status === 'connected' || status === 'open' || response.data.connected === true;
          
          if (connected) {
            this.logger.log(`🟢 Z-API conectada | Status: ${status}`);
          } else {
            this.logger.warn(`🟡 Z-API não conectada | Status: ${status}`);
          }
          
          return { connected, status: status || 'unknown' };
        }
      } catch (error) {
        // Se o endpoint de status falhar, não bloqueamos o envio
        if (error.response?.status === 404) {
          this.logger.debug('⚠️ Endpoint de status não disponível, assumindo conectado');
          return { connected: true, status: 'assumed_connected' };
        }
        throw error;
      }

      return { connected: false, status: 'unknown' };
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao verificar status da Z-API: ${error.message}`);
      // Em caso de erro, assumimos que pode estar conectado (não bloqueamos envio)
      return { connected: true, status: 'check_failed' };
    }
  }

  async sendMessage(phone: string, message: string): Promise<boolean> {
    try {
      if (!this.instanceId || !this.token) {
        this.logger.error('🔴 Z-API não configurada. Verifique Z_API_INSTANCE_ID e Z_API_TOKEN no .env');
        return false;
      }
      
      if (!this.clientToken) {
        this.logger.error('🔴 Z-API: Client-Token OBRIGATÓRIO não configurado!');
        this.logger.error('🔑 Configure Z_API_CLIENT_TOKEN no .env');
        return false;
      }

      // Validar e formatar telefone
      const isValid = await this.validatePhoneNumber(phone);
      if (!isValid) {
        this.logger.error(`📵 Número de telefone inválido: ${phone}`);
        return false;
      }

      const formattedPhone = await this.formatPhoneNumber(phone);

      // Endpoint da Z-API - o token já está na URL
      const url = `${this.apiUrl}/instances/${this.instanceId}/token/${this.token}/send-text`;
      
      const payload = {
        phone: formattedPhone,
        message: message,
      };

      this.logger.debug(`📤 Enviando para Z-API | URL: ${url} | Telefone: ${formattedPhone} | Tamanho: ${message.length} chars`);
      this.logger.debug(`🔑 Token na URL: ${this.token?.substring(0, 8)}...`);
      this.logger.debug(`🔐 Client-Token: ${this.clientToken?.substring(0, 8)}...`);
      this.logger.debug(`📦 Payload: ${JSON.stringify(payload)}`);

      // Configurar headers com Client-Token (OBRIGATÓRIO segundo documentação Z-API)
      const headers: any = {
        'Content-Type': 'application/json',
        'Client-Token': this.clientToken,
      };
      
      this.logger.debug(`✅ Header Client-Token configurado`);

      const response = await this.httpClient.post(url, payload, { headers });

      // Verificar resposta bem-sucedida
      if (response.status === 200 || response.status === 201) {
        const messageId = response.data?.messageId || response.data?.id;
        this.logger.log(`✅ Mensagem Z-API enviada | Destino: ${formattedPhone} | Status: ${response.status}${messageId ? ` | ID: ${messageId}` : ''}`);
        return true;
      }

      this.logger.warn(`⚠️ Resposta inesperada da Z-API | Status: ${response.status} | Data: ${JSON.stringify(response.data)}`);
      return false;
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar mensagem via Z-API | Destino: ${phone}`);
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        this.logger.error(`📊 Status HTTP: ${status}`);
        this.logger.error(`📋 Resposta: ${JSON.stringify(data)}`);
        
        // Mensagens de erro específicas
        if (status === 401 || status === 403) {
          this.logger.error('🔐 Erro de autenticação. Verifique se o Z_API_TOKEN está correto');
        } else if (status === 404) {
          this.logger.error('🔍 Endpoint não encontrado. Verifique se o Z_API_INSTANCE_ID está correto');
        } else if (status === 400) {
          this.logger.error('📝 Dados inválidos. Verifique o formato do telefone e mensagem');
        } else if (status === 500) {
          this.logger.error('⚙️ Erro no servidor da Z-API. Tente novamente em alguns minutos');
        }
      } else if (error.code === 'ECONNABORTED') {
        this.logger.error('⏱️ Timeout ao conectar com Z-API. Verifique sua conexão');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        this.logger.error('🌐 Não foi possível conectar à Z-API. Verifique a URL configurada');
      } else {
        this.logger.error(`⚠️ Erro: ${error.message}`);
      }
      
      return false;
    }
  }

  async validatePhoneNumber(phone: string): Promise<boolean> {
    // Remove caracteres não numéricos
    const digits = phone.replace(/\D/g, '');
    
    // Validação para telefones brasileiros
    // Aceita: 11 dígitos (DDD + 9 + número) ou 13 dígitos (55 + DDD + 9 + número)
    if (digits.length === 11) {
      // Formato: 11987654321 (DDD + 9 dígitos)
      const ddd = parseInt(digits.substring(0, 2));
      const firstDigit = digits[2];
      // DDD válido (11-99) e primeiro dígito do número deve ser 9 para celular
      return ddd >= 11 && ddd <= 99 && (firstDigit === '9' || firstDigit === '8' || firstDigit === '7');
    } else if (digits.length === 13 && digits.startsWith('55')) {
      // Formato: 5511987654321 (55 + DDD + 9 dígitos)
      const ddd = parseInt(digits.substring(2, 4));
      const firstDigit = digits[4];
      return ddd >= 11 && ddd <= 99 && (firstDigit === '9' || firstDigit === '8' || firstDigit === '7');
    } else if (digits.length === 10) {
      // Formato antigo sem o 9: 1187654321 (DDD + 8 dígitos)
      const ddd = parseInt(digits.substring(0, 2));
      return ddd >= 11 && ddd <= 99;
    } else if (digits.length === 12 && digits.startsWith('55')) {
      // Formato antigo sem o 9: 551187654321 (55 + DDD + 8 dígitos)
      const ddd = parseInt(digits.substring(2, 4));
      return ddd >= 11 && ddd <= 99;
    }
    
    this.logger.warn(`📵 Número com formato inválido: ${digits} (${digits.length} dígitos)`);
    return false;
  }

  async formatPhoneNumber(phone: string): Promise<string> {
    // Remove todos os caracteres não numéricos
    const digits = phone.replace(/\D/g, '');
    
    // Adiciona código do país se não estiver presente
    if (digits.length === 11) {
      // 11987654321 -> 5511987654321
      return `55${digits}`;
    } else if (digits.length === 13 && digits.startsWith('55')) {
      // Já está no formato correto
      return digits;
    } else if (digits.length === 10) {
      // Formato antigo sem o 9: 1187654321 -> 551187654321
      return `55${digits}`;
    } else if (digits.length === 12 && digits.startsWith('55')) {
      // Formato antigo com 55: 551187654321 -> mantém
      return digits;
    }
    
    throw new Error(`Não foi possível formatar o número: ${phone} (${digits.length} dígitos)`);
  }
}


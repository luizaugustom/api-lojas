import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface IBPTTaxData {
  ncm: string;
  description: string;
  nacionalFederal: number;  // Alíquota federal
  importadosFederal: number; // Alíquota federal importados
  estadual: number;         // Alíquota estadual
  municipal: number;        // Alíquota municipal
  vigenciaInicio: string;
  vigenciaFim: string;
  chave: string;
  versao: string;
  fonte: string;
}

export interface TaxCalculationResult {
  ncm: string;
  totalTaxPercentage: number;
  federalTaxPercentage: number;
  stateTaxPercentage: number;
  municipalTaxPercentage: number;
  taxValue: number;
  productValue: number;
  source: string;
}

@Injectable()
export class IBPTService {
  private readonly logger = new Logger(IBPTService.name);
  private readonly httpClient: AxiosInstance;
  private readonly ibptToken: string;
  private readonly ibptCnpj: string;
  private readonly defaultStateUf: string;
  
  // Cache em memória para reduzir chamadas à API
  private taxCache: Map<string, { data: IBPTTaxData; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

  constructor(private readonly configService: ConfigService) {
    this.ibptToken = this.configService.get('IBPT_TOKEN', '');
    this.ibptCnpj = this.configService.get('COMPANY_CNPJ', '');
    this.defaultStateUf = this.configService.get('COMPANY_STATE_UF', 'SC');

    this.httpClient = axios.create({
      baseURL: 'https://apidoni.ibpt.org.br/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Calcula os tributos aproximados de um produto baseado no NCM
   */
  async calculateProductTax(
    ncm: string,
    productValue: number,
    stateUf: string = this.defaultStateUf,
  ): Promise<TaxCalculationResult> {
    try {
      // Se não tiver token configurado, usar cálculo estimado
      if (!this.ibptToken) {
        this.logger.warn('IBPT_TOKEN não configurado, usando cálculo estimado');
        return this.calculateEstimatedTax(ncm, productValue);
      }

      // Verificar cache
      const cacheKey = `${ncm}-${stateUf}`;
      const cached = this.taxCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        this.logger.debug(`Usando dados em cache para NCM ${ncm}`);
        return this.buildTaxResult(cached.data, productValue);
      }

      // Buscar dados do IBPT
      const taxData = await this.fetchIBPTData(ncm, stateUf);
      
      if (taxData) {
        // Armazenar em cache
        this.taxCache.set(cacheKey, {
          data: taxData,
          timestamp: Date.now(),
        });
        
        return this.buildTaxResult(taxData, productValue);
      }

      // Fallback para cálculo estimado
      return this.calculateEstimatedTax(ncm, productValue);
    } catch (error) {
      this.logger.error(`Erro ao calcular tributos para NCM ${ncm}:`, error);
      return this.calculateEstimatedTax(ncm, productValue);
    }
  }

  /**
   * Busca dados do IBPT via API
   */
  private async fetchIBPTData(
    ncm: string,
    stateUf: string,
  ): Promise<IBPTTaxData | null> {
    try {
      const response = await this.httpClient.get('/produtos', {
        params: {
          token: this.ibptToken,
          cnpj: this.ibptCnpj,
          codigo: ncm,
          uf: stateUf,
          ex: 0, // Exceção da TIPI (normalmente 0)
        },
      });

      if (response.data && response.data.Codigo) {
        return {
          ncm: response.data.Codigo,
          description: response.data.Descricao || '',
          nacionalFederal: parseFloat(response.data.Nacional || 0),
          importadosFederal: parseFloat(response.data.Importado || 0),
          estadual: parseFloat(response.data.Estadual || 0),
          municipal: parseFloat(response.data.Municipal || 0),
          vigenciaInicio: response.data.VigenciaInicio || '',
          vigenciaFim: response.data.VigenciaFim || '',
          chave: response.data.Chave || '',
          versao: response.data.Versao || '',
          fonte: response.data.Fonte || 'IBPT',
        };
      }

      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        this.logger.warn(`NCM ${ncm} não encontrado na tabela IBPT`);
      } else {
        this.logger.error('Erro ao consultar API IBPT:', error.message);
      }
      return null;
    }
  }

  /**
   * Constrói resultado a partir dos dados do IBPT
   */
  private buildTaxResult(
    taxData: IBPTTaxData,
    productValue: number,
  ): TaxCalculationResult {
    const totalPercentage = 
      taxData.nacionalFederal + 
      taxData.estadual + 
      taxData.municipal;

    const taxValue = (productValue * totalPercentage) / 100;

    return {
      ncm: taxData.ncm,
      totalTaxPercentage: totalPercentage,
      federalTaxPercentage: taxData.nacionalFederal,
      stateTaxPercentage: taxData.estadual,
      municipalTaxPercentage: taxData.municipal,
      taxValue: taxValue,
      productValue: productValue,
      source: 'IBPT',
    };
  }

  /**
   * Calcula tributos estimados quando não há conexão com IBPT
   * Usa média nacional de ~16,65% conforme dados históricos do IBPT
   */
  private calculateEstimatedTax(
    ncm: string,
    productValue: number,
  ): TaxCalculationResult {
    // Média nacional de tributos por categoria de NCM
    const estimatedPercentages: { [key: string]: number } = {
      // Alimentos e bebidas (capítulos 01-24)
      '01': 12.50, '02': 13.00, '03': 12.00, '04': 13.50,
      '16': 15.00, '17': 18.00, '18': 16.00, '19': 16.50,
      '20': 15.50, '21': 17.00, '22': 35.00, // Bebidas alcoólicas mais taxadas
      
      // Vestuário e têxteis (capítulos 50-63)
      '61': 16.00, '62': 16.50, '63': 15.50,
      
      // Calçados (capítulo 64)
      '64': 15.00,
      
      // Eletrônicos (capítulos 84-85)
      '84': 19.00, '85': 20.50,
      
      // Veículos (capítulos 87)
      '87': 25.00,
      
      // Perfumaria e cosméticos (capítulo 33)
      '33': 25.50,
      
      // Medicamentos (capítulo 30)
      '30': 18.00,
      
      // Padrão
      'default': 16.65,
    };

    // Obter os 2 primeiros dígitos do NCM (capítulo)
    const chapter = ncm.substring(0, 2);
    const estimatedTotal = estimatedPercentages[chapter] || estimatedPercentages['default'];

    // Distribuição aproximada: 70% federal, 20% estadual, 10% municipal
    const federal = estimatedTotal * 0.70;
    const state = estimatedTotal * 0.20;
    const municipal = estimatedTotal * 0.10;

    const taxValue = (productValue * estimatedTotal) / 100;

    return {
      ncm: ncm,
      totalTaxPercentage: estimatedTotal,
      federalTaxPercentage: federal,
      stateTaxPercentage: state,
      municipalTaxPercentage: municipal,
      taxValue: taxValue,
      productValue: productValue,
      source: 'ESTIMATED',
    };
  }

  /**
   * Calcula tributos para múltiplos produtos
   */
  async calculateMultipleProductsTax(
    products: Array<{ ncm: string; value: number }>,
    stateUf: string = this.defaultStateUf,
  ): Promise<TaxCalculationResult[]> {
    const results = await Promise.all(
      products.map(product => 
        this.calculateProductTax(product.ncm, product.value, stateUf)
      )
    );

    return results;
  }

  /**
   * Limpa cache de tributos
   */
  clearCache(): void {
    this.taxCache.clear();
    this.logger.log('Cache de tributos limpo');
  }

  /**
   * Verifica se o serviço IBPT está configurado e disponível
   */
  async checkIBPTAvailability(): Promise<boolean> {
    if (!this.ibptToken) {
      return false;
    }

    try {
      // Testar com um NCM comum (água mineral)
      const response = await this.httpClient.get('/produtos', {
        params: {
          token: this.ibptToken,
          cnpj: this.ibptCnpj,
          codigo: '22011000',
          uf: this.defaultStateUf,
          ex: 0,
        },
      });

      return response.status === 200;
    } catch (error) {
      this.logger.error('Serviço IBPT não disponível:', error);
      return false;
    }
  }
}



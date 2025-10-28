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
var IBPTService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IBPTService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let IBPTService = IBPTService_1 = class IBPTService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(IBPTService_1.name);
        this.taxCache = new Map();
        this.CACHE_TTL = 24 * 60 * 60 * 1000;
        this.ibptToken = this.configService.get('IBPT_TOKEN', '');
        this.ibptCnpj = this.configService.get('COMPANY_CNPJ', '');
        this.defaultStateUf = this.configService.get('COMPANY_STATE_UF', 'SC');
        this.httpClient = axios_1.default.create({
            baseURL: 'https://apidoni.ibpt.org.br/api/v1',
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    async calculateProductTax(ncm, productValue, stateUf = this.defaultStateUf) {
        try {
            if (!this.ibptToken) {
                this.logger.warn('IBPT_TOKEN não configurado, usando cálculo estimado');
                return this.calculateEstimatedTax(ncm, productValue);
            }
            const cacheKey = `${ncm}-${stateUf}`;
            const cached = this.taxCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
                this.logger.debug(`Usando dados em cache para NCM ${ncm}`);
                return this.buildTaxResult(cached.data, productValue);
            }
            const taxData = await this.fetchIBPTData(ncm, stateUf);
            if (taxData) {
                this.taxCache.set(cacheKey, {
                    data: taxData,
                    timestamp: Date.now(),
                });
                return this.buildTaxResult(taxData, productValue);
            }
            return this.calculateEstimatedTax(ncm, productValue);
        }
        catch (error) {
            this.logger.error(`Erro ao calcular tributos para NCM ${ncm}:`, error);
            return this.calculateEstimatedTax(ncm, productValue);
        }
    }
    async fetchIBPTData(ncm, stateUf) {
        try {
            const response = await this.httpClient.get('/produtos', {
                params: {
                    token: this.ibptToken,
                    cnpj: this.ibptCnpj,
                    codigo: ncm,
                    uf: stateUf,
                    ex: 0,
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
        }
        catch (error) {
            if (error.response?.status === 404) {
                this.logger.warn(`NCM ${ncm} não encontrado na tabela IBPT`);
            }
            else {
                this.logger.error('Erro ao consultar API IBPT:', error.message);
            }
            return null;
        }
    }
    buildTaxResult(taxData, productValue) {
        const totalPercentage = taxData.nacionalFederal +
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
    calculateEstimatedTax(ncm, productValue) {
        const estimatedPercentages = {
            '01': 12.50, '02': 13.00, '03': 12.00, '04': 13.50,
            '16': 15.00, '17': 18.00, '18': 16.00, '19': 16.50,
            '20': 15.50, '21': 17.00, '22': 35.00,
            '61': 16.00, '62': 16.50, '63': 15.50,
            '64': 15.00,
            '84': 19.00, '85': 20.50,
            '87': 25.00,
            '33': 25.50,
            '30': 18.00,
            'default': 16.65,
        };
        const chapter = ncm.substring(0, 2);
        const estimatedTotal = estimatedPercentages[chapter] || estimatedPercentages['default'];
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
    async calculateMultipleProductsTax(products, stateUf = this.defaultStateUf) {
        const results = await Promise.all(products.map(product => this.calculateProductTax(product.ncm, product.value, stateUf)));
        return results;
    }
    clearCache() {
        this.taxCache.clear();
        this.logger.log('Cache de tributos limpo');
    }
    async checkIBPTAvailability() {
        if (!this.ibptToken) {
            return false;
        }
        try {
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
        }
        catch (error) {
            this.logger.error('Serviço IBPT não disponível:', error);
            return false;
        }
    }
};
exports.IBPTService = IBPTService;
exports.IBPTService = IBPTService = IBPTService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], IBPTService);
//# sourceMappingURL=ibpt.service.js.map
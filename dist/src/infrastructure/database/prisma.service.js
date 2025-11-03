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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const config_1 = require("@nestjs/config");
const library_1 = require("@prisma/client/runtime/library");
function getDatabaseUrlWithPooling(configService, logger) {
    const databaseUrl = configService.get('DATABASE_URL') || '';
    if (!databaseUrl) {
        throw new Error('DATABASE_URL não está configurada');
    }
    try {
        const url = new URL(databaseUrl);
        const hasPooling = url.searchParams.has('pgbouncer') ||
            url.hostname.includes('pooler') ||
            url.hostname.includes('proxy') ||
            url.hostname.includes('prisma.net');
        if (hasPooling) {
            logger.log('Usando DATABASE_URL com connection pooling configurado');
            return databaseUrl;
        }
        const connectionLimit = configService.get('DATABASE_CONNECTION_LIMIT') || '2';
        if (url.protocol === 'postgresql:' || url.protocol === 'postgres:') {
            if (!url.searchParams.has('connection_limit')) {
                url.searchParams.set('connection_limit', connectionLimit);
                logger.log(`Connection pooling configurado: connection_limit=${connectionLimit}`);
            }
            if (!url.searchParams.has('pool_timeout')) {
                url.searchParams.set('pool_timeout', '10');
            }
            if (!url.searchParams.has('connect_timeout')) {
                url.searchParams.set('connect_timeout', '10');
            }
            if (!url.searchParams.has('statement_cache_size')) {
                url.searchParams.set('statement_cache_size', '0');
            }
            if (!url.searchParams.has('keepalive_idle')) {
                url.searchParams.set('keepalive_idle', '30');
            }
        }
        return url.toString();
    }
    catch (error) {
        logger.log('Usando DATABASE_URL fornecida (formato especial detectado)');
        return databaseUrl;
    }
}
function isConnectionError(error) {
    if (!(error instanceof Error)) {
        return false;
    }
    const errorMessage = error.message.toLowerCase();
    const connectionErrorKeywords = [
        'too many database connections',
        'remaining connection slots',
        'connection',
        'timeout',
        'econnreset',
        'enotfound',
        'etimedout',
        'socket',
        'network',
    ];
    return connectionErrorKeywords.some(keyword => errorMessage.includes(keyword)) ||
        (error instanceof library_1.PrismaClientKnownRequestError &&
            (error.code === 'P1001' || error.code === 'P1017'));
}
function isTooManyConnectionsError(error) {
    if (!(error instanceof Error)) {
        return false;
    }
    const errorMessage = error.message.toLowerCase();
    return errorMessage.includes('too many database connections') ||
        errorMessage.includes('remaining connection slots');
}
async function retryWithBackoff(operation, maxRetries, logger, operationName = 'Operation') {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            if (isConnectionError(error)) {
                if (attempt < maxRetries) {
                    const waitTime = Math.min(attempt * 1000, 5000);
                    logger.warn(`${operationName}: Erro de conexão (tentativa ${attempt}/${maxRetries}). ` +
                        `Tentando novamente em ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
            }
            throw error;
        }
    }
    throw lastError;
}
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor(configService) {
        const logger = new common_1.Logger(PrismaService_1.name);
        super({
            log: [
                {
                    emit: 'event',
                    level: 'query',
                },
                {
                    emit: 'event',
                    level: 'error',
                },
                {
                    emit: 'event',
                    level: 'info',
                },
                {
                    emit: 'event',
                    level: 'warn',
                },
            ],
            datasources: {
                db: {
                    url: getDatabaseUrlWithPooling(configService, logger),
                },
            },
        });
        this.configService = configService;
        this.logger = new common_1.Logger(PrismaService_1.name);
        this.maxRetries = parseInt(configService.get('DATABASE_RETRY_ATTEMPTS') || '3', 10);
    }
    async onModuleInit() {
        try {
            await retryWithBackoff(async () => {
                await this.$connect();
                return true;
            }, this.maxRetries, this.logger, 'Conexão inicial ao banco de dados');
            this.logger.log('Database connected successfully');
            this.setupConnectionErrorHandling();
        }
        catch (error) {
            this.logger.error('Failed to connect to database after retries:', error);
            if (isTooManyConnectionsError(error)) {
                const waitTime = 30000;
                this.logger.warn(`Erro de muitas conexões detectado. A aplicação iniciará em modo lazy connection. ` +
                    `Prisma conectará automaticamente quando necessário. ` +
                    `Tentando reconectar em background em ${waitTime / 1000} segundos...`);
                this.setupConnectionErrorHandling();
                setTimeout(async () => {
                    try {
                        await retryWithBackoff(async () => {
                            await this.$connect();
                            return true;
                        }, this.maxRetries, this.logger, 'Reconexão ao banco de dados');
                        this.logger.log('Reconexão ao banco de dados bem-sucedida');
                    }
                    catch (retryError) {
                        this.logger.warn('Falha na reconexão ao banco de dados. Prisma continuará em modo lazy connection.');
                    }
                }, waitTime);
                return;
            }
            if (isConnectionError(error)) {
                this.logger.warn('Erro de conexão detectado. A aplicação iniciará e tentará reconectar em background...');
                this.setupConnectionErrorHandling();
                setTimeout(async () => {
                    try {
                        await retryWithBackoff(async () => {
                            await this.$connect();
                            return true;
                        }, this.maxRetries, this.logger, 'Reconexão ao banco de dados');
                        this.logger.log('Reconexão ao banco de dados bem-sucedida');
                    }
                    catch (retryError) {
                        this.logger.warn('Falha na reconexão ao banco de dados. Prisma continuará em modo lazy connection.');
                    }
                }, 10000);
                return;
            }
            throw error;
        }
    }
    setupConnectionErrorHandling() {
        process.on('SIGINT', async () => {
            await this.$disconnect();
        });
        process.on('SIGTERM', async () => {
            await this.$disconnect();
        });
    }
    async onModuleDestroy() {
        try {
            await this.$disconnect();
            this.logger.log('Database disconnected');
        }
        catch (error) {
            this.logger.error('Error disconnecting from database:', error);
        }
    }
    async $executeRawWithRetry(query, ...values) {
        return retryWithBackoff(() => this.$executeRawUnsafe(query, ...values), this.maxRetries, this.logger, `$executeRaw: ${query.substring(0, 50)}...`);
    }
    async withRetry(operation, operationName = 'Operação do banco de dados') {
        return retryWithBackoff(operation, this.maxRetries, this.logger, operationName);
    }
    async cleanDatabase() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Cannot clean database in production');
        }
        const models = Reflect.ownKeys(this).filter(key => key[0] !== '_');
        return Promise.all(models.map((modelKey) => this[modelKey].deleteMany()));
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map
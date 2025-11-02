import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

/**
 * Obtém a URL do banco de dados com configuração de connection pooling
 * Adiciona connection_limit para limitar o número de conexões simultâneas
 * Para connection pooling em produção, recomenda-se usar:
 * - PgBouncer (connection pooling externo)
 * - Prisma Data Proxy (Prisma Accelerate)
 */
function getDatabaseUrlWithPooling(configService: ConfigService, logger: Logger): string {
  const databaseUrl = configService.get<string>('DATABASE_URL') || '';
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL não está configurada');
  }

  // Se a URL já contém parâmetros de pooling ou é uma URL de proxy, usa diretamente
  try {
    const url = new URL(databaseUrl);
    
    // Verifica se já tem configurações de pooling ou é um proxy
    const hasPooling = url.searchParams.has('pgbouncer') || 
                       url.hostname.includes('pooler') || 
                       url.hostname.includes('proxy') ||
                       url.hostname.includes('prisma.net');
    
    if (hasPooling) {
      logger.log('Usando DATABASE_URL com connection pooling configurado');
      return databaseUrl;
    }
    
    // Configurar connection_limit para PostgreSQL
    // Valor padrão: 5 conexões (conservador para evitar esgotamento)
    // Ajuste conforme necessário através da variável DATABASE_CONNECTION_LIMIT
    const connectionLimit = configService.get<string>('DATABASE_CONNECTION_LIMIT') || '5';
    
    // Apenas adiciona connection_limit se não existir e for PostgreSQL
    if (url.protocol === 'postgresql:' || url.protocol === 'postgres:') {
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', connectionLimit);
        logger.log(`Connection pooling configurado: connection_limit=${connectionLimit}`);
      }
      
      // Adicionar pool_timeout se não existir
      if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '10');
      }
      
      // Adicionar connect_timeout
      if (!url.searchParams.has('connect_timeout')) {
        url.searchParams.set('connect_timeout', '10');
      }
      
      // Configurações adicionais para melhor gerenciamento de conexões
      // statement_cache_size reduz o uso de memória e conexões
      if (!url.searchParams.has('statement_cache_size')) {
        url.searchParams.set('statement_cache_size', '0'); // 0 = desabilita cache de statements
      }
      
      // keepalive_idle ajuda a detectar conexões mortas mais rapidamente
      if (!url.searchParams.has('keepalive_idle')) {
        url.searchParams.set('keepalive_idle', '30');
      }
    }
    
    return url.toString();
  } catch (error) {
    // URL pode ser de um formato especial (ex: Prisma Data Proxy)
    logger.log('Usando DATABASE_URL fornecida (formato especial detectado)');
    return databaseUrl;
  }
}

/**
 * Verifica se o erro é relacionado a conexões do banco de dados
 */
function isConnectionError(error: unknown): boolean {
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
         (error instanceof PrismaClientKnownRequestError && 
          (error.code === 'P1001' || error.code === 'P1017'));
}

/**
 * Verifica se o erro é de "too many connections"
 * Nestes casos, não devemos tentar reconectar imediatamente
 */
function isTooManyConnectionsError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  
  const errorMessage = error.message.toLowerCase();
  return errorMessage.includes('too many database connections') ||
         errorMessage.includes('remaining connection slots');
}

/**
 * Função auxiliar para retry de operações com backoff exponencial
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  logger: Logger,
  operationName: string = 'Operation'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (isConnectionError(error)) {
        if (attempt < maxRetries) {
          const waitTime = Math.min(attempt * 1000, 5000); // Max 5 segundos
          logger.warn(
            `${operationName}: Erro de conexão (tentativa ${attempt}/${maxRetries}). ` +
            `Tentando novamente em ${waitTime}ms...`
          );
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      // Se não for erro de conexão ou excedeu tentativas, relança o erro
      throw error;
    }
  }
  
  throw lastError!;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly maxRetries: number;

  constructor(private readonly configService: ConfigService) {
    const logger = new Logger(PrismaService.name);
    
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
    
    this.maxRetries = parseInt(configService.get<string>('DATABASE_RETRY_ATTEMPTS') || '3', 10);

    // TODO: Fix Prisma event types
    /*
    this.$on('query', (e) => {
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      }
    });

    this.$on('error', (e) => {
      this.logger.error('Database error:', e);
    });

    this.$on('info', (e) => {
      this.logger.log(`Database info: ${e.message}`);
    });

    this.$on('warn', (e) => {
      this.logger.warn(`Database warning: ${e.message}`);
    });
    */
  }

  async onModuleInit() {
    try {
      // Tentar conectar com retry automático
      await retryWithBackoff(
        async () => {
          await this.$connect();
          return true;
        },
        this.maxRetries,
        this.logger,
        'Conexão inicial ao banco de dados'
      );
      
      this.logger.log('Database connected successfully');
      
      // Configurar tratamento de erros de conexão
      this.setupConnectionErrorHandling();
    } catch (error) {
      this.logger.error('Failed to connect to database after retries:', error);
      
      // Se for erro de "too many connections", aguardar mais tempo antes de tentar novamente
      if (isTooManyConnectionsError(error)) {
        const waitTime = 30000; // 30 segundos para aguardar que conexões sejam liberadas
        this.logger.warn(
          `Erro de muitas conexões detectado. Aguardando ${waitTime / 1000} segundos antes de tentar novamente...`
        );
        
        setTimeout(async () => {
          try {
            await retryWithBackoff(
              async () => {
                await this.$connect();
                return true;
              },
              this.maxRetries,
              this.logger,
              'Reconexão ao banco de dados'
            );
            this.logger.log('Reconexão ao banco de dados bem-sucedida');
          } catch (retryError) {
            this.logger.error('Falha na reconexão ao banco de dados:', retryError);
          }
        }, waitTime);
      } else if (isConnectionError(error)) {
        // Para outros erros de conexão, tentar reconectar após 10 segundos
        this.logger.warn('Tentando reconectar ao banco de dados em 10 segundos...');
        setTimeout(async () => {
          try {
            await retryWithBackoff(
              async () => {
                await this.$connect();
                return true;
              },
              this.maxRetries,
              this.logger,
              'Reconexão ao banco de dados'
            );
            this.logger.log('Reconexão ao banco de dados bem-sucedida');
          } catch (retryError) {
            this.logger.error('Falha na reconexão ao banco de dados:', retryError);
          }
        }, 10000);
      }
      
      throw error;
    }
  }

  private setupConnectionErrorHandling() {
    // Interceptar erros de conexão e tentar reconectar
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
    } catch (error) {
      this.logger.error('Error disconnecting from database:', error);
    }
  }
  
  /**
   * Método auxiliar para executar queries com retry automático
   * em caso de erro de conexão. Usa retry logic com backoff exponencial.
   */
  async $executeRawWithRetry<T>(
    query: string,
    ...values: any[]
  ): Promise<T> {
    return retryWithBackoff(
      () => this.$executeRawUnsafe(query, ...values) as Promise<T>,
      this.maxRetries,
      this.logger,
      `$executeRaw: ${query.substring(0, 50)}...`
    );
  }
  
  /**
   * Wrapper para operações do Prisma com retry automático
   * Use este método quando precisar de retry explícito em operações críticas
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'Operação do banco de dados'
  ): Promise<T> {
    return retryWithBackoff(operation, this.maxRetries, this.logger, operationName);
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this).filter(key => key[0] !== '_');
    
    return Promise.all(
      models.map((modelKey) => this[modelKey].deleteMany()),
    );
  }
}

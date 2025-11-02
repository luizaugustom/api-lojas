import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule - Módulo global para gerenciamento de conexões do banco de dados
 * 
 * IMPORTANTE: Este módulo é marcado como @Global() para garantir que apenas
 * uma instância do PrismaService seja criada em toda a aplicação, prevenindo
 * o esgotamento de conexões do banco de dados.
 * 
 * O NestJS gerencia automaticamente o ciclo de vida do PrismaService como singleton
 * através do decorator @Injectable().
 * 
 * Para ambientes de produção com alta carga, considere:
 * - Usar PgBouncer como connection pooler externo
 * - Usar Prisma Data Proxy (Prisma Accelerate)
 * - Configurar DATABASE_URL com connection pooling adequado
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

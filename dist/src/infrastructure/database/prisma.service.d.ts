import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private readonly maxRetries;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private setupConnectionErrorHandling;
    onModuleDestroy(): Promise<void>;
    $executeRawWithRetry<T>(query: string, ...values: any[]): Promise<T>;
    withRetry<T>(operation: () => Promise<T>, operationName?: string): Promise<T>;
    cleanDatabase(): Promise<any>;
}

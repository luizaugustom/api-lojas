import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', '*'),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Rate limiting
  app.use((req, res, next) => {
    // Basic rate limiting middleware
    const rateLimit = require('express-rate-limit')({
      windowMs: configService.get('THROTTLE_TTL', 60) * 1000,
      max: configService.get('THROTTLE_LIMIT', 100),
      message: 'Too many requests from this IP',
    });
    rateLimit(req, res, next);
  });

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('API Lojas SaaS')
    .setDescription('API completa para sistema SaaS de lojas')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação')
    .addTag('admin', 'Administração')
    .addTag('company', 'Empresas')
    .addTag('seller', 'Vendedores')
    .addTag('product', 'Produtos')
    .addTag('sale', 'Vendas')
    .addTag('customer', 'Clientes')
    .addTag('bill', 'Contas a Pagar')
    .addTag('cash', 'Fechamento de Caixa')
    .addTag('printer', 'Impressoras')
    .addTag('fiscal', 'Notas Fiscais')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);
  const configService = app.get(ConfigService);

  // Serve static files from uploads directory (override via env)
  const uploadsDir = process.env.UPLOADS_DIR || join(process.cwd(), 'uploads')
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  // Security - Configure helmet to allow images
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        },
      },
    })
  );
  app.use(compression());

  // CORS (credentials-compatible): when CORS_ORIGIN='*', reflect the request origin instead of '*'
  const corsOriginEnv = configService.get<string>('CORS_ORIGIN', '*');
  const corsOrigin = corsOriginEnv === '*'
    ? true // reflect request origin
    : corsOriginEnv.split(',').map((o) => o.trim());
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Cookie parser (required to read httpOnly refresh token cookie)
  app.use(cookieParser());

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
  // Rate limiting - create the limiter once during app initialization
  const rateLimit = require('express-rate-limit')({
    windowMs: configService.get('THROTTLE_TTL', 60) * 1000,
    max: configService.get('THROTTLE_LIMIT', 100),
    message: 'Too many requests from this IP',
  });
  app.use(rateLimit);

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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const helmet_1 = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const path_1 = require("path");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'uploads'), {
        prefix: '/uploads/',
    });
    app.use((0, helmet_1.default)());
    app.use(compression());
    const corsOriginEnv = configService.get('CORS_ORIGIN', '*');
    const corsOrigin = corsOriginEnv === '*'
        ? true
        : corsOriginEnv.split(',').map((o) => o.trim());
    app.enableCors({
        origin: corsOrigin,
        credentials: true,
    });
    app.use(cookieParser());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const rateLimit = require('express-rate-limit')({
        windowMs: configService.get('THROTTLE_TTL', 60) * 1000,
        max: configService.get('THROTTLE_LIMIT', 100),
        message: 'Too many requests from this IP',
    });
    app.use(rateLimit);
    const config = new swagger_1.DocumentBuilder()
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
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = configService.get('PORT', 3000);
    await app.listen(port);
    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map
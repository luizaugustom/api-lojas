import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AuthModule } from './application/auth/auth.module';
import { AdminModule } from './application/admin/admin.module';
import { CompanyModule } from './application/company/company.module';
import { SellerModule } from './application/seller/seller.module';
import { ProductModule } from './application/product/product.module';
import { SaleModule } from './application/sale/sale.module';
import { CustomerModule } from './application/customer/customer.module';
import { BillToPayModule } from './application/bill-to-pay/bill-to-pay.module';
import { CashClosureModule } from './application/cash-closure/cash-closure.module';
import { PrinterModule } from './application/printer/printer.module';
import { FiscalModule } from './application/fiscal/fiscal.module';
import { UploadModule } from './application/upload/upload.module';
import { WhatsappModule } from './application/whatsapp/whatsapp.module';
import { N8nModule } from './application/n8n/n8n.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get('THROTTLE_TTL', 60),
        limit: config.get('THROTTLE_LIMIT', 100),
      }),
    }),
    PrismaModule,
    AuthModule,
    AdminModule,
    CompanyModule,
    SellerModule,
    ProductModule,
    SaleModule,
    CustomerModule,
    BillToPayModule,
    CashClosureModule,
    PrinterModule,
    FiscalModule,
    UploadModule,
    WhatsappModule,
    N8nModule,
  ],
})
export class AppModule {}

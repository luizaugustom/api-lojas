import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { HashModule } from './shared/services/hash.module';
import { EmailModule } from './shared/services/email.module';
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
import { HealthModule } from './application/health/health.module';
import { ReportsModule } from './application/reports/reports.module';
import { DashboardModule } from './application/dashboard/dashboard.module';
import { InstallmentModule } from './application/installment/installment.module';
import { NotificationModule } from './application/notification/notification.module';
import { BudgetModule } from './application/budget/budget.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{
          ttl: parseInt(config.get('THROTTLE_TTL', '60')),
          limit: parseInt(config.get('THROTTLE_LIMIT', '100')),
        }]
      }),
    }),
    PrismaModule,
    HashModule,
    EmailModule,
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
    ReportsModule,
    DashboardModule,
    InstallmentModule,
    NotificationModule,
    BudgetModule,
    HealthModule,
  ],
})
export class AppModule {}

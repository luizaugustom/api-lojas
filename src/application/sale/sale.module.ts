import { Module } from '@nestjs/common';
import { SaleService } from './sale.service';
import { SaleController } from './sale.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { ProductModule } from '../product/product.module';
import { PrinterModule } from '../printer/printer.module';
import { FiscalModule } from '../fiscal/fiscal.module';
import { EmailModule } from '../../shared/services/email.module';
import { StoreCreditModule } from '../store-credit/store-credit.module';
import { NotificationModule } from '../notification/notification.module';
import { IBPTService } from '../../shared/services/ibpt.service';

@Module({
  imports: [PrismaModule, ProductModule, PrinterModule, FiscalModule, EmailModule, StoreCreditModule, NotificationModule],
  providers: [SaleService, IBPTService],
  controllers: [SaleController],
  exports: [SaleService],
})
export class SaleModule {}

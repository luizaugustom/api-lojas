import { Module } from '@nestjs/common';
import { SaleService } from './sale.service';
import { SaleController } from './sale.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { ProductModule } from '../product/product.module';
import { PrinterModule } from '../printer/printer.module';

@Module({
  imports: [PrismaModule, ProductModule, PrinterModule],
  providers: [SaleService],
  controllers: [SaleController],
  exports: [SaleService],
})
export class SaleModule {}

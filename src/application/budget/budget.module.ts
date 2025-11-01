import { Module, forwardRef } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PrinterModule } from '../printer/printer.module';
import { SaleModule } from '../sale/sale.module';

@Module({
  imports: [PrinterModule, forwardRef(() => SaleModule)],
  controllers: [BudgetController],
  providers: [BudgetService, PrismaService],
  exports: [BudgetService],
})
export class BudgetModule {}


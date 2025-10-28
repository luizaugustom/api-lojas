import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PrinterModule } from '../printer/printer.module';

@Module({
  imports: [PrinterModule],
  controllers: [BudgetController],
  providers: [BudgetService, PrismaService],
  exports: [BudgetService],
})
export class BudgetModule {}


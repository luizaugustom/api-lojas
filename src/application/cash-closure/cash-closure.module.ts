import { Module } from '@nestjs/common';
import { CashClosureService } from './cash-closure.service';
import { CashClosureController } from './cash-closure.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { PrinterModule } from '../printer/printer.module';

@Module({
  imports: [PrismaModule, PrinterModule],
  providers: [CashClosureService],
  controllers: [CashClosureController],
  exports: [CashClosureService],
})
export class CashClosureModule {}

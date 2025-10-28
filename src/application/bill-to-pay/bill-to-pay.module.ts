import { Module } from '@nestjs/common';
import { BillToPayService } from './bill-to-pay.service';
import { BillToPayController } from './bill-to-pay.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { PlanLimitsModule } from '../../shared/services/plan-limits.module';

@Module({
  imports: [PrismaModule, PlanLimitsModule],
  providers: [BillToPayService],
  controllers: [BillToPayController],
  exports: [BillToPayService],
})
export class BillToPayModule {}

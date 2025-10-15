import { Module } from '@nestjs/common';
import { BillToPayService } from './bill-to-pay.service';
import { BillToPayController } from './bill-to-pay.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BillToPayService],
  controllers: [BillToPayController],
  exports: [BillToPayService],
})
export class BillToPayModule {}

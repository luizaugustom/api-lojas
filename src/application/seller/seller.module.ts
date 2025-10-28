import { Module } from '@nestjs/common';
import { SellerService } from './seller.service';
import { SellerController } from './seller.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { HashModule } from '../../shared/services/hash.module';
import { PlanLimitsModule } from '../../shared/services/plan-limits.module';

@Module({
  imports: [PrismaModule, HashModule, PlanLimitsModule],
  providers: [SellerService],
  controllers: [SellerController],
  exports: [SellerService],
})
export class SellerModule {}

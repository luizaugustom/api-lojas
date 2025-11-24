import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { EmailModule } from '../../shared/services/email.module';
import { PlanLimitsModule } from '../../shared/services/plan-limits.module';

@Module({
  imports: [PrismaModule, EmailModule, PlanLimitsModule],
  providers: [CustomerService],
  controllers: [CustomerController],
  exports: [CustomerService],
})
export class CustomerModule {}

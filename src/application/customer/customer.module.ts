import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { EmailModule } from '../../shared/services/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [CustomerService],
  controllers: [CustomerController],
  exports: [CustomerService],
})
export class CustomerModule {}

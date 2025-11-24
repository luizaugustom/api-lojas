import { Module } from '@nestjs/common';
import { StoreCreditService } from './store-credit.service';
import { StoreCreditController } from './store-credit.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [StoreCreditService],
  controllers: [StoreCreditController],
  exports: [StoreCreditService],
})
export class StoreCreditModule {}


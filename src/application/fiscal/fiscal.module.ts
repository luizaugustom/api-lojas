import { Module } from '@nestjs/common';
import { FiscalService } from './fiscal.service';
import { FiscalController } from './fiscal.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [FiscalService],
  controllers: [FiscalController],
  exports: [FiscalService],
})
export class FiscalModule {}

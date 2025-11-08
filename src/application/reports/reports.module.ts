import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { FiscalModule } from '../fiscal/fiscal.module';

@Module({
  imports: [PrismaModule, FiscalModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}

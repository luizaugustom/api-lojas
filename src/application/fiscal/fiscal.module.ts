import { Module } from '@nestjs/common';
import { FiscalService } from './fiscal.service';
import { FiscalController } from './fiscal.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { FiscalApiService } from '../../shared/services/fiscal-api.service';
import { ValidationModule } from '../../shared/services/validation.module';
import { PlanLimitsModule } from '../../shared/services/plan-limits.module';
import { IBPTService } from '../../shared/services/ibpt.service';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    PrismaModule, 
    ConfigModule,
    ValidationModule,
    PlanLimitsModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    })
  ],
  providers: [FiscalService, FiscalApiService, IBPTService],
  controllers: [FiscalController],
  exports: [FiscalService, FiscalApiService],
})
export class FiscalModule {}

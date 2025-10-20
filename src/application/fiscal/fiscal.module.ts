import { Module } from '@nestjs/common';
import { FiscalService } from './fiscal.service';
import { FiscalController } from './fiscal.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { FiscalApiService } from '../../shared/services/fiscal-api.service';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    PrismaModule, 
    ConfigModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    })
  ],
  providers: [FiscalService, FiscalApiService],
  controllers: [FiscalController],
  exports: [FiscalService, FiscalApiService],
})
export class FiscalModule {}

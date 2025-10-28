import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { HashModule } from '../../shared/services/hash.module';
import { PlanLimitsModule } from '../../shared/services/plan-limits.module';
import { EncryptionService } from '../../shared/services/encryption.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [PrismaModule, HashModule, PlanLimitsModule, UploadModule],
  providers: [CompanyService, EncryptionService],
  controllers: [CompanyController],
  exports: [CompanyService],
})
export class CompanyModule {}

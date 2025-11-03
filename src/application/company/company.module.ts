import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { CompanyPublicController } from './company-public.controller';
import { TrialExpirationService } from './trial-expiration.service';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { HashModule } from '../../shared/services/hash.module';
import { PlanLimitsModule } from '../../shared/services/plan-limits.module';
import { EncryptionService } from '../../shared/services/encryption.service';
import { ValidationModule } from '../../shared/services/validation.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [PrismaModule, HashModule, PlanLimitsModule, ValidationModule, UploadModule],
  providers: [CompanyService, EncryptionService, TrialExpirationService],
  controllers: [CompanyController, CompanyPublicController],
  exports: [CompanyService],
})
export class CompanyModule {}

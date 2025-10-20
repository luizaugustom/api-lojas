import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { HashModule } from '../../shared/services/hash.module';

@Module({
  imports: [PrismaModule, HashModule],
  providers: [CompanyService],
  controllers: [CompanyController],
  exports: [CompanyService],
})
export class CompanyModule {}

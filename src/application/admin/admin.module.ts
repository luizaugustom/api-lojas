import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { HashService } from '../../shared/services/hash.service';
import { EncryptionService } from '../../shared/services/encryption.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  providers: [AdminService, HashService, EncryptionService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}

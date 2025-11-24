import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { ProductModule } from '../product/product.module';
import { EmailModule } from '../../shared/services/email.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [PrismaModule, ProductModule, EmailModule, ReportsModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationSchedulerService],
  exports: [NotificationService],
})
export class NotificationModule {}


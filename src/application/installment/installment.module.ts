import { Module } from '@nestjs/common';
import { InstallmentService } from './installment.service';
import { InstallmentController } from './installment.controller';
import { InstallmentMessagingService } from './installment-messaging.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsappModule],
  controllers: [InstallmentController],
  providers: [InstallmentService, InstallmentMessagingService, PrismaService],
  exports: [InstallmentService, InstallmentMessagingService],
})
export class InstallmentModule {}


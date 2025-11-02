import { Module } from '@nestjs/common';
import { InstallmentService } from './installment.service';
import { InstallmentController } from './installment.controller';
import { InstallmentMessagingService } from './installment-messaging.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsappModule],
  controllers: [InstallmentController],
  providers: [InstallmentService, InstallmentMessagingService],
  exports: [InstallmentService, InstallmentMessagingService],
})
export class InstallmentModule {}


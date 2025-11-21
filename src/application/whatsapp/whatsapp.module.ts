import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/database/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [WhatsappService],
  controllers: [WhatsappController],
  exports: [WhatsappService],
})
export class WhatsappModule {}

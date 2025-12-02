import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { ZApiProvider } from './providers/z-api.provider';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    ZApiProvider,
    WhatsappService,
  ],
  controllers: [WhatsappController],
  exports: [WhatsappService],
})
export class WhatsappModule {}

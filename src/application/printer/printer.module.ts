import { Module } from '@nestjs/common';
import { PrinterService } from './printer.service';
import { PrinterController } from './printer.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PrinterService],
  controllers: [PrinterController],
  exports: [PrinterService],
})
export class PrinterModule {}

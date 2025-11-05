import { Module } from '@nestjs/common';
import { PrinterService } from './printer.service';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { ThermalPrinterService } from '../../shared/services/thermal-printer.service';

@Module({
  imports: [PrismaModule],
  providers: [PrinterService, ThermalPrinterService],
  exports: [PrinterService],
})
export class PrinterModule {}


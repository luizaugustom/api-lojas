import { Module } from '@nestjs/common';
// import { ScheduleModule } from '@nestjs/schedule'; // Removido - Cron de verificação automática desabilitado
import { PrinterService } from './printer.service';
import { PrinterController } from './printer.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { PrinterDriverService } from '../../shared/services/printer-driver.service';
import { ThermalPrinterService } from '../../shared/services/thermal-printer.service';

@Module({
  imports: [
    PrismaModule,
    // ScheduleModule.forRoot(), // Removido - Cron de verificação automática desabilitado
  ],
  providers: [
    PrinterService,
    PrinterDriverService,
    ThermalPrinterService,
  ],
  controllers: [PrinterController],
  exports: [PrinterService],
})
export class PrinterModule {}

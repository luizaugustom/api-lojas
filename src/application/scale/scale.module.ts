import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { ScaleController } from './scale.controller';
import { ScaleService } from './scale.service';
import { ScaleDriverService } from '../../shared/services/scale-driver.service';

@Module({
  imports: [PrismaModule],
  controllers: [ScaleController],
  providers: [ScaleService, ScaleDriverService],
  exports: [ScaleService],
})
export class ScaleModule {}



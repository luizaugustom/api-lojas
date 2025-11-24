import { Module } from '@nestjs/common';
import { ProductLossService } from './product-loss.service';
import { ProductLossController } from './product-loss.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ProductLossService],
  controllers: [ProductLossController],
  exports: [ProductLossService],
})
export class ProductLossModule {}


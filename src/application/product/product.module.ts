import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ProductPhotoService } from './services/product-photo.service';
import { ProductPhotoValidationService } from './services/product-photo-validation.service';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { UploadModule } from '../upload/upload.module';
import { PlanLimitsModule } from '../../shared/services/plan-limits.module';

@Module({
  imports: [PrismaModule, UploadModule, PlanLimitsModule],
  providers: [
    ProductService,
    ProductPhotoService,
    ProductPhotoValidationService,
  ],
  controllers: [ProductController],
  exports: [ProductService],
})
export class ProductModule {}

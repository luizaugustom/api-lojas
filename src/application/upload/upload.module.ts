import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { ConfigModule } from '@nestjs/config';
import { FirebaseStorageService } from '../../shared/services/firebase-storage.service';

@Module({
  imports: [ConfigModule],
  providers: [UploadService, FirebaseStorageService],
  controllers: [UploadController],
  exports: [UploadService, FirebaseStorageService],
})
export class UploadModule {}

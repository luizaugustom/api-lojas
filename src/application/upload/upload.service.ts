import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadPath: string;
  private readonly maxFileSize: number;

  constructor(private readonly configService: ConfigService) {
    this.uploadPath = this.configService.get('UPLOAD_PATH', './uploads');
    this.maxFileSize = this.configService.get('MAX_FILE_SIZE', 10485760); // 10MB
    
    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadPath}`);
    }
  }

  async uploadFile(file: Express.Multer.File, subfolder?: string): Promise<string> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      
      // Create subfolder path if specified
      const uploadDir = subfolder ? path.join(this.uploadPath, subfolder) : this.uploadPath;
      
      // Ensure subfolder exists
      if (subfolder && !fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);

      // Write file
      fs.writeFileSync(filePath, file.buffer);

      // Return relative URL
      const relativePath = subfolder ? `${subfolder}/${fileName}` : fileName;
      const fileUrl = `/uploads/${relativePath}`;

      this.logger.log(`File uploaded successfully: ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      this.logger.error('Error uploading file:', error);
      throw new BadRequestException('Erro ao fazer upload do arquivo');
    }
  }

  async uploadMultipleFiles(files: Express.Multer.File[], subfolder?: string): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, subfolder));
    return Promise.all(uploadPromises);
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const fileName = fileUrl.replace('/uploads/', '');
      const filePath = path.join(this.uploadPath, fileName);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`File deleted successfully: ${fileUrl}`);
        return true;
      }

      this.logger.warn(`File not found: ${fileUrl}`);
      return false;
    } catch (error) {
      this.logger.error('Error deleting file:', error);
      return false;
    }
  }

  async deleteMultipleFiles(fileUrls: string[]): Promise<{ deleted: number; failed: number }> {
    const results = await Promise.allSettled(
      fileUrls.map(url => this.deleteFile(url))
    );

    const deleted = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;

    const failed = results.length - deleted;

    return { deleted, failed };
  }

  private validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `Arquivo muito grande. Tamanho máximo permitido: ${this.maxFileSize / 1024 / 1024}MB`
      );
    }

    // Check file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de arquivo não permitido. Apenas imagens (JPEG, PNG, GIF, WebP) são aceitas.'
      );
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        'Extensão de arquivo não permitida. Apenas .jpg, .jpeg, .png, .gif, .webp são aceitas.'
      );
    }
  }

  async getFileInfo(fileUrl: string): Promise<{ exists: boolean; size?: number; path?: string }> {
    try {
      const fileName = fileUrl.replace('/uploads/', '');
      const filePath = path.join(this.uploadPath, fileName);

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        return {
          exists: true,
          size: stats.size,
          path: filePath,
        };
      }

      return { exists: false };
    } catch (error) {
      this.logger.error('Error getting file info:', error);
      return { exists: false };
    }
  }

  async resizeImage(file: Express.Multer.File, maxWidth: number = 800, maxHeight: number = 600): Promise<Buffer> {
    // This would use a library like sharp for image resizing
    // For now, return the original buffer
    this.logger.log(`Image resizing requested: ${file.originalname} to ${maxWidth}x${maxHeight}`);
    return file.buffer;
  }

  async optimizeImage(file: Express.Multer.File): Promise<Buffer> {
    // This would use a library like sharp for image optimization
    // For now, return the original buffer
    this.logger.log(`Image optimization requested: ${file.originalname}`);
    return file.buffer;
  }

  getUploadPath(): string {
    return this.uploadPath;
  }

  getMaxFileSize(): number {
    return this.maxFileSize;
  }
}

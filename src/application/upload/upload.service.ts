import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseStorageService } from '../../shared/services/firebase-storage.service';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly maxFileSize: number;
  private readonly useFirebase: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly firebaseStorage: FirebaseStorageService,
  ) {
    this.maxFileSize = this.configService.get('MAX_FILE_SIZE', 10485760); // 10MB
    this.useFirebase = this.configService.get('USE_FIREBASE_STORAGE', 'true') === 'true';
    
    if (this.useFirebase) {
      this.logger.log('📦 Using Firebase Storage for file uploads');
    } else {
      this.logger.warn('⚠️ Firebase Storage disabled, using local storage');
    }
  }

  /**
   * Upload de arquivo único
   * Usa Firebase Storage com otimização automática de imagens
   */
  async uploadFile(file: Express.Multer.File, subfolder?: string): Promise<string> {
    try {
      this.validateFile(file);

      // Determinar preset de otimização baseado na subfolder
      const optimizationPreset = this.getOptimizationPreset(subfolder);

      // Upload para Firebase
      const result = await this.firebaseStorage.uploadFile(
        file,
        subfolder,
        optimizationPreset,
      );

      this.logger.log(
        `✅ File uploaded: ${result.url} (${(result.size / 1024).toFixed(1)}KB, ${((1 - result.compressionRatio) * 100).toFixed(1)}% compression)`,
      );

      return result.url;
    } catch (error) {
      this.logger.error('❌ Error uploading file:', error);
      throw new BadRequestException('Erro ao fazer upload do arquivo');
    }
  }

  /**
   * Upload de múltiplos arquivos
   */
  async uploadMultipleFiles(files: Express.Multer.File[], subfolder?: string): Promise<string[]> {
    const optimizationPreset = this.getOptimizationPreset(subfolder);
    
    const results = await this.firebaseStorage.uploadMultipleFiles(
      files,
      subfolder,
      optimizationPreset,
    );

    return results.map(result => result.url);
  }

  /**
   * Deletar arquivo
   */
  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      return await this.firebaseStorage.deleteFile(fileUrl);
    } catch (error) {
      this.logger.error('❌ Error deleting file:', error);
      return false;
    }
  }

  /**
   * Deletar múltiplos arquivos
   */
  async deleteMultipleFiles(fileUrls: string[]): Promise<{ deleted: number; failed: number }> {
    return await this.firebaseStorage.deleteMultipleFiles(fileUrls);
  }

  /**
   * Validar arquivo antes do upload
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `Arquivo muito grande. Tamanho máximo permitido: ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Validação de tipo de arquivo para imagens
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf', // Permitir PDFs para certificados
      'application/xml',
      'text/xml',
      'application/x-pkcs12', // Certificados digitais
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de arquivo não permitido. Aceitamos imagens (JPEG, PNG, GIF, WebP), PDFs, XML e certificados digitais.',
      );
    }
  }

  /**
   * Obter informações de um arquivo
   */
  async getFileInfo(fileUrl: string): Promise<{ exists: boolean; size?: number; contentType?: string }> {
    return await this.firebaseStorage.getFileInfo(fileUrl);
  }

  /**
   * Verificar se arquivo existe
   */
  async fileExists(fileUrl: string): Promise<boolean> {
    return await this.firebaseStorage.fileExists(fileUrl);
  }

  /**
   * Obter tamanho máximo de arquivo permitido
   */
  getMaxFileSize(): number {
    return this.maxFileSize;
  }

  /**
   * Determinar preset de otimização baseado no tipo de upload
   */
  private getOptimizationPreset(subfolder?: string) {
    if (!subfolder) {
      return this.firebaseStorage.getOptimizationPreset('document');
    }

    if (subfolder.includes('products')) {
      return this.firebaseStorage.getOptimizationPreset('product');
    }

    if (subfolder.includes('logos')) {
      return this.firebaseStorage.getOptimizationPreset('logo');
    }

    if (subfolder.includes('thumbnails')) {
      return this.firebaseStorage.getOptimizationPreset('thumbnail');
    }

    return this.firebaseStorage.getOptimizationPreset('document');
  }
}

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface UploadResult {
  url: string;
  fileName: string;
  size: number;
  originalSize: number;
  compressionRatio: number;
}

@Injectable()
export class FirebaseStorageService {
  private readonly logger = new Logger(FirebaseStorageService.name);
  private bucket: admin.storage.Storage;
  private readonly maxFileSize: number;
  private readonly defaultImageOptions: ImageOptimizationOptions = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 85,
    format: 'webp',
  };

  constructor(private readonly configService: ConfigService) {
    this.maxFileSize = this.configService.get('MAX_FILE_SIZE', 10485760); // 10MB
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Verificar se já foi inicializado
      if (admin.apps.length === 0) {
        const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
        const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
        const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
        const storageBucket = this.configService.get<string>('FIREBASE_STORAGE_BUCKET');

        if (!projectId || !clientEmail || !privateKey || !storageBucket) {
          throw new Error('Firebase credentials not configured. Please set FIREBASE_* environment variables.');
        }

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          storageBucket,
        });

        this.logger.log('✅ Firebase Admin SDK initialized successfully');
      }

      this.bucket = admin.storage();
      this.logger.log(`📦 Firebase Storage bucket configured: ${this.configService.get('FIREBASE_STORAGE_BUCKET')}`);
    } catch (error) {
      this.logger.error('❌ Error initializing Firebase:', error);
      throw error;
    }
  }

  /**
   * Upload de arquivo único com otimização automática de imagem
   */
  async uploadFile(
    file: Express.Multer.File,
    subfolder?: string,
    options?: ImageOptimizationOptions,
  ): Promise<UploadResult> {
    try {
      this.validateFile(file);

      const isImage = this.isImageFile(file);
      let buffer = file.buffer;
      let optimizedSize = file.size;
      const originalSize = file.size;

      // Otimizar imagem se for o caso
      if (isImage) {
        const optimizationOptions = { ...this.defaultImageOptions, ...options };
        buffer = await this.optimizeImage(file.buffer, optimizationOptions);
        optimizedSize = buffer.length;
        
        const compressionPercent = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
        this.logger.log(
          `🖼️ Image optimized: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${compressionPercent}% reduction)`,
        );
      }

      // Gerar nome único do arquivo
      const fileExtension = isImage && options?.format ? `.${options.format}` : path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = subfolder ? `${subfolder}/${fileName}` : fileName;

      // Upload para Firebase Storage
      const fileUpload = this.bucket.bucket().file(filePath);
      
      await fileUpload.save(buffer, {
        metadata: {
          contentType: isImage && options?.format ? `image/${options.format}` : file.mimetype,
          metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
            optimized: isImage.toString(),
          },
        },
        public: true, // Tornar arquivo público
      });

      // Obter URL pública
      const publicUrl = `https://storage.googleapis.com/${this.bucket.bucket().name}/${filePath}`;

      this.logger.log(`✅ File uploaded successfully: ${publicUrl}`);

      return {
        url: publicUrl,
        fileName: filePath,
        size: optimizedSize,
        originalSize,
        compressionRatio: originalSize > 0 ? optimizedSize / originalSize : 1,
      };
    } catch (error) {
      this.logger.error('❌ Error uploading file to Firebase:', error);
      throw new BadRequestException('Erro ao fazer upload do arquivo');
    }
  }

  /**
   * Upload de múltiplos arquivos
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    subfolder?: string,
    options?: ImageOptimizationOptions,
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, subfolder, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Deletar arquivo do Firebase Storage
   */
  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      // Extrair o caminho do arquivo da URL
      const fileName = this.extractFilePathFromUrl(fileUrl);
      
      if (!fileName) {
        this.logger.warn(`Invalid file URL: ${fileUrl}`);
        return false;
      }

      const file = this.bucket.bucket().file(fileName);
      await file.delete();

      this.logger.log(`✅ File deleted successfully: ${fileUrl}`);
      return true;
    } catch (error) {
      if (error.code === 404) {
        this.logger.warn(`File not found: ${fileUrl}`);
        return false;
      }
      this.logger.error('❌ Error deleting file from Firebase:', error);
      return false;
    }
  }

  /**
   * Deletar múltiplos arquivos
   */
  async deleteMultipleFiles(fileUrls: string[]): Promise<{ deleted: number; failed: number }> {
    const results = await Promise.allSettled(
      fileUrls.map(url => this.deleteFile(url)),
    );

    const deleted = results.filter(
      result => result.status === 'fulfilled' && result.value === true,
    ).length;

    const failed = results.length - deleted;

    this.logger.log(`🗑️ Deleted ${deleted}/${fileUrls.length} files (${failed} failed)`);
    return { deleted, failed };
  }

  /**
   * Otimizar imagem usando Sharp
   */
  private async optimizeImage(
    buffer: Buffer,
    options: ImageOptimizationOptions,
  ): Promise<Buffer> {
    const { maxWidth, maxHeight, quality, format } = options;

    let image = sharp(buffer);

    // Obter metadados da imagem
    const metadata = await image.metadata();

    // Redimensionar se necessário
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      image = image.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Converter e comprimir baseado no formato
    switch (format) {
      case 'jpeg':
        image = image.jpeg({ quality, progressive: true });
        break;
      case 'png':
        image = image.png({ quality, compressionLevel: 9 });
        break;
      case 'webp':
      default:
        image = image.webp({ quality });
        break;
    }

    return image.toBuffer();
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
  }

  /**
   * Verificar se o arquivo é uma imagem
   */
  private isImageFile(file: Express.Multer.File): boolean {
    const imageMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    return imageMimeTypes.includes(file.mimetype);
  }

  /**
   * Extrair caminho do arquivo da URL do Firebase
   */
  private extractFilePathFromUrl(url: string): string | null {
    try {
      // URL format: https://storage.googleapis.com/{bucket}/{path}
      const match = url.match(/https:\/\/storage\.googleapis\.com\/[^\/]+\/(.+)/);
      if (match && match[1]) {
        // Decodificar URL encoding
        return decodeURIComponent(match[1]);
      }

      // Formato alternativo: https://firebasestorage.googleapis.com/...
      const firebaseMatch = url.match(/\/o\/(.+?)\?/);
      if (firebaseMatch && firebaseMatch[1]) {
        return decodeURIComponent(firebaseMatch[1]);
      }

      return null;
    } catch (error) {
      this.logger.error('Error extracting file path from URL:', error);
      return null;
    }
  }

  /**
   * Verificar se um arquivo existe
   */
  async fileExists(fileUrl: string): Promise<boolean> {
    try {
      const fileName = this.extractFilePathFromUrl(fileUrl);
      if (!fileName) return false;

      const file = this.bucket.bucket().file(fileName);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      this.logger.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * Obter informações de um arquivo
   */
  async getFileInfo(fileUrl: string): Promise<{ exists: boolean; size?: number; contentType?: string }> {
    try {
      const fileName = this.extractFilePathFromUrl(fileUrl);
      if (!fileName) {
        return { exists: false };
      }

      const file = this.bucket.bucket().file(fileName);
      const [metadata] = await file.getMetadata();

      return {
        exists: true,
        size: typeof metadata.size === 'string' ? parseInt(metadata.size) : metadata.size,
        contentType: metadata.contentType,
      };
    } catch (error) {
      if (error.code === 404) {
        return { exists: false };
      }
      this.logger.error('Error getting file info:', error);
      return { exists: false };
    }
  }

  /**
   * Obter configurações de otimização para diferentes tipos de imagem
   */
  getOptimizationPreset(preset: 'thumbnail' | 'product' | 'logo' | 'document'): ImageOptimizationOptions {
    const presets: Record<string, ImageOptimizationOptions> = {
      thumbnail: {
        maxWidth: 300,
        maxHeight: 300,
        quality: 80,
        format: 'webp',
      },
      product: {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 85,
        format: 'webp',
      },
      logo: {
        maxWidth: 500,
        maxHeight: 500,
        quality: 90,
        format: 'png',
      },
      document: {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 90,
        format: 'jpeg',
      },
    };

    return presets[preset] || this.defaultImageOptions;
  }
}


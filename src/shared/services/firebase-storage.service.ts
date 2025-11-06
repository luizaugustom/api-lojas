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
  private storage: admin.storage.Storage;
  private bucketName: string;
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

      this.storage = admin.storage();
      this.bucketName = this.configService.get<string>('FIREBASE_STORAGE_BUCKET') || '';
      this.logger.log(`📦 Firebase Storage bucket configured: ${this.bucketName}`);
    } catch (error) {
      this.logger.error('❌ Error initializing Firebase:', error);
      throw error;
    }
  }

  /**
   * Obter instância do bucket
   */
  private getBucket() {
    return this.storage.bucket(this.bucketName);
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
      const bucket = this.getBucket();
      const fileUpload = bucket.file(filePath);
      
      // Fazer upload do arquivo
      await fileUpload.save(buffer, {
        metadata: {
          contentType: isImage && options?.format ? `image/${options.format}` : file.mimetype,
          metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
            optimized: isImage.toString(),
          },
        },
      });

      // Tornar arquivo público
      try {
        // Verificar se já é público antes de tentar tornar público
        const [metadata] = await fileUpload.getMetadata();
        const isPublic = metadata.acl?.some(rule => rule.entity === 'allUsers' && rule.role === 'READER');
        
        if (!isPublic) {
          await fileUpload.makePublic();
          this.logger.log(`✅ File made public: ${filePath}`);
        } else {
          this.logger.log(`ℹ️ File already public: ${filePath}`);
        }
      } catch (publicError) {
        // Log mas não falha se já for público ou se houver erro de permissão
        this.logger.warn(`⚠️ Could not make file public (may already be public or permission issue): ${publicError.message}`);
        // Continuar mesmo com erro, pois o arquivo pode já ser público ou as regras do bucket podem permitir acesso
      }

      // Obter URL pública usando o formato correto do Firebase Storage
      // O formato correto é: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
      const encodedPath = encodeURIComponent(filePath);
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${this.bucketName}/o/${encodedPath}?alt=media`;
      
      // Verificar se o arquivo está acessível (opcional, apenas para log)
      try {
        const [exists] = await fileUpload.exists();
        if (!exists) {
          this.logger.warn(`⚠️ File uploaded but may not be accessible: ${filePath}`);
        }
      } catch (checkError) {
        this.logger.warn(`Could not verify file existence: ${checkError.message}`);
      }

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
      this.logger.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        fileName: file.originalname,
        fileSize: file.size,
        mimetype: file.mimetype,
      });
      
      // Fornecer mensagem de erro mais específica
      if (error.code === 'ENOENT' || error.message?.includes('not found')) {
        throw new BadRequestException('Bucket do Firebase Storage não encontrado. Verifique as configurações.');
      } else if (error.code === 'EACCES' || error.message?.includes('permission')) {
        throw new BadRequestException('Sem permissão para fazer upload no Firebase Storage. Verifique as credenciais.');
      } else if (error.message?.includes('Firebase')) {
        throw new BadRequestException(`Erro no Firebase Storage: ${error.message}`);
      }
      
      throw new BadRequestException(`Erro ao fazer upload do arquivo: ${error.message || 'Erro desconhecido'}`);
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

      const bucket = this.getBucket();
      const file = bucket.file(fileName);
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
      // Formato novo: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
      const firebaseMatch = url.match(/\/o\/(.+?)(\?|$)/);
      if (firebaseMatch && firebaseMatch[1]) {
        return decodeURIComponent(firebaseMatch[1]);
      }

      // Formato antigo: https://storage.googleapis.com/{bucket}/{path}
      const storageMatch = url.match(/https:\/\/storage\.googleapis\.com\/[^\/]+\/(.+)/);
      if (storageMatch && storageMatch[1]) {
        // Decodificar URL encoding
        return decodeURIComponent(storageMatch[1]);
      }

      // Se a URL já é um caminho relativo (sem protocolo), retornar como está
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return url;
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

      const bucket = this.getBucket();
      const file = bucket.file(fileName);
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

      const bucket = this.getBucket();
      const file = bucket.file(fileName);
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


import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { PlanLimitsService } from '../../../shared/services/plan-limits.service';
import { 
  MAX_PRODUCT_PHOTOS, 
  PRODUCT_PHOTOS_BY_PLAN,
  ALLOWED_IMAGE_MIMETYPES,
  ALLOWED_IMAGE_EXTENSIONS,
  MAX_FILE_SIZE 
} from '../../../shared/constants/upload.constants';
import * as path from 'path';

@Injectable()
export class ProductPhotoValidationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimitsService: PlanLimitsService,
  ) {}

  /**
   * Valida se pode adicionar mais fotos ao produto
   */
  async validatePhotoLimit(
    companyId: string,
    currentPhotosCount: number,
    newPhotosCount: number,
  ): Promise<void> {
    // Validar se upload de fotos está habilitado
    await this.planLimitsService.validatePhotoUploadEnabled(companyId);

    // Validar limite de fotos por produto
    await this.planLimitsService.validatePhotoLimitPerProduct(
      companyId,
      currentPhotosCount,
      newPhotosCount,
    );
  }

  /**
   * Valida um arquivo de imagem
   */
  validateImageFile(file: Express.Multer.File): void {
    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(2);
      throw new BadRequestException(
        `Arquivo muito grande. Tamanho máximo permitido: ${sizeMB}MB`
      );
    }

    // Validar MIME type
    if (!ALLOWED_IMAGE_MIMETYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido. Use apenas: ${ALLOWED_IMAGE_MIMETYPES.join(', ')}`
      );
    }

    // Validar extensão
    const extension = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
      throw new BadRequestException(
        `Extensão de arquivo não permitida. Use apenas: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`
      );
    }
  }

  /**
   * Valida múltiplos arquivos
   */
  validateImageFiles(files: Express.Multer.File[]): void {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    files.forEach((file, index) => {
      try {
        this.validateImageFile(file);
      } catch (error) {
        throw new BadRequestException(
          `Erro no arquivo ${index + 1} (${file.originalname}): ${error.message}`
        );
      }
    });
  }

  /**
   * Obtém o número máximo de fotos permitido para uma empresa
   */
  async getMaxPhotosForCompany(companyId: string): Promise<number | null> {
    const limits = await this.planLimitsService.getCompanyLimits(companyId);
    return limits.maxPhotosPerProduct;
  }
}


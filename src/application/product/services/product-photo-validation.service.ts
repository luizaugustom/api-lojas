import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { PlanType } from '@prisma/client';
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
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida se pode adicionar mais fotos ao produto
   */
  async validatePhotoLimit(
    companyId: string,
    currentPhotosCount: number,
    newPhotosCount: number,
  ): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { plan: true },
    });

    if (!company) {
      throw new BadRequestException('Empresa não encontrada');
    }

    // Usar limite padrão de 3 fotos
    const maxPhotos = MAX_PRODUCT_PHOTOS;

    const totalPhotos = currentPhotosCount + newPhotosCount;

    if (totalPhotos > maxPhotos) {
      throw new BadRequestException(
        `Limite de fotos excedido. Você pode adicionar no máximo ${maxPhotos} foto(s) por produto. ` +
        `Atualmente: ${currentPhotosCount} foto(s), tentando adicionar: ${newPhotosCount}.`
      );
    }
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
   * Obtém o número máximo de fotos permitido para um plano
   */
  async getMaxPhotosForCompany(companyId: string): Promise<number> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { plan: true },
    });

    if (!company) {
      return MAX_PRODUCT_PHOTOS;
    }

    // Retornar limite padrão
    return MAX_PRODUCT_PHOTOS;
  }
}


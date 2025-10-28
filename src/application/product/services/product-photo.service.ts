import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { UploadService } from '../../upload/upload.service';
import { ProductPhotoValidationService } from './product-photo-validation.service';
import { PRODUCT_PHOTOS_SUBFOLDER } from '../../../shared/constants/upload.constants';

@Injectable()
export class ProductPhotoService {
  private readonly logger = new Logger(ProductPhotoService.name);

  constructor(
    private readonly uploadService: UploadService,
    private readonly validationService: ProductPhotoValidationService,
  ) {}

  /**
   * Faz upload de fotos de produto com validação
   */
  async uploadProductPhotos(
    companyId: string,
    files: Express.Multer.File[],
    currentPhotosCount: number = 0,
  ): Promise<string[]> {
    this.logger.log(`📸 Iniciando upload de ${files.length} foto(s) para produto da empresa ${companyId}`);

    // Validar arquivos
    this.validationService.validateImageFiles(files);

    // Validar limite de fotos
    await this.validationService.validatePhotoLimit(
      companyId,
      currentPhotosCount,
      files.length,
    );

    // Fazer upload com subfolder específica
    const subfolder = `${PRODUCT_PHOTOS_SUBFOLDER}/${companyId}`;
    const photoUrls = await this.uploadService.uploadMultipleFiles(files, subfolder);

    this.logger.log(`✅ Upload concluído: ${photoUrls.length} foto(s)`);
    return photoUrls;
  }

  /**
   * Remove fotos de produto do sistema de arquivos
   */
  async deleteProductPhotos(photoUrls: string[]): Promise<void> {
    if (!photoUrls || photoUrls.length === 0) {
      return;
    }

    this.logger.log(`🗑️ Removendo ${photoUrls.length} foto(s)`);

    for (const photoUrl of photoUrls) {
      try {
        await this.uploadService.deleteFile(photoUrl);
      } catch (error) {
        this.logger.warn(`Erro ao remover foto ${photoUrl}: ${error.message}`);
        // Continuar mesmo com erro para não interromper o processo
      }
    }

    this.logger.log(`✅ Remoção concluída`);
  }

  /**
   * Valida e prepara fotos para criação/atualização de produto
   */
  async prepareProductPhotos(
    companyId: string,
    newFiles: Express.Multer.File[],
    existingPhotos: string[] = [],
    photosToDelete: string[] = [],
  ): Promise<string[]> {
    // Remover fotos marcadas para exclusão
    const remainingPhotos = existingPhotos.filter(
      (photo) => !photosToDelete.includes(photo)
    );

    // Calcular quantas fotos novas podem ser adicionadas
    const currentCount = remainingPhotos.length;
    const maxPhotos = await this.validationService.getMaxPhotosForCompany(companyId);
    const availableSlots = maxPhotos - currentCount;

    if (newFiles.length > availableSlots) {
      throw new BadRequestException(
        `Você pode adicionar apenas ${availableSlots} foto(s). ` +
        `Limite: ${maxPhotos}, Atual: ${currentCount}`
      );
    }

    // Upload de novas fotos
    let newPhotoUrls: string[] = [];
    if (newFiles.length > 0) {
      newPhotoUrls = await this.uploadProductPhotos(companyId, newFiles, currentCount);
    }

    // Remover fotos do disco
    if (photosToDelete.length > 0) {
      await this.deleteProductPhotos(photosToDelete);
    }

    // Combinar fotos restantes com novas
    return [...remainingPhotos, ...newPhotoUrls];
  }
}


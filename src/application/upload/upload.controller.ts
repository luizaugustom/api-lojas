import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Fazer upload de um arquivo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Arquivo para upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        subfolder: {
          type: 'string',
          description: 'Subpasta para organizar o arquivo (opcional)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Arquivo enviado com sucesso' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou muito grande' })
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Query('subfolder') subfolder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const fileUrl = await this.uploadService.uploadFile(file, subfolder);
    return {
      success: true,
      fileUrl,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Post('multiple')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @ApiOperation({ summary: 'Fazer upload de múltiplos arquivos' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Arquivos para upload',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        subfolder: {
          type: 'string',
          description: 'Subpasta para organizar os arquivos (opcional)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Arquivos enviados com sucesso' })
  @ApiResponse({ status: 400, description: 'Arquivos inválidos ou muito grandes' })
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('subfolder') subfolder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const fileUrls = await this.uploadService.uploadMultipleFiles(files, subfolder);
    
    const results = files.map((file, index) => ({
      success: true,
      fileUrl: fileUrls[index],
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    }));

    return {
      success: true,
      uploaded: results.length,
      files: results,
    };
  }

  @Delete('file')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Excluir arquivo' })
  @ApiResponse({ status: 200, description: 'Arquivo excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  async deleteFile(@Body('fileUrl') fileUrl: string) {
    if (!fileUrl) {
      throw new BadRequestException('URL do arquivo é obrigatória');
    }

    const success = await this.uploadService.deleteFile(fileUrl);
    return {
      success,
      message: success ? 'Arquivo excluído com sucesso' : 'Arquivo não encontrado',
    };
  }

  @Delete('files')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Excluir múltiplos arquivos' })
  @ApiResponse({ status: 200, description: 'Arquivos processados' })
  async deleteMultipleFiles(@Body('fileUrls') fileUrls: string[]) {
    if (!fileUrls || fileUrls.length === 0) {
      throw new BadRequestException('URLs dos arquivos são obrigatórias');
    }

    const result = await this.uploadService.deleteMultipleFiles(fileUrls);
    return {
      success: true,
      ...result,
      message: `${result.deleted} arquivo(s) excluído(s), ${result.failed} falharam`,
    };
  }

  @Post('info')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter informações do arquivo' })
  @ApiResponse({ status: 200, description: 'Informações do arquivo' })
  async getFileInfo(@Body('fileUrl') fileUrl: string) {
    if (!fileUrl) {
      throw new BadRequestException('URL do arquivo é obrigatória');
    }

    const info = await this.uploadService.getFileInfo(fileUrl);
    return {
      fileUrl,
      ...info,
    };
  }

  @Post('resize')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Redimensionar imagem' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Imagem redimensionada com sucesso' })
  async resizeImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('maxWidth') maxWidth?: string,
    @Query('maxHeight') maxHeight?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const maxW = maxWidth ? parseInt(maxWidth) : 800;
    const maxH = maxHeight ? parseInt(maxHeight) : 600;

    const resizedBuffer = await this.uploadService.resizeImage(file, maxW, maxH);
    
    return {
      success: true,
      message: 'Imagem redimensionada com sucesso',
      originalSize: file.buffer.length,
      resizedSize: resizedBuffer.length,
    };
  }

  @Post('optimize')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Otimizar imagem' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Imagem otimizada com sucesso' })
  async optimizeImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const optimizedBuffer = await this.uploadService.optimizeImage(file);
    
    return {
      success: true,
      message: 'Imagem otimizada com sucesso',
      originalSize: file.buffer.length,
      optimizedSize: optimizedBuffer.length,
      savings: file.buffer.length - optimizedBuffer.length,
    };
  }
}

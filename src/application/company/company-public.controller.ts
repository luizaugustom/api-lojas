import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { Public } from '../../shared/decorators/public.decorator';

@ApiTags('public')
@Controller('public')
@Public()
export class CompanyPublicController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('catalog/:url/products')
  @Public()
  @ApiOperation({ summary: 'Obter produtos da página pública de catálogo' })
  @ApiResponse({ status: 200, description: 'Produtos e informações da empresa' })
  @ApiResponse({ status: 404, description: 'Página não encontrada ou desabilitada' })
  async getCatalogProducts(@Param('url') url: string) {
    try {
      return await this.companyService.getPublicCatalogData(url);
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException(
        'Erro ao buscar dados do catálogo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}


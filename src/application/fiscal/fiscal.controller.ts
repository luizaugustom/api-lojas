import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FiscalService, NFeData, NFSeData } from './fiscal.service';
import { GenerateNFeDto } from './dto/generate-nfe.dto';
import { GenerateNFSeDto } from './dto/generate-nfse.dto';
import { CancelFiscalDocumentDto } from './dto/cancel-fiscal-document.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('fiscal')
@Controller('fiscal')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FiscalController {
  constructor(private readonly fiscalService: FiscalService) {}

  @Post('nfe')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Gerar NFe' })
  @ApiResponse({ status: 201, description: 'NFe gerada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos para geração da NFe' })
  async generateNFe(
    @CurrentUser() user: any,
    @Body() generateNFeDto: GenerateNFeDto,
  ) {
    const nfeData: NFeData = {
      companyId: user.companyId,
      clientCpfCnpj: generateNFeDto.clientCpfCnpj,
      clientName: generateNFeDto.clientName,
      items: generateNFeDto.items,
      totalValue: generateNFeDto.totalValue,
      paymentMethod: generateNFeDto.paymentMethod,
    };

    return this.fiscalService.generateNFe(nfeData);
  }

  @Post('nfse')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Gerar NFSe' })
  @ApiResponse({ status: 201, description: 'NFSe gerada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos para geração da NFSe' })
  async generateNFSe(
    @CurrentUser() user: any,
    @Body() generateNFSeDto: GenerateNFSeDto,
  ) {
    const nfseData: NFSeData = {
      companyId: user.companyId,
      clientCpfCnpj: generateNFSeDto.clientCpfCnpj,
      clientName: generateNFSeDto.clientName,
      serviceDescription: generateNFSeDto.serviceDescription,
      serviceValue: generateNFSeDto.serviceValue,
      paymentMethod: generateNFSeDto.paymentMethod,
    };

    return this.fiscalService.generateNFSe(nfseData);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Listar documentos fiscais' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'documentType', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista de documentos fiscais' })
  async getFiscalDocuments(
    @CurrentUser() user: any,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('documentType') documentType?: string,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.fiscalService.getFiscalDocuments(undefined, page, limit, documentType);
    }
    return this.fiscalService.getFiscalDocuments(user.companyId, page, limit, documentType);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter estatísticas dos documentos fiscais' })
  @ApiResponse({ status: 200, description: 'Estatísticas dos documentos fiscais' })
  async getFiscalStats(@CurrentUser() user: any) {
    if (user.role === UserRole.ADMIN) {
      return this.fiscalService.getFiscalStats();
    }
    return this.fiscalService.getFiscalStats(user.companyId);
  }

  @Get('validate-company')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Validar dados fiscais da empresa' })
  @ApiResponse({ status: 200, description: 'Resultado da validação' })
  async validateCompanyFiscalData(@CurrentUser() user: any) {
    return this.fiscalService.validateCompanyFiscalData(user.companyId);
  }

  @Get('access-key/:accessKey')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Buscar documento fiscal por chave de acesso' })
  @ApiResponse({ status: 200, description: 'Documento fiscal encontrado' })
  @ApiResponse({ status: 404, description: 'Documento fiscal não encontrado' })
  async getFiscalDocumentByAccessKey(
    @Param('accessKey') accessKey: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.fiscalService.getFiscalDocumentByAccessKey(accessKey);
    }
    return this.fiscalService.getFiscalDocumentByAccessKey(accessKey, user.companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Buscar documento fiscal por ID' })
  @ApiResponse({ status: 200, description: 'Documento fiscal encontrado' })
  @ApiResponse({ status: 404, description: 'Documento fiscal não encontrado' })
  async getFiscalDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.fiscalService.getFiscalDocument(id);
    }
    return this.fiscalService.getFiscalDocument(id, user.companyId);
  }

  @Get(':id/download')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Baixar documento fiscal' })
  @ApiQuery({ name: 'format', enum: ['xml', 'pdf'], required: true })
  @ApiResponse({ status: 200, description: 'Documento fiscal baixado' })
  @ApiResponse({ status: 404, description: 'Documento fiscal não encontrado' })
  async downloadFiscalDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('format') format: 'xml' | 'pdf',
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.fiscalService.downloadFiscalDocument(id, format);
    }
    return this.fiscalService.downloadFiscalDocument(id, format, user.companyId);
  }

  @Post(':id/cancel')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Cancelar documento fiscal' })
  @ApiResponse({ status: 200, description: 'Documento fiscal cancelado com sucesso' })
  @ApiResponse({ status: 400, description: 'Documento já está cancelado' })
  async cancelFiscalDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelDto: CancelFiscalDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.fiscalService.cancelFiscalDocument(id, cancelDto.reason, user.companyId);
  }
}

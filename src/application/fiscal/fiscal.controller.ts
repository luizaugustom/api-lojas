import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Res,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FiscalService, NFeData, NFSeData } from './fiscal.service';
import { GenerateNFeDto } from './dto/generate-nfe.dto';
import { GenerateNFSeDto } from './dto/generate-nfse.dto';
import { GenerateNFCeDto, PaymentMethod } from './dto/generate-nfce.dto';
import { CancelFiscalDocumentDto } from './dto/cancel-fiscal-document.dto';
import { CreateInboundInvoiceDto } from './dto/create-inbound-invoice.dto';
import { UpdateInboundInvoiceDto } from './dto/update-inbound-invoice.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles, UserRole } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UuidValidationPipe } from '../../shared/pipes/uuid-validation.pipe';

@ApiTags('fiscal')
@Controller('fiscal')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FiscalController {
  constructor(private readonly fiscalService: FiscalService) {}

  @Post('nfe')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Gerar NFe - Vinculada a venda ou manual' })
  @ApiResponse({ status: 201, description: 'NFe gerada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos para geração da NFe' })
  async generateNFe(
    @CurrentUser() user: any,
    @Body() generateNFeDto: GenerateNFeDto,
  ) {
    const nfeData: NFeData = {
      companyId: user.companyId,
      saleId: generateNFeDto.saleId,
      recipient: generateNFeDto.recipient,
      items: generateNFeDto.items,
      payment: generateNFeDto.payment,
      additionalInfo: generateNFeDto.additionalInfo,
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

  @Post('nfce')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Gerar NFCe' })
  @ApiResponse({ status: 201, description: 'NFCe gerada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos para geração da NFCe' })
  async generateNFCe(
    @CurrentUser() user: any,
    @Body() generateNFCeDto: GenerateNFCeDto,
  ) {
    const normalizedPayments = (generateNFCeDto.payments ?? [])
      .map((payment) => ({
        method: payment.method,
        amount: Number(payment.amount ?? 0),
      }))
      .filter((payment) => payment.amount > 0);

    const paymentMethodsFromDto = generateNFCeDto.paymentMethod ?? [];
    const methodsFallback =
      paymentMethodsFromDto.length > 0 ? paymentMethodsFromDto : [PaymentMethod.CASH];

    const payments = normalizedPayments.length
      ? normalizedPayments
      : methodsFallback.map((method, index) => ({
          method,
          amount: index === 0 ? Number(generateNFCeDto.totalValue) : 0,
        }));

    const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const diff = Math.round((generateNFCeDto.totalValue - totalPayments) * 100) / 100;
    if (Math.abs(diff) > 0.01) {
      payments[0].amount = Math.max(0, payments[0].amount + diff);
    }

    const normalizedPaymentsOutput = payments.map((payment) => ({
      method: payment.method,
      amount: Math.max(0, Math.round(payment.amount * 100) / 100),
    }));

    const nfceData = {
      companyId: user.companyId,
      clientCpfCnpj: generateNFCeDto.clientCpfCnpj,
      clientName: generateNFCeDto.clientName,
      items: generateNFCeDto.items,
      totalValue: generateNFCeDto.totalValue,
      saleId: generateNFCeDto.saleId,
      sellerName: generateNFCeDto.sellerName,
      payments: normalizedPaymentsOutput,
      additionalInfo: generateNFCeDto.additionalInfo,
      operationNature: generateNFCeDto.operationNature,
      emissionPurpose: generateNFCeDto.emissionPurpose,
      referenceAccessKey: generateNFCeDto.referenceAccessKey,
    };

    return this.fiscalService.generateNFCe(nfceData);
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

  @Get('status')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Obter status da API fiscal' })
  @ApiResponse({ status: 200, description: 'Status da API fiscal' })
  async getFiscalApiStatus(@CurrentUser() user: any) {
    return this.fiscalService.getFiscalApiStatus();
  }

  @Post('certificate/upload')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Upload de certificado digital' })
  @ApiResponse({ status: 200, description: 'Certificado enviado com sucesso' })
  async uploadCertificate(
    @CurrentUser() user: any,
    @Body() body: { certificatePath: string; password: string },
  ) {
    const success = await this.fiscalService.uploadCertificate(body.certificatePath, body.password);
    return { success, message: success ? 'Certificado enviado com sucesso' : 'Erro ao enviar certificado' };
  }

  @Get('validate-company')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Validar dados fiscais da empresa' })
  @ApiResponse({ status: 200, description: 'Resultado da validação' })
  async validateCompanyFiscalData(@CurrentUser() user: any) {
    return this.fiscalService.validateCompanyFiscalData(user.companyId);
  }

  @Post('upload-xml')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @UseInterceptors(FileInterceptor('xmlFile'))
  @ApiOperation({ 
    summary: 'Upload de arquivo XML fiscal',
    description: 'Faz upload de um arquivo XML fiscal (NFe, NFSe, NFCe) e processa suas informações'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 201, 
    description: 'XML fiscal processado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cmgty5s880006ww3b8bup77vb' },
        documentNumber: { type: 'string', example: '123456' },
        documentType: { type: 'string', example: 'NFe' },
        accessKey: { type: 'string', example: '35240114200166000187550010000000071123456789' },
        emissionDate: { type: 'string', format: 'date-time' },
        status: { type: 'string', example: 'Autorizada' },
        totalValue: { type: 'number', example: 1000.00 },
        message: { type: 'string', example: 'XML processado com sucesso' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Arquivo XML inválido ou erro no processamento' })
  @ApiResponse({ status: 413, description: 'Arquivo muito grande (máximo 10MB)' })
  async uploadXmlFiscal(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new Error('Arquivo XML é obrigatório');
    }

    if (file.mimetype !== 'application/xml' && file.mimetype !== 'text/xml') {
      throw new Error('Arquivo deve ser do tipo XML');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      throw new Error('Arquivo muito grande. Máximo permitido: 10MB');
    }

    const companyId = user.role === UserRole.ADMIN ? user.companyId : user.companyId;
    
    if (!companyId) {
      throw new Error('Company ID não encontrado');
    }

    return this.fiscalService.processXmlFile(file, companyId);
  }

  @Post('inbound-invoice')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ 
    summary: 'Criar nota fiscal de entrada manual',
    description: 'Registra uma nota fiscal de entrada com informações básicas (chave de acesso, fornecedor, total)'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Nota fiscal de entrada criada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou chave de acesso já existe' })
  async createInboundInvoice(
    @Body() createInboundInvoiceDto: CreateInboundInvoiceDto,
    @CurrentUser() user: any,
  ) {
    const companyId = user.role === UserRole.ADMIN ? user.companyId : user.companyId;
    
    if (!companyId) {
      throw new Error('Company ID não encontrado');
    }

    return this.fiscalService.createInboundInvoice(companyId, createInboundInvoiceDto);
  }

  @Patch('inbound-invoice/:id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ 
    summary: 'Editar nota fiscal de entrada manual',
    description: 'Atualiza campos básicos de uma nota fiscal de entrada (chave de acesso, fornecedor, total)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Nota fiscal de entrada atualizada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou chave de acesso já existe' })
  async updateInboundInvoice(
    @Param('id', UuidValidationPipe) id: string,
    @Body() updateInboundInvoiceDto: UpdateInboundInvoiceDto,
    @CurrentUser() user: any,
  ) {
    const companyId = user.role === UserRole.ADMIN ? user.companyId : user.companyId;

    if (!companyId) {
      throw new Error('Company ID não encontrado');
    }

    return this.fiscalService.updateInboundInvoice(id, companyId, updateInboundInvoiceDto);
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
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.fiscalService.getFiscalDocument(id);
    }
    return this.fiscalService.getFiscalDocument(id, user.companyId);
  }

  @Get(':id/download')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ 
    summary: 'Baixar documento fiscal',
    description: 'Baixa documento fiscal em formato XML ou PDF com headers apropriados para download'
  })
  @ApiQuery({ 
    name: 'format', 
    enum: ['xml', 'pdf'], 
    required: true,
    description: 'Formato do documento: xml ou pdf'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Documento fiscal baixado com sucesso',
    headers: {
      'Content-Type': {
        description: 'Tipo de conteúdo do arquivo',
        schema: { type: 'string', example: 'application/xml' }
      },
      'Content-Disposition': {
        description: 'Nome do arquivo para download',
        schema: { type: 'string', example: 'attachment; filename="NFe_123456.xml"' }
      },
      'Content-Length': {
        description: 'Tamanho do arquivo em bytes',
        schema: { type: 'number', example: 1024 }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Formato não suportado ou conteúdo não disponível' })
  @ApiResponse({ status: 404, description: 'Documento fiscal não encontrado' })
  async downloadFiscalDocument(
    @Param('id', UuidValidationPipe) id: string,
    @Query('format') format: 'xml' | 'pdf',
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const result = user.role === UserRole.ADMIN 
        ? await this.fiscalService.downloadFiscalDocument(id, format)
        : await this.fiscalService.downloadFiscalDocument(id, format, user.companyId);

      // Configurar headers para download
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      
      if (result.size) {
        res.setHeader('Content-Length', result.size);
      }

      // Enviar o conteúdo diretamente quando disponível
      if (result.content !== undefined) {
        const buffer = this.mapContentToBuffer(result.content);
        return res.status(HttpStatus.OK).send(buffer);
      }

      // Fallback: retornar informações do arquivo
      return res.status(HttpStatus.OK).json({
        message: 'Informações do arquivo',
        filename: result.filename,
        downloadUrl: result.downloadUrl,
        size: result.size,
        mimetype: result.mimetype
      });

    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message || 'Erro ao baixar documento fiscal',
        error: 'Bad Request'
      });
    }
  }

  /**
   * Converte qualquer payload retornado do serviço fiscal em Buffer
   */
  private mapContentToBuffer(content: unknown): Buffer {
    if (Buffer.isBuffer(content)) {
      return content;
    }

    if (typeof content === 'string') {
      return Buffer.from(content);
    }

    if (content instanceof ArrayBuffer) {
      return Buffer.from(content);
    }

    if (ArrayBuffer.isView(content)) {
      return Buffer.from(content.buffer);
    }

    throw new BadRequestException('Formato de conteúdo não suportado para download');
  }

  @Get(':id/download-info')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ 
    summary: 'Obter informações de download do documento fiscal',
    description: 'Retorna informações sobre os formatos disponíveis para download sem fazer o download'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Informações de download obtidas com sucesso',
    schema: {
      type: 'object',
      properties: {
        documentId: { type: 'string', example: 'cmgty5s880006ww3b8bup77vb' },
        documentNumber: { type: 'string', example: '123456' },
        documentType: { type: 'string', example: 'NFe' },
        availableFormats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              format: { type: 'string', example: 'xml' },
              available: { type: 'boolean', example: true },
              filename: { type: 'string', example: 'NFe_123456.xml' },
              size: { type: 'number', example: 1024 },
              downloadUrl: { type: 'string', example: '/api/fiscal/cmgty5s880006ww3b8bup77vb/download?format=xml' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Documento fiscal não encontrado' })
  async getDownloadInfo(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const document = user.role === UserRole.ADMIN 
      ? await this.fiscalService.getFiscalDocument(id)
      : await this.fiscalService.getFiscalDocument(id, user.companyId);

    const availableFormats = [];

    // Verificar XML
    if (document.xmlContent) {
      availableFormats.push({
        format: 'xml',
        available: true,
        filename: `${document.documentType}_${document.documentNumber}.xml`,
        size: Buffer.byteLength(document.xmlContent, 'utf8'),
        downloadUrl: `/api/fiscal/${id}/download?format=xml`,
        mimetype: 'application/xml'
      });
    }

    // Verificar PDF
    if (document.pdfUrl) {
      availableFormats.push({
        format: 'pdf',
        available: true,
        filename: `${document.documentType}_${document.documentNumber}.pdf`,
        downloadUrl: `/api/fiscal/${id}/download?format=pdf`,
        mimetype: 'application/pdf',
        isExternal: true
      });
    } else {
      // PDF pode ser gerado dinamicamente
      availableFormats.push({
        format: 'pdf',
        available: true,
        filename: `${document.documentType}_${document.documentNumber}.pdf`,
        downloadUrl: `/api/fiscal/${id}/download?format=pdf`,
        mimetype: 'application/pdf',
        isGenerated: true
      });
    }

    return {
      documentId: document.id,
      documentNumber: document.documentNumber,
      documentType: document.documentType,
      accessKey: document.accessKey,
      emissionDate: document.emissionDate,
      status: document.status,
      availableFormats
    };
  }

  @Post(':id/cancel')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Cancelar documento fiscal' })
  @ApiResponse({ status: 200, description: 'Documento fiscal cancelado com sucesso' })
  @ApiResponse({ status: 400, description: 'Documento já está cancelado' })
  async cancelFiscalDocument(
    @Param('id', UuidValidationPipe) id: string,
    @Body() cancelDto: CancelFiscalDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.fiscalService.cancelFiscalDocument(id, cancelDto.reason, user.companyId);
  }

  @Get(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'Consultar status do documento fiscal na SEFAZ' })
  @ApiResponse({ status: 200, description: 'Status do documento obtido com sucesso' })
  @ApiResponse({ status: 404, description: 'Documento fiscal não encontrado' })
  async getFiscalDocumentStatus(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.fiscalService.getFiscalDocumentStatus(id, user.companyId);
  }

  @Delete('inbound-invoice/:id')
  @Roles(UserRole.ADMIN, UserRole.COMPANY)
  @ApiOperation({ 
    summary: 'Excluir nota fiscal de entrada',
    description: 'Exclui uma nota fiscal de entrada da empresa. Apenas notas de entrada podem ser excluídas: NFe_INBOUND (criadas manualmente) ou NFe com XML (importadas via upload).'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Nota fiscal de entrada excluída com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Nota fiscal de entrada excluída com sucesso' },
        deletedId: { type: 'string', example: 'cmgty5s880006ww3b8bup77vb' },
        documentNumber: { type: 'string', example: '123456' },
        accessKey: { type: 'string', example: '35240114200166000187550010000000071123456789' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Nota fiscal não encontrada' })
  @ApiResponse({ status: 400, description: 'Nota fiscal não pertence à empresa ou não é uma nota de entrada' })
  async deleteInboundInvoice(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const companyId = user.role === UserRole.ADMIN ? user.companyId : user.companyId;
    
    if (!companyId) {
      throw new Error('Company ID não encontrado');
    }

    return this.fiscalService.deleteInboundInvoice(id, companyId);
  }
}

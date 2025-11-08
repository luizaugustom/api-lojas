import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ValidationService } from '../../shared/services/validation.service';
import { 
  FiscalApiService, 
  NFCeRequest, 
  NFeRequest, 
  NFeRecipient, 
  NFeItem 
} from '../../shared/services/fiscal-api.service';
import * as xml2js from 'xml2js';

// Interface para dados de NF-e vinda do controller
export interface NFeData {
  companyId: string;
  saleId?: string; // Opcional: vincular a uma venda
  recipient?: { // Opcional: dados manuais
    document: string;
    name: string;
    email?: string;
    phone?: string;
    address?: {
      zipCode?: string;
      street?: string;
      number?: string;
      complement?: string;
      district?: string;
      city?: string;
      state?: string;
    };
  };
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    ncm?: string;
    cfop: string;
    unitOfMeasure: string;
  }>;
  payment?: {
    method: string;
  };
  additionalInfo?: string;
}

export interface NFCeItemData {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  ncm?: string;
  cfop?: string;
  unitOfMeasure?: string;
}

export interface NFCePaymentData {
  method: string;
  amount: number;
}

export interface NFCeData {
  companyId: string;
  clientCpfCnpj?: string;
  clientName?: string;
  items: NFCeItemData[];
  totalValue: number;
  payments: NFCePaymentData[];
  saleId: string;
  sellerName: string;
  apiReference?: string;
  operationNature?: string;
  emissionPurpose?: number;
  referenceAccessKey?: string;
  documentType?: number;
  additionalInfo?: string;
  productExchangeId?: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface NFSeData {
  companyId: string;
  clientCpfCnpj?: string;
  clientName?: string;
  serviceDescription: string;
  serviceValue: number;
  paymentMethod: string[];
}

@Injectable()
export class FiscalService {
  private readonly logger = new Logger(FiscalService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly fiscalApiService: FiscalApiService,
    private readonly validationService: ValidationService,
  ) {}

  async generateNFe(nfeData: NFeData): Promise<any> {
    try {
      this.logger.log(`Generating NFe for company: ${nfeData.companyId}`);

      // Validar modo de emissão
      const isManualMode = !nfeData.saleId && nfeData.recipient && nfeData.items;
      const isSaleMode = !!nfeData.saleId;

      if (!isManualMode && !isSaleMode) {
        throw new BadRequestException('Informe saleId ou dados completos para emissão manual');
      }

      let nfeRequest: NFeRequest;
      let saleReference = '';

      if (isSaleMode) {
        // Modo 1: Emissão vinculada a uma venda
        const sale = await this.prisma.sale.findUnique({
          where: { id: nfeData.saleId },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            paymentMethods: true,
          },
        });

        if (!sale) {
          throw new NotFoundException('Venda não encontrada');
        }

        if (!sale.clientCpfCnpj || !sale.clientName) {
          throw new BadRequestException('Venda não possui dados de cliente (CPF/CNPJ e Nome são obrigatórios)');
        }

        // Validar CPF/CNPJ do cliente
        this.validationService.validateCPFOrCNPJ(sale.clientCpfCnpj);

        // Validar NCM e CFOP dos itens
        for (const item of sale.items) {
          if (item.product.ncm && !item.product.ncm.startsWith('99999999')) {
            this.validationService.validateNCM(item.product.ncm);
          }
          if (item.product.cfop) {
            this.validationService.validateCFOP(item.product.cfop);
          }
        }

        // Montar request a partir da venda
        nfeRequest = {
          companyId: nfeData.companyId,
          recipient: {
            document: sale.clientCpfCnpj,
            name: sale.clientName,
            // Sale não tem relação com Customer, então não temos esses dados adicionais
            email: undefined,
            phone: undefined,
            address: undefined,
          },
          items: sale.items.map(item => ({
            description: item.product.name,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            ncm: item.product.ncm || undefined,
            cfop: item.product.cfop || '5102',
            unitOfMeasure: 'UN',
          })),
          paymentMethod: sale.paymentMethods[0]?.method || '99', // Usa primeiro método de pagamento
          referenceId: sale.id,
        };

        saleReference = sale.id;
      } else {
        // Modo 2: Emissão manual
        
        // Validar CPF/CNPJ do destinatário
        this.validationService.validateCPFOrCNPJ(nfeData.recipient.document);

        // Validar NCM e CFOP dos itens
        for (const item of nfeData.items) {
          if (item.ncm && !item.ncm.startsWith('99999999')) {
            this.validationService.validateNCM(item.ncm);
          }
          this.validationService.validateCFOP(item.cfop);
        }

        nfeRequest = {
          companyId: nfeData.companyId,
          recipient: {
            document: nfeData.recipient.document,
            name: nfeData.recipient.name,
            email: nfeData.recipient.email,
            phone: nfeData.recipient.phone,
            address: nfeData.recipient.address,
          },
          items: nfeData.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            ncm: item.ncm,
            cfop: item.cfop,
            unitOfMeasure: item.unitOfMeasure,
          })),
          paymentMethod: nfeData.payment?.method || '99',
          additionalInfo: nfeData.additionalInfo,
          referenceId: `manual_${Date.now()}`,
        };
      }

      // Chamar API fiscal real (Focus NFe)
      const fiscalResponse = await this.fiscalApiService.generateNFe(nfeRequest);

      if (!fiscalResponse.success) {
        throw new BadRequestException(
          fiscalResponse.error || 'Erro na geração da NF-e'
        );
      }

      // Salvar documento fiscal
      const fiscalDocument = await this.prisma.fiscalDocument.create({
        data: {
          documentType: 'NFe',
          documentNumber: fiscalResponse.documentNumber,
          accessKey: fiscalResponse.accessKey,
          status: fiscalResponse.status,
          xmlContent: fiscalResponse.xmlContent,
          pdfUrl: fiscalResponse.pdfUrl,
          companyId: nfeData.companyId,
        },
      });

      this.logger.log(`NFe generated successfully: ${fiscalDocument.id}`);
      
      return {
        ...fiscalDocument,
        saleReference,
      };
    } catch (error) {
      this.logger.error('Error generating NFe:', error);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Erro ao gerar NF-e');
    }
  }

  /**
   * Verifica se a empresa tem configuração fiscal válida para emissão de NFCe
   */
  async hasValidFiscalConfig(companyId: string): Promise<boolean> {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: {
          cnpj: true,
          stateRegistration: true,
          certificatePassword: true,
          nfceSerie: true,
          municipioIbge: true,
          csc: true,
          idTokenCsc: true,
          state: true,
          city: true,
        },
      });

      if (!company) {
        return false;
      }

      // Verificar campos obrigatórios para emissão de NFCe
      const hasRequiredFields = !!(
        company.cnpj &&
        company.stateRegistration &&
        company.certificatePassword &&
        company.nfceSerie &&
        company.municipioIbge &&
        company.csc &&
        company.idTokenCsc &&
        company.state &&
        company.city
      );

      return hasRequiredFields;
    } catch (error) {
      this.logger.error('Error checking fiscal config:', error);
      return false;
    }
  }

  /**
   * Gera dados mockados de NFCe quando a empresa não tem configuração válida
   */
  async generateMockNFCe(nfceData: NFCeData): Promise<any> {
    try {
      this.logger.log(`Generating MOCK NFCe for sale: ${nfceData.saleId} (empresa sem configuração fiscal)`);

      // Get company data
      const company = await this.prisma.company.findUnique({
        where: { id: nfceData.companyId },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      // Gerar número de documento mockado
      const mockDocumentNumber = Math.floor(Math.random() * 900000) + 100000; // 6 dígitos
      const mockAccessKey = this.generateMockAccessKey();
      const mockSerieNumber = company.nfceSerie || '1';

      // Criar documento fiscal mockado (não salva no banco como documento oficial)
      const mockFiscalDocument = {
        documentType: 'NFCe',
        documentNumber: mockDocumentNumber.toString(),
        accessKey: mockAccessKey,
        status: 'MOCK',
        emissionDate: new Date(),
        serieNumber: mockSerieNumber,
        qrCodeUrl: null,
        protocol: null,
        isMock: true, // Flag para identificar como mock
      };

      this.logger.log(`Mock NFCe generated successfully for sale: ${nfceData.saleId}`);
      return mockFiscalDocument;
    } catch (error) {
      this.logger.error('Error generating mock NFCe:', error);
      throw new BadRequestException('Erro ao gerar NFCe mockado');
    }
  }

  /**
   * Gera uma chave de acesso mockada (44 dígitos)
   */
  private generateMockAccessKey(): string {
    // Formato: 44 dígitos numéricos (similar à chave real)
    let key = '';
    for (let i = 0; i < 44; i++) {
      key += Math.floor(Math.random() * 10);
    }
    return key;
  }

  async generateNFCe(nfceData: NFCeData): Promise<any> {
    try {
      this.logger.log(`Generating NFCe for sale: ${nfceData.saleId}`);

      // Verificar se a empresa tem configuração fiscal válida
      const hasValidConfig = await this.hasValidFiscalConfig(nfceData.companyId);

      if (!hasValidConfig) {
        this.logger.warn(`Empresa ${nfceData.companyId} não tem configuração fiscal válida. Gerando NFCe mockado.`);
        return await this.generateMockNFCe(nfceData);
      }

      // Get company data
      const company = await this.prisma.company.findUnique({
        where: { id: nfceData.companyId },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      // Validar CPF/CNPJ do cliente se fornecido
      if (nfceData.clientCpfCnpj) {
        this.validationService.validateCPFOrCNPJ(nfceData.clientCpfCnpj);
      }

      const payments = nfceData.payments?.length
        ? nfceData.payments
        : [{ method: 'cash', amount: nfceData.totalValue }];

      // Prepare NFCe request for fiscal API
      const nfceRequest: NFCeRequest = {
        companyId: nfceData.companyId,
        clientCpfCnpj: nfceData.clientCpfCnpj,
        clientName: nfceData.clientName,
        items: nfceData.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          barcode: item.barcode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          ncm: item.ncm || '99999999', // Default NCM - should be configured per product
          cfop: item.cfop || '5102', // Default CFOP for internal sales
          unitOfMeasure: item.unitOfMeasure || 'UN',
        })),
        totalValue: nfceData.totalValue,
        payments: payments,
        saleId: nfceData.apiReference ?? nfceData.saleId,
        sellerName: nfceData.sellerName,
        operationNature: nfceData.operationNature,
        emissionPurpose: nfceData.emissionPurpose,
        referenceAccessKey: nfceData.referenceAccessKey,
        documentType: nfceData.documentType,
        additionalInfo: nfceData.additionalInfo,
      };

      // Call fiscal API
      const fiscalResponse = await this.fiscalApiService.generateNFCe(nfceRequest);

      if (!fiscalResponse.success) {
        throw new BadRequestException(fiscalResponse.error || 'Erro na geração da NFCe');
      }

      // Save fiscal document
      const fiscalDocument = await this.prisma.fiscalDocument.create({
        data: {
          documentType: 'NFCe',
          documentNumber: fiscalResponse.documentNumber,
          accessKey: fiscalResponse.accessKey,
          status: fiscalResponse.status,
          xmlContent: fiscalResponse.xmlContent,
          pdfUrl: fiscalResponse.pdfUrl,
          companyId: nfceData.companyId,
          saleId: nfceData.saleId,
          productExchangeId: nfceData.productExchangeId,
          origin: nfceData.source ?? 'SALE',
          metadata: nfceData.metadata ? nfceData.metadata : undefined,
          totalValue: nfceData.totalValue,
        },
      });

      this.logger.log(`NFCe generated successfully: ${fiscalDocument.id}`);
      return {
        ...fiscalDocument,
        qrCodeUrl: fiscalResponse.qrCodeUrl,
      };
    } catch (error) {
      this.logger.error('Error generating NFCe:', error);
      throw new BadRequestException('Erro ao gerar NFCe');
    }
  }

  async generateNFSe(nfseData: NFSeData): Promise<any> {
    try {
      this.logger.log(`Generating NFSe for company: ${nfseData.companyId}`);

      // Get company data
      const company = await this.prisma.company.findUnique({
        where: { id: nfseData.companyId },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      // Prepare NFSe data for fiscal API
      const fiscalData = {
        prestador: {
          cnpj: company.cnpj.replace(/[^\d]/g, ''),
          nome: company.name,
          endereco: {
            logradouro: company.street,
            numero: company.number,
            bairro: company.district,
            municipio: company.city,
            uf: company.state,
            cep: company.zipCode?.replace(/[^\d]/g, ''),
          },
        },
        tomador: nfseData.clientCpfCnpj ? {
          cpf_cnpj: nfseData.clientCpfCnpj.replace(/[^\d]/g, ''),
          nome: nfseData.clientName,
        } : undefined,
        servico: {
          descricao: nfseData.serviceDescription,
          valor: nfseData.serviceValue,
        },
        forma_pagamento: nfseData.paymentMethod,
      };

      // Call fiscal API (NFSe not implemented yet)
      const response = {
        numero: Math.floor(Math.random() * 1000000).toString(),
        chave_acesso: `NFSe${Date.now()}${Math.floor(Math.random() * 1000000)}`,
        status: 'Autorizada',
        xml: '<?xml version="1.0" encoding="UTF-8"?><nfse></nfse>',
        pdf_url: 'https://example.com/documento.pdf',
      };

      // Save fiscal document
      const fiscalDocument = await this.prisma.fiscalDocument.create({
        data: {
          documentType: 'NFSe',
          documentNumber: response.numero,
          accessKey: response.chave_acesso,
          status: response.status,
          xmlContent: response.xml,
          pdfUrl: response.pdf_url,
          companyId: nfseData.companyId,
        },
      });

      this.logger.log(`NFSe generated successfully: ${fiscalDocument.id}`);
      return fiscalDocument;
    } catch (error) {
      this.logger.error('Error generating NFSe:', error);
      throw new BadRequestException('Erro ao gerar NFSe');
    }
  }

  async getFiscalDocuments(companyId?: string, page = 1, limit = 10, documentType?: string) {
    const where: any = {};
    
    if (companyId) {
      where.companyId = companyId;
    }

    if (documentType) {
      // Tratar filtro 'inbound' para documentos de entrada
      if (documentType === 'inbound') {
        // Documentos de entrada são NFe_INBOUND ou NFe com XML content (importados)
        where.OR = [
          { documentType: 'NFe_INBOUND' },
          { 
            documentType: 'NFe',
            xmlContent: { not: null }
          }
        ];
      } 
      // Tratar filtro 'outbound' para documentos de saída
      else if (documentType === 'outbound') {
        // Documentos de saída são NFCe e NFe que não são de entrada
        where.AND = [
          {
            OR: [
              { documentType: 'NFCe' },
              { documentType: 'NFe' }
            ]
          },
          {
            NOT: {
              OR: [
                { documentType: 'NFe_INBOUND' },
                { 
                  documentType: 'NFe',
                  xmlContent: { not: null }
                }
              ]
            }
          }
        ];
      } 
      else {
        where.documentType = documentType;
      }
    }

    const [documents, total] = await Promise.all([
      this.prisma.fiscalDocument.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              cnpj: true,
            },
          },
        },
        orderBy: {
          emissionDate: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.fiscalDocument.count({ where }),
    ]);

    return {
      documents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFiscalDocument(id: string, companyId?: string) {
    const where: any = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const document = await this.prisma.fiscalDocument.findUnique({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            cnpj: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Documento fiscal não encontrado');
    }

    return document;
  }

  async cancelFiscalDocument(id: string, reason: string, companyId?: string) {
    try {
      const where: any = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      const document = await this.prisma.fiscalDocument.findUnique({
        where,
      });

      if (!document) {
        throw new NotFoundException('Documento fiscal não encontrado');
      }

      if (document.status === 'Cancelada') {
        throw new BadRequestException('Documento já está cancelado');
      }

      // Call fiscal API to cancel (not implemented yet)
      const response = {
        status: 'Cancelada',
        motivo: reason,
      };

      // Update document status
      const updatedDocument = await this.prisma.fiscalDocument.update({
        where: { id },
        data: {
          status: 'Cancelada',
        },
      });

      this.logger.log(`Fiscal document cancelled: ${id}`);
      return updatedDocument;
    } catch (error) {
      this.logger.error('Error cancelling fiscal document:', error);
      throw new BadRequestException('Erro ao cancelar documento fiscal');
    }
  }

  async downloadFiscalDocument(id: string, format: 'xml' | 'pdf', companyId?: string) {
    const document = await this.getFiscalDocument(id, companyId);

    if (format === 'xml') {
      if (!document.xmlContent) {
        throw new BadRequestException('Conteúdo XML não disponível para este documento');
      }

      return {
        content: document.xmlContent,
        filename: `${document.documentType}_${document.documentNumber}.xml`,
        mimetype: 'application/xml',
        contentType: 'application/xml; charset=utf-8',
        size: Buffer.byteLength(document.xmlContent, 'utf8'),
        downloadUrl: `/api/fiscal/${id}/download?format=xml`
      };
    }

    if (format === 'pdf') {
      if (!document.pdfUrl) {
        // Gerar PDF dinamicamente se não existir
        const generatedPdf = await this.generatePdfFromDocument(document);
        return {
          content: generatedPdf,
          filename: `${document.documentType}_${document.documentNumber}.pdf`,
          mimetype: 'application/pdf',
          contentType: 'application/pdf',
          size: generatedPdf.length,
          downloadUrl: `/api/fiscal/${id}/download?format=pdf`
        };
      }

      // Se existe URL do PDF, retornar informações para download
      return {
        url: document.pdfUrl,
        filename: `${document.documentType}_${document.documentNumber}.pdf`,
        mimetype: 'application/pdf',
        contentType: 'application/pdf',
        downloadUrl: `/api/fiscal/${id}/download?format=pdf`,
        isExternal: true
      };
    }

    throw new BadRequestException('Formato não suportado. Use "xml" ou "pdf"');
  }

  private async generatePdfFromDocument(document: any): Promise<Buffer> {
    try {
      // Simular geração de PDF (em implementação real, usar biblioteca como puppeteer ou jsPDF)
      const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
100 700 Td
(Documento Fiscal: ${document.documentType} ${document.documentNumber}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
354
%%EOF
      `;

      return Buffer.from(pdfContent, 'utf8');
    } catch (error) {
      this.logger.error('Error generating PDF:', error);
      throw new BadRequestException('Erro ao gerar PDF do documento');
    }
  }

  async getFiscalStats(companyId?: string) {
    const where = companyId ? { companyId } : {};

    const [totalDocuments, nfeCount, nfseCount, cancelledCount, totalValue] = await Promise.all([
      this.prisma.fiscalDocument.count({ where }),
      this.prisma.fiscalDocument.count({
        where: { ...where, documentType: 'NFe' },
      }),
      this.prisma.fiscalDocument.count({
        where: { ...where, documentType: 'NFSe' },
      }),
      this.prisma.fiscalDocument.count({
        where: { ...where, status: 'Cancelada' },
      }),
      // Note: In a real implementation, you would calculate total value from sales
      Promise.resolve(0),
    ]);

    return {
      totalDocuments,
      nfeCount,
      nfseCount,
      cancelledCount,
      totalValue,
    };
  }

  async getFiscalDocumentByAccessKey(accessKey: string, companyId?: string) {
    const where: any = { accessKey };
    if (companyId) {
      where.companyId = companyId;
    }

    const document = await this.prisma.fiscalDocument.findFirst({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            cnpj: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Documento fiscal não encontrado');
    }

    return document;
  }

  async getFiscalApiStatus(): Promise<any> {
    return await this.fiscalApiService.getFiscalStatus();
  }

  async uploadCertificate(certificatePath: string, password: string): Promise<boolean> {
    return await this.fiscalApiService.uploadCertificate(certificatePath, password);
  }

  async validateCompanyFiscalData(companyId: string): Promise<{ valid: boolean; errors: string[] }> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return { valid: false, errors: ['Empresa não encontrada'] };
    }

    const errors: string[] = [];

    // Validate required fields for fiscal operations
    if (!company.cnpj) {
      errors.push('CNPJ é obrigatório');
    }

    if (!company.name) {
      errors.push('Nome da empresa é obrigatório');
    }

    if (!company.street || !company.number || !company.city || !company.state) {
      errors.push('Endereço completo é obrigatório');
    }

    if (!company.zipCode) {
      errors.push('CEP é obrigatório');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async processXmlFile(file: Express.Multer.File, companyId: string) {
    try {
      this.logger.log(`Processing XML file: ${file.originalname} for company: ${companyId}`);

      // Converter buffer para string
      const xmlContent = file.buffer.toString('utf8');
      
      // Parsear XML
      const parser = new xml2js.Parser({ 
        explicitArray: false,
        ignoreAttrs: false,
        mergeAttrs: true
      });

      const result = await parser.parseStringPromise(xmlContent);
      
      // Extrair informações do XML baseado no tipo de documento
      const documentInfo = this.extractDocumentInfo(result);
      
      // Verificar se o documento já existe
      const existingDocument = await this.prisma.fiscalDocument.findFirst({
        where: {
          accessKey: documentInfo.accessKey,
          companyId: companyId
        }
      });

      if (existingDocument) {
        // Atualizar documento existente
        const updatedDocument = await this.prisma.fiscalDocument.update({
          where: { id: existingDocument.id },
          data: {
            xmlContent: xmlContent,
            status: documentInfo.status,
            totalValue: documentInfo.totalValue,
            supplierName: documentInfo.supplierName || existingDocument.supplierName,
            updatedAt: new Date()
          }
        });

        this.logger.log(`Updated existing fiscal document: ${updatedDocument.id}`);
        
        return {
          id: updatedDocument.id,
          documentNumber: updatedDocument.documentNumber,
          documentType: updatedDocument.documentType,
          accessKey: updatedDocument.accessKey,
          emissionDate: updatedDocument.emissionDate,
          status: updatedDocument.status,
          totalValue: updatedDocument.totalValue,
          message: 'XML atualizado com sucesso'
        };
      } else {
        // Criar novo documento
        const newDocument = await this.prisma.fiscalDocument.create({
          data: {
            companyId: companyId,
            documentNumber: documentInfo.documentNumber,
            documentType: documentInfo.documentType,
            accessKey: documentInfo.accessKey,
            emissionDate: documentInfo.emissionDate,
            status: documentInfo.status,
            totalValue: documentInfo.totalValue,
            supplierName: documentInfo.supplierName || null,
            xmlContent: xmlContent,
            pdfUrl: documentInfo.pdfUrl || null
          }
        });

        this.logger.log(`Created new fiscal document: ${newDocument.id}`);
        
        return {
          id: newDocument.id,
          documentNumber: newDocument.documentNumber,
          documentType: newDocument.documentType,
          accessKey: newDocument.accessKey,
          emissionDate: newDocument.emissionDate,
          status: newDocument.status,
          totalValue: newDocument.totalValue,
          message: 'XML processado com sucesso'
        };
      }

    } catch (error) {
      this.logger.error('Error processing XML file:', error);
      throw new BadRequestException('Erro ao processar arquivo XML: ' + error.message);
    }
  }

  private extractDocumentInfo(xmlData: any) {
    try {
      // Detectar tipo de documento e extrair informações
      let documentInfo: any = {};

      // NFe
      if (xmlData.nfeProc || xmlData.NFe) {
        const nfe = xmlData.nfeProc?.NFe || xmlData.NFe;
        const infNFe = nfe.infNFe;
        const ide = infNFe.ide;
        const emit = infNFe.emit;
        const total = infNFe.total?.ICMSTot;

        // Verificar se é documento de entrada ou saída baseado no CFOP
        const cfop = infNFe.det?.[0]?.prod?.CFOP || infNFe.det?.prod?.CFOP;
        const isInbound = cfop && (cfop.startsWith('1') || cfop.startsWith('2'));
        
        documentInfo = {
          documentType: isInbound ? 'NFe_INBOUND' : 'NFe',
          documentNumber: ide.nNF,
          accessKey: infNFe['@_Id']?.replace('NFe', '') || '',
          emissionDate: new Date(ide.dhEmi || ide.dEmi),
          status: xmlData.nfeProc?.protNFe?.infProt?.cStat === '100' ? 'Autorizada' : 'Pendente',
          totalValue: total?.vNF || 0,
          supplierName: isInbound ? (emit.xNome || emit.xFant || null) : null,
          pdfUrl: null
        };
      }
      // NFSe
      else if (xmlData.CompNfse || xmlData.Nfse) {
        const nfse = xmlData.CompNfse?.Nfse || xmlData.Nfse;
        const infNfse = nfse.InfNfse;
        const servico = infNfse.Servico;
        const valores = servico.Valores;

        documentInfo = {
          documentType: 'NFSe',
          documentNumber: infNfse.Numero,
          accessKey: infNfse.CodigoVerificacao || '',
          emissionDate: new Date(infNfse.DataEmissao),
          status: 'Autorizada',
          totalValue: valores.ValorServicos || 0,
          pdfUrl: null
        };
      }
      // NFCe
      else if (xmlData.nfeProc && xmlData.nfeProc.NFe?.infNFe?.ide?.tpEmis === '9') {
        const nfe = xmlData.nfeProc.NFe;
        const infNFe = nfe.infNFe;
        const ide = infNFe.ide;
        const total = infNFe.total?.ICMSTot;

        documentInfo = {
          documentType: 'NFCe',
          documentNumber: ide.nNF,
          accessKey: infNFe['@_Id']?.replace('NFe', '') || '',
          emissionDate: new Date(ide.dhEmi || ide.dEmi),
          status: xmlData.nfeProc.protNFe?.infProt?.cStat === '100' ? 'Autorizada' : 'Pendente',
          totalValue: total?.vNF || 0,
          pdfUrl: null
        };
      }
      else {
        throw new Error('Tipo de documento fiscal não reconhecido');
      }

      return documentInfo;

    } catch (error) {
      this.logger.error('Error extracting document info:', error);
      throw new BadRequestException('Erro ao extrair informações do XML: ' + error.message);
    }
  }

  async createInboundInvoice(
    companyId: string,
    data: {
      accessKey?: string;
      supplierName: string;
      totalValue: number;
      documentNumber?: string;
      pdfUrl?: string;
    }
  ) {
    try {
      this.logger.log(`Creating inbound invoice for company: ${companyId}`);

      // Verificar se já existe um documento com essa chave de acesso
      if (data.accessKey) {
        const existingDocument = await this.prisma.fiscalDocument.findFirst({
          where: {
            accessKey: data.accessKey,
            companyId: companyId
          }
        });

        if (existingDocument) {
          throw new BadRequestException('Já existe uma nota fiscal com esta chave de acesso');
        }
      }

      // Criar o documento fiscal de entrada
      const fiscalDocument = await this.prisma.fiscalDocument.create({
        data: {
          companyId: companyId,
          documentType: 'NFe_INBOUND',
          documentNumber: data.documentNumber || 'MANUAL',
          accessKey: data.accessKey ?? null,
          status: 'Registrada',
          totalValue: data.totalValue,
          supplierName: data.supplierName,
          emissionDate: new Date(),
          pdfUrl: data.pdfUrl ?? null,
        }
      });

      this.logger.log(`Inbound invoice created successfully: ${fiscalDocument.id}`);

      return {
        id: fiscalDocument.id,
        documentNumber: fiscalDocument.documentNumber,
        documentType: fiscalDocument.documentType,
        accessKey: fiscalDocument.accessKey,
        status: fiscalDocument.status,
        totalValue: fiscalDocument.totalValue,
        supplierName: fiscalDocument.supplierName,
        emissionDate: fiscalDocument.emissionDate,
        message: 'Nota fiscal de entrada registrada com sucesso'
      };

    } catch (error) {
      this.logger.error('Error creating inbound invoice:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao criar nota fiscal de entrada: ' + error.message);
    }
  }

  async updateInboundInvoice(
    id: string,
    companyId: string,
    data: {
      accessKey?: string | null;
      supplierName?: string;
      totalValue?: number;
      documentNumber?: string;
      pdfUrl?: string | null;
    }
  ) {
    try {
      this.logger.log(`Updating inbound invoice ${id} for company: ${companyId}`);

      const fiscalDocument = await this.prisma.fiscalDocument.findUnique({
        where: { id }
      });

      if (!fiscalDocument) {
        throw new NotFoundException('Nota fiscal não encontrada');
      }

      if (fiscalDocument.companyId !== companyId) {
        throw new BadRequestException('Esta nota fiscal não pertence à sua empresa');
      }

      const isInboundInvoice =
        fiscalDocument.documentType === 'NFe_INBOUND' ||
        (fiscalDocument.documentType === 'NFe' && fiscalDocument.xmlContent !== null);

      if (!isInboundInvoice) {
        throw new BadRequestException('Apenas notas fiscais de entrada podem ser editadas por este método');
      }

      const updateData: any = {};

      if (data.accessKey !== undefined) {
        if (data.accessKey === null) {
          // Ignorar valores nulos para evitar violar constraints NOT NULL
          this.logger.warn(
            `Inbound invoice ${id} received null accessKey. Ignoring change to preserve existing value.`,
          );
        } else if (typeof data.accessKey === 'string') {
          const trimmedAccessKey = data.accessKey.trim();

          if (trimmedAccessKey.length === 0) {
            // String vazia significa "não alterar"
            this.logger.log(
              `Inbound invoice ${id} accessKey provided as empty string. Keeping current value.`,
            );
          } else {
            if (!/^\d{44}$/.test(trimmedAccessKey)) {
              throw new BadRequestException('Chave de acesso deve conter 44 dígitos numéricos');
            }

          const existingDocument = await this.prisma.fiscalDocument.findFirst({
            where: {
                accessKey: trimmedAccessKey,
              companyId: companyId,
              id: { not: id }
            }
          });

          if (existingDocument) {
            throw new BadRequestException('Já existe uma nota fiscal com esta chave de acesso');
          }

            updateData.accessKey = trimmedAccessKey;
          }
        } else {
          this.logger.warn(
            `Inbound invoice ${id} received accessKey with unsupported type (${typeof data.accessKey}). Ignoring.`,
          );
        }
      }

      if (data.supplierName !== undefined) {
        updateData.supplierName = data.supplierName;
      }

      if (data.totalValue !== undefined) {
        updateData.totalValue = data.totalValue;
      }

      if (data.documentNumber !== undefined) {
        updateData.documentNumber = data.documentNumber;
      }

      if (data.pdfUrl !== undefined) {
        updateData.pdfUrl = data.pdfUrl || null;
      }

      if (Object.keys(updateData).length === 0) {
        throw new BadRequestException('Nenhum dado informado para atualização');
      }

      const updatedDocument = await this.prisma.fiscalDocument.update({
        where: { id },
        data: updateData
      });

      this.logger.log(`Inbound invoice updated successfully: ${updatedDocument.id}`);

      return {
        id: updatedDocument.id,
        documentNumber: updatedDocument.documentNumber,
        documentType: updatedDocument.documentType,
        accessKey: updatedDocument.accessKey,
        status: updatedDocument.status,
        totalValue: updatedDocument.totalValue,
        supplierName: updatedDocument.supplierName,
        emissionDate: updatedDocument.emissionDate,
        message: 'Nota fiscal de entrada atualizada com sucesso'
      };
    } catch (error) {
      this.logger.error('Error updating inbound invoice:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao atualizar nota fiscal de entrada: ' + error.message);
    }
  }

  async deleteInboundInvoice(id: string, companyId: string) {
    try {
      this.logger.log(`Deleting inbound invoice ${id} for company: ${companyId}`);

      // Buscar o documento fiscal
      const fiscalDocument = await this.prisma.fiscalDocument.findUnique({
        where: { id }
      });

      if (!fiscalDocument) {
        throw new NotFoundException('Nota fiscal não encontrada');
      }

      // Verificar se o documento pertence à empresa
      if (fiscalDocument.companyId !== companyId) {
        throw new BadRequestException('Esta nota fiscal não pertence à sua empresa');
      }

      // Verificar se é uma nota de entrada
      // Notas de entrada podem ser:
      // 1. NFe_INBOUND (criadas manualmente)
      // 2. NFe com xmlContent (importadas via XML)
      const isInboundInvoice = 
        fiscalDocument.documentType === 'NFe_INBOUND' ||
        (fiscalDocument.documentType === 'NFe' && fiscalDocument.xmlContent !== null);

      if (!isInboundInvoice) {
        throw new BadRequestException('Apenas notas fiscais de entrada podem ser excluídas por este método');
      }

      // Excluir o documento
      await this.prisma.fiscalDocument.delete({
        where: { id }
      });

      this.logger.log(`Inbound invoice deleted successfully: ${id}`);

      return {
        message: 'Nota fiscal de entrada excluída com sucesso',
        deletedId: id,
        documentNumber: fiscalDocument.documentNumber,
        accessKey: fiscalDocument.accessKey
      };

    } catch (error) {
      this.logger.error('Error deleting inbound invoice:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao excluir nota fiscal de entrada: ' + error.message);
    }
  }

}

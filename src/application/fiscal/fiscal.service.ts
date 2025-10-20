import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { FiscalApiService, NFCeRequest } from '../../shared/services/fiscal-api.service';
import * as xml2js from 'xml2js';

export interface NFeData {
  companyId: string;
  clientCpfCnpj?: string;
  clientName?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalValue: number;
  paymentMethod: string[];
}

export interface NFCeData {
  companyId: string;
  clientCpfCnpj?: string;
  clientName?: string;
  items: Array<{
    productId: string;
    productName: string;
    barcode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalValue: number;
  paymentMethod: string[];
  saleId: string;
  sellerName: string;
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
  ) {}

  async generateNFe(nfeData: NFeData): Promise<any> {
    try {
      this.logger.log(`Generating NFe for company: ${nfeData.companyId}`);

      // Get company data
      const company = await this.prisma.company.findUnique({
        where: { id: nfeData.companyId },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      // Prepare NFe data for fiscal API
      const fiscalData = {
        emitente: {
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
        destinatario: nfeData.clientCpfCnpj ? {
          cpf_cnpj: nfeData.clientCpfCnpj.replace(/[^\d]/g, ''),
          nome: nfeData.clientName,
        } : undefined,
        itens: nfeData.items.map(item => ({
          codigo: item.productId,
          descricao: `Produto ${item.productId}`,
          quantidade: item.quantity,
          valor_unitario: item.unitPrice,
          valor_total: item.totalPrice,
        })),
        total: nfeData.totalValue,
        forma_pagamento: nfeData.paymentMethod,
      };

      // Call fiscal API (NFe not implemented yet)
      const response = {
        numero: Math.floor(Math.random() * 1000000).toString(),
        chave_acesso: `NFe${Date.now()}${Math.floor(Math.random() * 1000000)}`,
        status: 'Autorizada',
        xml: '<?xml version="1.0" encoding="UTF-8"?><nfe></nfe>',
        pdf_url: 'https://example.com/documento.pdf',
      };

      // Save fiscal document
      const fiscalDocument = await this.prisma.fiscalDocument.create({
        data: {
          documentType: 'NFe',
          documentNumber: response.numero,
          accessKey: response.chave_acesso,
          status: response.status,
          xmlContent: response.xml,
          pdfUrl: response.pdf_url,
          companyId: nfeData.companyId,
        },
      });

      this.logger.log(`NFe generated successfully: ${fiscalDocument.id}`);
      return fiscalDocument;
    } catch (error) {
      this.logger.error('Error generating NFe:', error);
      throw new BadRequestException('Erro ao gerar NFe');
    }
  }

  async generateNFCe(nfceData: NFCeData): Promise<any> {
    try {
      this.logger.log(`Generating NFCe for sale: ${nfceData.saleId}`);

      // Get company data
      const company = await this.prisma.company.findUnique({
        where: { id: nfceData.companyId },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

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
          ncm: '99999999', // Default NCM - should be configured per product
          cfop: '5102', // Default CFOP for internal sales
        })),
        totalValue: nfceData.totalValue,
        paymentMethod: nfceData.paymentMethod,
        saleId: nfceData.saleId,
        sellerName: nfceData.sellerName,
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
      where.documentType = documentType;
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

        documentInfo = {
          documentType: 'NFe',
          documentNumber: ide.nNF,
          accessKey: infNFe['@_Id']?.replace('NFe', '') || '',
          emissionDate: new Date(ide.dhEmi || ide.dEmi),
          status: xmlData.nfeProc?.protNFe?.infProt?.cStat === '100' ? 'Autorizada' : 'Pendente',
          totalValue: total?.vNF || 0,
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

}

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';

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
  private readonly fiscalApiUrl: string;
  private readonly fiscalApiKey: string;
  private readonly certificatePath: string;
  private readonly certificatePassword: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.fiscalApiUrl = this.configService.get('FISCAL_API_URL', 'https://api.fiscal.com.br');
    this.fiscalApiKey = this.configService.get('FISCAL_API_KEY', '');
    this.certificatePath = this.configService.get('FISCAL_CERTIFICATE_PATH', './certificates/cert.p12');
    this.certificatePassword = this.configService.get('FISCAL_CERTIFICATE_PASSWORD', '');
  }

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

      // Call fiscal API
      const response = await this.callFiscalApi('/nfe/emitir', fiscalData);

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

      // Call fiscal API
      const response = await this.callFiscalApi('/nfse/emitir', fiscalData);

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

      // Call fiscal API to cancel
      const response = await this.callFiscalApi(`/${document.documentType.toLowerCase()}/cancelar`, {
        chave_acesso: document.accessKey,
        motivo: reason,
      });

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
      return {
        content: document.xmlContent,
        filename: `documento_${document.documentNumber}.xml`,
        mimetype: 'application/xml',
      };
    }

    if (format === 'pdf' && document.pdfUrl) {
      // In a real implementation, you would fetch the PDF from the URL
      return {
        url: document.pdfUrl,
        filename: `documento_${document.documentNumber}.pdf`,
        mimetype: 'application/pdf',
      };
    }

    throw new BadRequestException('Formato não disponível para este documento');
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

  private async callFiscalApi(endpoint: string, data: any): Promise<any> {
    // This would make actual HTTP calls to the fiscal API
    // For now, return mock data
    this.logger.log(`Calling fiscal API: ${endpoint}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      numero: Math.floor(Math.random() * 1000000).toString(),
      chave_acesso: `NFe${Date.now()}${Math.floor(Math.random() * 1000000)}`,
      status: 'Autorizada',
      xml: '<?xml version="1.0" encoding="UTF-8"?><nfe></nfe>',
      pdf_url: 'https://example.com/documento.pdf',
    };
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
}

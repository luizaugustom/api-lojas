"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FiscalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiscalService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const fiscal_api_service_1 = require("../../shared/services/fiscal-api.service");
const xml2js = require("xml2js");
let FiscalService = FiscalService_1 = class FiscalService {
    constructor(configService, prisma, fiscalApiService) {
        this.configService = configService;
        this.prisma = prisma;
        this.fiscalApiService = fiscalApiService;
        this.logger = new common_1.Logger(FiscalService_1.name);
    }
    async generateNFe(nfeData) {
        try {
            this.logger.log(`Generating NFe for company: ${nfeData.companyId}`);
            const company = await this.prisma.company.findUnique({
                where: { id: nfeData.companyId },
            });
            if (!company) {
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
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
            const response = {
                numero: Math.floor(Math.random() * 1000000).toString(),
                chave_acesso: `NFe${Date.now()}${Math.floor(Math.random() * 1000000)}`,
                status: 'Autorizada',
                xml: '<?xml version="1.0" encoding="UTF-8"?><nfe></nfe>',
                pdf_url: 'https://example.com/documento.pdf',
            };
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
        }
        catch (error) {
            this.logger.error('Error generating NFe:', error);
            throw new common_1.BadRequestException('Erro ao gerar NFe');
        }
    }
    async generateNFCe(nfceData) {
        try {
            this.logger.log(`Generating NFCe for sale: ${nfceData.saleId}`);
            const company = await this.prisma.company.findUnique({
                where: { id: nfceData.companyId },
            });
            if (!company) {
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
            const nfceRequest = {
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
                    ncm: '99999999',
                    cfop: '5102',
                })),
                totalValue: nfceData.totalValue,
                paymentMethod: nfceData.paymentMethod,
                saleId: nfceData.saleId,
                sellerName: nfceData.sellerName,
            };
            const fiscalResponse = await this.fiscalApiService.generateNFCe(nfceRequest);
            if (!fiscalResponse.success) {
                throw new common_1.BadRequestException(fiscalResponse.error || 'Erro na geração da NFCe');
            }
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
        }
        catch (error) {
            this.logger.error('Error generating NFCe:', error);
            throw new common_1.BadRequestException('Erro ao gerar NFCe');
        }
    }
    async generateNFSe(nfseData) {
        try {
            this.logger.log(`Generating NFSe for company: ${nfseData.companyId}`);
            const company = await this.prisma.company.findUnique({
                where: { id: nfseData.companyId },
            });
            if (!company) {
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
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
            const response = {
                numero: Math.floor(Math.random() * 1000000).toString(),
                chave_acesso: `NFSe${Date.now()}${Math.floor(Math.random() * 1000000)}`,
                status: 'Autorizada',
                xml: '<?xml version="1.0" encoding="UTF-8"?><nfse></nfse>',
                pdf_url: 'https://example.com/documento.pdf',
            };
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
        }
        catch (error) {
            this.logger.error('Error generating NFSe:', error);
            throw new common_1.BadRequestException('Erro ao gerar NFSe');
        }
    }
    async getFiscalDocuments(companyId, page = 1, limit = 10, documentType) {
        const where = {};
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
    async getFiscalDocument(id, companyId) {
        const where = { id };
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
            throw new common_1.NotFoundException('Documento fiscal não encontrado');
        }
        return document;
    }
    async cancelFiscalDocument(id, reason, companyId) {
        try {
            const where = { id };
            if (companyId) {
                where.companyId = companyId;
            }
            const document = await this.prisma.fiscalDocument.findUnique({
                where,
            });
            if (!document) {
                throw new common_1.NotFoundException('Documento fiscal não encontrado');
            }
            if (document.status === 'Cancelada') {
                throw new common_1.BadRequestException('Documento já está cancelado');
            }
            const response = {
                status: 'Cancelada',
                motivo: reason,
            };
            const updatedDocument = await this.prisma.fiscalDocument.update({
                where: { id },
                data: {
                    status: 'Cancelada',
                },
            });
            this.logger.log(`Fiscal document cancelled: ${id}`);
            return updatedDocument;
        }
        catch (error) {
            this.logger.error('Error cancelling fiscal document:', error);
            throw new common_1.BadRequestException('Erro ao cancelar documento fiscal');
        }
    }
    async downloadFiscalDocument(id, format, companyId) {
        const document = await this.getFiscalDocument(id, companyId);
        if (format === 'xml') {
            if (!document.xmlContent) {
                throw new common_1.BadRequestException('Conteúdo XML não disponível para este documento');
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
            return {
                url: document.pdfUrl,
                filename: `${document.documentType}_${document.documentNumber}.pdf`,
                mimetype: 'application/pdf',
                contentType: 'application/pdf',
                downloadUrl: `/api/fiscal/${id}/download?format=pdf`,
                isExternal: true
            };
        }
        throw new common_1.BadRequestException('Formato não suportado. Use "xml" ou "pdf"');
    }
    async generatePdfFromDocument(document) {
        try {
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
        }
        catch (error) {
            this.logger.error('Error generating PDF:', error);
            throw new common_1.BadRequestException('Erro ao gerar PDF do documento');
        }
    }
    async getFiscalStats(companyId) {
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
    async getFiscalDocumentByAccessKey(accessKey, companyId) {
        const where = { accessKey };
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
            throw new common_1.NotFoundException('Documento fiscal não encontrado');
        }
        return document;
    }
    async getFiscalApiStatus() {
        return await this.fiscalApiService.getFiscalStatus();
    }
    async uploadCertificate(certificatePath, password) {
        return await this.fiscalApiService.uploadCertificate(certificatePath, password);
    }
    async validateCompanyFiscalData(companyId) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            return { valid: false, errors: ['Empresa não encontrada'] };
        }
        const errors = [];
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
    async processXmlFile(file, companyId) {
        try {
            this.logger.log(`Processing XML file: ${file.originalname} for company: ${companyId}`);
            const xmlContent = file.buffer.toString('utf8');
            const parser = new xml2js.Parser({
                explicitArray: false,
                ignoreAttrs: false,
                mergeAttrs: true
            });
            const result = await parser.parseStringPromise(xmlContent);
            const documentInfo = this.extractDocumentInfo(result);
            const existingDocument = await this.prisma.fiscalDocument.findFirst({
                where: {
                    accessKey: documentInfo.accessKey,
                    companyId: companyId
                }
            });
            if (existingDocument) {
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
            }
            else {
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
        }
        catch (error) {
            this.logger.error('Error processing XML file:', error);
            throw new common_1.BadRequestException('Erro ao processar arquivo XML: ' + error.message);
        }
    }
    extractDocumentInfo(xmlData) {
        try {
            let documentInfo = {};
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
        }
        catch (error) {
            this.logger.error('Error extracting document info:', error);
            throw new common_1.BadRequestException('Erro ao extrair informações do XML: ' + error.message);
        }
    }
};
exports.FiscalService = FiscalService;
exports.FiscalService = FiscalService = FiscalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        fiscal_api_service_1.FiscalApiService])
], FiscalService);
//# sourceMappingURL=fiscal.service.js.map
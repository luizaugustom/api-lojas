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
const validation_service_1 = require("../../shared/services/validation.service");
const fiscal_api_service_1 = require("../../shared/services/fiscal-api.service");
const xml2js = require("xml2js");
let FiscalService = FiscalService_1 = class FiscalService {
    constructor(configService, prisma, fiscalApiService, validationService) {
        this.configService = configService;
        this.prisma = prisma;
        this.fiscalApiService = fiscalApiService;
        this.validationService = validationService;
        this.logger = new common_1.Logger(FiscalService_1.name);
    }
    async generateNFe(nfeData) {
        try {
            this.logger.log(`Generating NFe for company: ${nfeData.companyId}`);
            const isManualMode = !nfeData.saleId && nfeData.recipient && nfeData.items;
            const isSaleMode = !!nfeData.saleId;
            if (!isManualMode && !isSaleMode) {
                throw new common_1.BadRequestException('Informe saleId ou dados completos para emissão manual');
            }
            let nfeRequest;
            let saleReference = '';
            if (isSaleMode) {
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
                    throw new common_1.NotFoundException('Venda não encontrada');
                }
                if (!sale.clientCpfCnpj || !sale.clientName) {
                    throw new common_1.BadRequestException('Venda não possui dados de cliente (CPF/CNPJ e Nome são obrigatórios)');
                }
                this.validationService.validateCPFOrCNPJ(sale.clientCpfCnpj);
                for (const item of sale.items) {
                    if (item.product.ncm && !item.product.ncm.startsWith('99999999')) {
                        this.validationService.validateNCM(item.product.ncm);
                    }
                    if (item.product.cfop) {
                        this.validationService.validateCFOP(item.product.cfop);
                    }
                }
                nfeRequest = {
                    companyId: nfeData.companyId,
                    recipient: {
                        document: sale.clientCpfCnpj,
                        name: sale.clientName,
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
                    paymentMethod: sale.paymentMethods[0]?.method || '99',
                    referenceId: sale.id,
                };
                saleReference = sale.id;
            }
            else {
                this.validationService.validateCPFOrCNPJ(nfeData.recipient.document);
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
            const fiscalResponse = await this.fiscalApiService.generateNFe(nfeRequest);
            if (!fiscalResponse.success) {
                throw new common_1.BadRequestException(fiscalResponse.error || 'Erro na geração da NF-e');
            }
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
        }
        catch (error) {
            this.logger.error('Error generating NFe:', error);
            if (error instanceof common_1.BadRequestException || error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException('Erro ao gerar NF-e');
        }
    }
    async hasValidFiscalConfig(companyId) {
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
            const hasRequiredFields = !!(company.cnpj &&
                company.stateRegistration &&
                company.certificatePassword &&
                company.nfceSerie &&
                company.municipioIbge &&
                company.csc &&
                company.idTokenCsc &&
                company.state &&
                company.city);
            return hasRequiredFields;
        }
        catch (error) {
            this.logger.error('Error checking fiscal config:', error);
            return false;
        }
    }
    async generateMockNFCe(nfceData) {
        try {
            this.logger.log(`Generating MOCK NFCe for sale: ${nfceData.saleId} (empresa sem configuração fiscal)`);
            const company = await this.prisma.company.findUnique({
                where: { id: nfceData.companyId },
            });
            if (!company) {
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
            const mockDocumentNumber = Math.floor(Math.random() * 900000) + 100000;
            const mockAccessKey = this.generateMockAccessKey();
            const mockSerieNumber = company.nfceSerie || '1';
            const mockFiscalDocument = {
                documentType: 'NFCe',
                documentNumber: mockDocumentNumber.toString(),
                accessKey: mockAccessKey,
                status: 'MOCK',
                emissionDate: new Date(),
                serieNumber: mockSerieNumber,
                qrCodeUrl: null,
                protocol: null,
                isMock: true,
            };
            this.logger.log(`Mock NFCe generated successfully for sale: ${nfceData.saleId}`);
            return mockFiscalDocument;
        }
        catch (error) {
            this.logger.error('Error generating mock NFCe:', error);
            throw new common_1.BadRequestException('Erro ao gerar NFCe mockado');
        }
    }
    generateMockAccessKey() {
        let key = '';
        for (let i = 0; i < 44; i++) {
            key += Math.floor(Math.random() * 10);
        }
        return key;
    }
    async generateNFCe(nfceData) {
        try {
            this.logger.log(`Generating NFCe for sale: ${nfceData.saleId}`);
            const hasValidConfig = await this.hasValidFiscalConfig(nfceData.companyId);
            if (!hasValidConfig) {
                this.logger.warn(`Empresa ${nfceData.companyId} não tem configuração fiscal válida. Gerando NFCe mockado.`);
                return await this.generateMockNFCe(nfceData);
            }
            const company = await this.prisma.company.findUnique({
                where: { id: nfceData.companyId },
            });
            if (!company) {
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
            if (nfceData.clientCpfCnpj) {
                this.validationService.validateCPFOrCNPJ(nfceData.clientCpfCnpj);
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
            if (documentType === 'inbound') {
                where.OR = [
                    { documentType: 'NFe_INBOUND' },
                    {
                        documentType: 'NFe',
                        xmlContent: { not: null }
                    }
                ];
            }
            else if (documentType === 'outbound') {
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
    async createInboundInvoice(companyId, data) {
        try {
            this.logger.log(`Creating inbound invoice for company: ${companyId}`);
            if (data.accessKey) {
                const existingDocument = await this.prisma.fiscalDocument.findFirst({
                    where: {
                        accessKey: data.accessKey,
                        companyId: companyId
                    }
                });
                if (existingDocument) {
                    throw new common_1.BadRequestException('Já existe uma nota fiscal com esta chave de acesso');
                }
            }
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
        }
        catch (error) {
            this.logger.error('Error creating inbound invoice:', error);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Erro ao criar nota fiscal de entrada: ' + error.message);
        }
    }
    async updateInboundInvoice(id, companyId, data) {
        try {
            this.logger.log(`Updating inbound invoice ${id} for company: ${companyId}`);
            const fiscalDocument = await this.prisma.fiscalDocument.findUnique({
                where: { id }
            });
            if (!fiscalDocument) {
                throw new common_1.NotFoundException('Nota fiscal não encontrada');
            }
            if (fiscalDocument.companyId !== companyId) {
                throw new common_1.BadRequestException('Esta nota fiscal não pertence à sua empresa');
            }
            const isInboundInvoice = fiscalDocument.documentType === 'NFe_INBOUND' ||
                (fiscalDocument.documentType === 'NFe' && fiscalDocument.xmlContent !== null);
            if (!isInboundInvoice) {
                throw new common_1.BadRequestException('Apenas notas fiscais de entrada podem ser editadas por este método');
            }
            const updateData = {};
            if (data.accessKey !== undefined) {
                if (data.accessKey) {
                    const existingDocument = await this.prisma.fiscalDocument.findFirst({
                        where: {
                            accessKey: data.accessKey,
                            companyId: companyId,
                            id: { not: id }
                        }
                    });
                    if (existingDocument) {
                        throw new common_1.BadRequestException('Já existe uma nota fiscal com esta chave de acesso');
                    }
                    updateData.accessKey = data.accessKey;
                }
                else {
                    updateData.accessKey = null;
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
            if (Object.keys(updateData).length === 0) {
                throw new common_1.BadRequestException('Nenhum dado informado para atualização');
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
        }
        catch (error) {
            this.logger.error('Error updating inbound invoice:', error);
            if (error instanceof common_1.BadRequestException || error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException('Erro ao atualizar nota fiscal de entrada: ' + error.message);
        }
    }
    async deleteInboundInvoice(id, companyId) {
        try {
            this.logger.log(`Deleting inbound invoice ${id} for company: ${companyId}`);
            const fiscalDocument = await this.prisma.fiscalDocument.findUnique({
                where: { id }
            });
            if (!fiscalDocument) {
                throw new common_1.NotFoundException('Nota fiscal não encontrada');
            }
            if (fiscalDocument.companyId !== companyId) {
                throw new common_1.BadRequestException('Esta nota fiscal não pertence à sua empresa');
            }
            const isInboundInvoice = fiscalDocument.documentType === 'NFe_INBOUND' ||
                (fiscalDocument.documentType === 'NFe' && fiscalDocument.xmlContent !== null);
            if (!isInboundInvoice) {
                throw new common_1.BadRequestException('Apenas notas fiscais de entrada podem ser excluídas por este método');
            }
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
        }
        catch (error) {
            this.logger.error('Error deleting inbound invoice:', error);
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Erro ao excluir nota fiscal de entrada: ' + error.message);
        }
    }
};
exports.FiscalService = FiscalService;
exports.FiscalService = FiscalService = FiscalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        fiscal_api_service_1.FiscalApiService,
        validation_service_1.ValidationService])
], FiscalService);
//# sourceMappingURL=fiscal.service.js.map
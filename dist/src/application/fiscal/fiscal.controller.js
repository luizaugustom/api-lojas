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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiscalController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const fiscal_service_1 = require("./fiscal.service");
const generate_nfe_dto_1 = require("./dto/generate-nfe.dto");
const generate_nfse_dto_1 = require("./dto/generate-nfse.dto");
const generate_nfce_dto_1 = require("./dto/generate-nfce.dto");
const cancel_fiscal_document_dto_1 = require("./dto/cancel-fiscal-document.dto");
const create_inbound_invoice_dto_1 = require("./dto/create-inbound-invoice.dto");
const update_inbound_invoice_dto_1 = require("./dto/update-inbound-invoice.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const uuid_validation_pipe_1 = require("../../shared/pipes/uuid-validation.pipe");
let FiscalController = class FiscalController {
    constructor(fiscalService) {
        this.fiscalService = fiscalService;
    }
    async generateNFe(user, generateNFeDto) {
        const nfeData = {
            companyId: user.companyId,
            saleId: generateNFeDto.saleId,
            recipient: generateNFeDto.recipient,
            items: generateNFeDto.items,
            payment: generateNFeDto.payment,
            additionalInfo: generateNFeDto.additionalInfo,
        };
        return this.fiscalService.generateNFe(nfeData);
    }
    async generateNFSe(user, generateNFSeDto) {
        const nfseData = {
            companyId: user.companyId,
            clientCpfCnpj: generateNFSeDto.clientCpfCnpj,
            clientName: generateNFSeDto.clientName,
            serviceDescription: generateNFSeDto.serviceDescription,
            serviceValue: generateNFSeDto.serviceValue,
            paymentMethod: generateNFSeDto.paymentMethod,
        };
        return this.fiscalService.generateNFSe(nfseData);
    }
    async generateNFCe(user, generateNFCeDto) {
        const normalizedPayments = (generateNFCeDto.payments ?? [])
            .map((payment) => ({
            method: payment.method,
            amount: Number(payment.amount ?? 0),
        }))
            .filter((payment) => payment.amount > 0);
        const paymentMethodsFromDto = generateNFCeDto.paymentMethod ?? [];
        const methodsFallback = paymentMethodsFromDto.length > 0 ? paymentMethodsFromDto : [generate_nfce_dto_1.PaymentMethod.CASH];
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
    async getFiscalDocuments(user, page = 1, limit = 10, documentType) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.fiscalService.getFiscalDocuments(undefined, page, limit, documentType);
        }
        return this.fiscalService.getFiscalDocuments(user.companyId, page, limit, documentType);
    }
    async getFiscalApiStatus(user) {
        return this.fiscalService.getFiscalApiStatus();
    }
    async uploadCertificate(user, body) {
        const success = await this.fiscalService.uploadCertificate(body.certificatePath, body.password);
        return { success, message: success ? 'Certificado enviado com sucesso' : 'Erro ao enviar certificado' };
    }
    async validateCompanyFiscalData(user) {
        return this.fiscalService.validateCompanyFiscalData(user.companyId);
    }
    async uploadXmlFiscal(file, user) {
        if (!file) {
            throw new Error('Arquivo XML é obrigatório');
        }
        if (file.mimetype !== 'application/xml' && file.mimetype !== 'text/xml') {
            throw new Error('Arquivo deve ser do tipo XML');
        }
        if (file.size > 10 * 1024 * 1024) {
            throw new Error('Arquivo muito grande. Máximo permitido: 10MB');
        }
        const companyId = user.role === roles_decorator_1.UserRole.ADMIN ? user.companyId : user.companyId;
        if (!companyId) {
            throw new Error('Company ID não encontrado');
        }
        return this.fiscalService.processXmlFile(file, companyId);
    }
    async createInboundInvoice(createInboundInvoiceDto, user) {
        const companyId = user.role === roles_decorator_1.UserRole.ADMIN ? user.companyId : user.companyId;
        if (!companyId) {
            throw new Error('Company ID não encontrado');
        }
        return this.fiscalService.createInboundInvoice(companyId, createInboundInvoiceDto);
    }
    async updateInboundInvoice(id, updateInboundInvoiceDto, user) {
        const companyId = user.role === roles_decorator_1.UserRole.ADMIN ? user.companyId : user.companyId;
        if (!companyId) {
            throw new Error('Company ID não encontrado');
        }
        return this.fiscalService.updateInboundInvoice(id, companyId, updateInboundInvoiceDto);
    }
    async getFiscalDocumentByAccessKey(accessKey, user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.fiscalService.getFiscalDocumentByAccessKey(accessKey);
        }
        return this.fiscalService.getFiscalDocumentByAccessKey(accessKey, user.companyId);
    }
    async getFiscalDocument(id, user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.fiscalService.getFiscalDocument(id);
        }
        return this.fiscalService.getFiscalDocument(id, user.companyId);
    }
    async downloadFiscalDocument(id, format, user, res) {
        try {
            const result = user.role === roles_decorator_1.UserRole.ADMIN
                ? await this.fiscalService.downloadFiscalDocument(id, format)
                : await this.fiscalService.downloadFiscalDocument(id, format, user.companyId);
            res.setHeader('Content-Type', result.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
            if (result.size) {
                res.setHeader('Content-Length', result.size);
            }
            if (result.content !== undefined) {
                const buffer = this.mapContentToBuffer(result.content);
                return res.status(common_1.HttpStatus.OK).send(buffer);
            }
            return res.status(common_1.HttpStatus.OK).json({
                message: 'Informações do arquivo',
                filename: result.filename,
                downloadUrl: result.downloadUrl,
                size: result.size,
                mimetype: result.mimetype
            });
        }
        catch (error) {
            return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                message: error.message || 'Erro ao baixar documento fiscal',
                error: 'Bad Request'
            });
        }
    }
    mapContentToBuffer(content) {
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
        throw new common_1.BadRequestException('Formato de conteúdo não suportado para download');
    }
    async getDownloadInfo(id, user) {
        const document = user.role === roles_decorator_1.UserRole.ADMIN
            ? await this.fiscalService.getFiscalDocument(id)
            : await this.fiscalService.getFiscalDocument(id, user.companyId);
        const availableFormats = [];
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
        if (document.pdfUrl) {
            availableFormats.push({
                format: 'pdf',
                available: true,
                filename: `${document.documentType}_${document.documentNumber}.pdf`,
                downloadUrl: `/api/fiscal/${id}/download?format=pdf`,
                mimetype: 'application/pdf',
                isExternal: true
            });
        }
        else {
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
    async cancelFiscalDocument(id, cancelDto, user) {
        return this.fiscalService.cancelFiscalDocument(id, cancelDto.reason, user.companyId);
    }
    async getFiscalDocumentStatus(id, user) {
        return this.fiscalService.getFiscalDocumentStatus(id, user.companyId);
    }
    async deleteInboundInvoice(id, user) {
        const companyId = user.role === roles_decorator_1.UserRole.ADMIN ? user.companyId : user.companyId;
        if (!companyId) {
            throw new Error('Company ID não encontrado');
        }
        return this.fiscalService.deleteInboundInvoice(id, companyId);
    }
};
exports.FiscalController = FiscalController;
__decorate([
    (0, common_1.Post)('nfe'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Gerar NFe - Vinculada a venda ou manual' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'NFe gerada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos para geração da NFe' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generate_nfe_dto_1.GenerateNFeDto]),
    __metadata("design:returntype", Promise)
], FiscalController.prototype, "generateNFe", null);
__decorate([
    (0, common_1.Post)('nfse'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Gerar NFSe' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'NFSe gerada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos para geração da NFSe' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generate_nfse_dto_1.GenerateNFSeDto]),
    __metadata("design:returntype", Promise)
], FiscalController.prototype, "generateNFSe", null);
__decorate([
    (0, common_1.Post)('nfce'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Gerar NFCe' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'NFCe gerada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos para geração da NFCe' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generate_nfce_dto_1.GenerateNFCeDto]),
    __metadata("design:returntype", Promise)
], FiscalController.prototype, "generateNFCe", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Listar documentos fiscais' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'documentType', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de documentos fiscais' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('documentType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String]),
    __metadata("design:returntype", Promise)
], FiscalController.prototype, "getFiscalDocuments", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter status da API fiscal' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status da API fiscal' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FiscalController.prototype, "getFiscalApiStatus", null);
__decorate([
    (0, common_1.Post)('certificate/upload'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Upload de certificado digital' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Certificado enviado com sucesso' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FiscalController.prototype, "uploadCertificate", null);
__decorate([
    (0, common_1.Get)('validate-company'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Validar dados fiscais da empresa' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Resultado da validação' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FiscalController.prototype, "validateCompanyFiscalData", null);
__decorate([
    (0, common_1.Post)('upload-xml'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('xmlFile')),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload de arquivo XML fiscal',
        description: 'Faz upload de um arquivo XML fiscal (NFe, NFSe, NFCe) e processa suas informações'
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Arquivo XML inválido ou erro no processamento' }),
    (0, swagger_1.ApiResponse)({ status: 413, description: 'Arquivo muito grande (máximo 10MB)' }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FiscalController.prototype, "uploadXmlFiscal", null);
__decorate([
    (0, common_1.Post)('inbound-invoice'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({
        summary: 'Criar nota fiscal de entrada manual',
        description: 'Registra uma nota fiscal de entrada com informações básicas (chave de acesso, fornecedor, total)'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Nota fiscal de entrada criada com sucesso',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos ou chave de acesso já existe' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_inbound_invoice_dto_1.CreateInboundInvoiceDto, Object]),
    __metadata("design:returntype", Promise)
], FiscalController.prototype, "createInboundInvoice", null);
__decorate([
    (0, common_1.Patch)('inbound-invoice/:id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({
        summary: 'Editar nota fiscal de entrada manual',
        description: 'Atualiza campos básicos de uma nota fiscal de entrada (chave de acesso, fornecedor, total)'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Nota fiscal de entrada atualizada com sucesso',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos ou chave de acesso já existe' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_inbound_invoice_dto_1.UpdateInboundInvoiceDto, Object]),
    __metadata("design:returntype", Promise)
], FiscalController.prototype, "updateInboundInvoice", null);
__decorate([
    (0, common_1.Get)('access-key/:accessKey'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar documento fiscal por chave de acesso' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Documento fiscal encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Documento fiscal não encontrado' }),
    __param(0, (0, common_1.Param)('accessKey')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FiscalController.prototype, "getFiscalDocumentByAccessKey", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar documento fiscal por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Documento fiscal encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Documento fiscal não encontrado' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FiscalController.prototype, "getFiscalDocument", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({
        summary: 'Baixar documento fiscal',
        description: 'Baixa documento fiscal em formato XML ou PDF com headers apropriados para download'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'format',
        enum: ['xml', 'pdf'],
        required: true,
        description: 'Formato do documento: xml ou pdf'
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Formato não suportado ou conteúdo não disponível' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Documento fiscal não encontrado' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Query)('format')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], FiscalController.prototype, "downloadFiscalDocument", null);
__decorate([
    (0, common_1.Get)(':id/download-info'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({
        summary: 'Obter informações de download do documento fiscal',
        description: 'Retorna informações sobre os formatos disponíveis para download sem fazer o download'
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Documento fiscal não encontrado' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FiscalController.prototype, "getDownloadInfo", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar documento fiscal' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Documento fiscal cancelado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Documento já está cancelado' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cancel_fiscal_document_dto_1.CancelFiscalDocumentDto, Object]),
    __metadata("design:returntype", Promise)
], FiscalController.prototype, "cancelFiscalDocument", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar status do documento fiscal na SEFAZ' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status do documento obtido com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Documento fiscal não encontrado' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FiscalController.prototype, "getFiscalDocumentStatus", null);
__decorate([
    (0, common_1.Delete)('inbound-invoice/:id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({
        summary: 'Excluir nota fiscal de entrada',
        description: 'Exclui uma nota fiscal de entrada da empresa. Apenas notas de entrada podem ser excluídas: NFe_INBOUND (criadas manualmente) ou NFe com XML (importadas via upload).'
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Nota fiscal não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Nota fiscal não pertence à empresa ou não é uma nota de entrada' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FiscalController.prototype, "deleteInboundInvoice", null);
exports.FiscalController = FiscalController = __decorate([
    (0, swagger_1.ApiTags)('fiscal'),
    (0, common_1.Controller)('fiscal'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [fiscal_service_1.FiscalService])
], FiscalController);
//# sourceMappingURL=fiscal.controller.js.map
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
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const upload_service_1 = require("./upload.service");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
let UploadController = class UploadController {
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    async uploadSingle(file, subfolder) {
        if (!file) {
            throw new common_1.BadRequestException('Nenhum arquivo foi enviado');
        }
        if (subfolder && subfolder.startsWith('products')) {
            throw new common_1.BadRequestException('Use o endpoint /product/upload-and-create para fazer upload de fotos de produtos');
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
    async uploadMultiple(files, subfolder) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('Nenhum arquivo foi enviado');
        }
        if (subfolder && subfolder.startsWith('products')) {
            throw new common_1.BadRequestException('Use o endpoint /product/upload-and-create para fazer upload de fotos de produtos');
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
    async deleteFile(fileUrl) {
        if (!fileUrl) {
            throw new common_1.BadRequestException('URL do arquivo é obrigatória');
        }
        const success = await this.uploadService.deleteFile(fileUrl);
        return {
            success,
            message: success ? 'Arquivo excluído com sucesso' : 'Arquivo não encontrado',
        };
    }
    async deleteMultipleFiles(fileUrls) {
        if (!fileUrls || fileUrls.length === 0) {
            throw new common_1.BadRequestException('URLs dos arquivos são obrigatórias');
        }
        const result = await this.uploadService.deleteMultipleFiles(fileUrls);
        return {
            success: true,
            ...result,
            message: `${result.deleted} arquivo(s) excluído(s), ${result.failed} falharam`,
        };
    }
    async getFileInfo(fileUrl) {
        if (!fileUrl) {
            throw new common_1.BadRequestException('URL do arquivo é obrigatória');
        }
        const info = await this.uploadService.getFileInfo(fileUrl);
        return {
            fileUrl,
            ...info,
        };
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)('single'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiOperation)({ summary: 'Fazer upload de um arquivo' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Arquivo enviado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Arquivo inválido ou muito grande' }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Query)('subfolder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadSingle", null);
__decorate([
    (0, common_1.Post)('multiple'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10)),
    (0, swagger_1.ApiOperation)({ summary: 'Fazer upload de múltiplos arquivos' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Arquivos enviados com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Arquivos inválidos ou muito grandes' }),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Query)('subfolder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadMultiple", null);
__decorate([
    (0, common_1.Delete)('file'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir arquivo' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Arquivo excluído com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Arquivo não encontrado' }),
    __param(0, (0, common_1.Body)('fileUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "deleteFile", null);
__decorate([
    (0, common_1.Delete)('files'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir múltiplos arquivos' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Arquivos processados' }),
    __param(0, (0, common_1.Body)('fileUrls')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "deleteMultipleFiles", null);
__decorate([
    (0, common_1.Post)('info'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter informações do arquivo' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Informações do arquivo' }),
    __param(0, (0, common_1.Body)('fileUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "getFileInfo", null);
exports.UploadController = UploadController = __decorate([
    (0, swagger_1.ApiTags)('upload'),
    (0, common_1.Controller)('upload'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [upload_service_1.UploadService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map
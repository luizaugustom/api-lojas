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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductPhotoValidationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../infrastructure/database/prisma.service");
const plan_limits_service_1 = require("../../../shared/services/plan-limits.service");
const upload_constants_1 = require("../../../shared/constants/upload.constants");
const path = require("path");
let ProductPhotoValidationService = class ProductPhotoValidationService {
    constructor(prisma, planLimitsService) {
        this.prisma = prisma;
        this.planLimitsService = planLimitsService;
    }
    async validatePhotoLimit(companyId, currentPhotosCount, newPhotosCount) {
        await this.planLimitsService.validatePhotoUploadEnabled(companyId);
        await this.planLimitsService.validatePhotoLimitPerProduct(companyId, currentPhotosCount, newPhotosCount);
    }
    validateImageFile(file) {
        if (file.size > upload_constants_1.MAX_FILE_SIZE) {
            const sizeMB = (upload_constants_1.MAX_FILE_SIZE / 1024 / 1024).toFixed(2);
            throw new common_1.BadRequestException(`Arquivo muito grande. Tamanho máximo permitido: ${sizeMB}MB`);
        }
        if (!upload_constants_1.ALLOWED_IMAGE_MIMETYPES.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`Tipo de arquivo não permitido. Use apenas: ${upload_constants_1.ALLOWED_IMAGE_MIMETYPES.join(', ')}`);
        }
        const extension = path.extname(file.originalname).toLowerCase();
        if (!upload_constants_1.ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
            throw new common_1.BadRequestException(`Extensão de arquivo não permitida. Use apenas: ${upload_constants_1.ALLOWED_IMAGE_EXTENSIONS.join(', ')}`);
        }
    }
    validateImageFiles(files) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('Nenhum arquivo foi enviado');
        }
        files.forEach((file, index) => {
            try {
                this.validateImageFile(file);
            }
            catch (error) {
                throw new common_1.BadRequestException(`Erro no arquivo ${index + 1} (${file.originalname}): ${error.message}`);
            }
        });
    }
    async getMaxPhotosForCompany(companyId) {
        const limits = await this.planLimitsService.getCompanyLimits(companyId);
        return limits.maxPhotosPerProduct;
    }
};
exports.ProductPhotoValidationService = ProductPhotoValidationService;
exports.ProductPhotoValidationService = ProductPhotoValidationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        plan_limits_service_1.PlanLimitsService])
], ProductPhotoValidationService);
//# sourceMappingURL=product-photo-validation.service.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModule = void 0;
const common_1 = require("@nestjs/common");
const product_service_1 = require("./product.service");
const product_controller_1 = require("./product.controller");
const product_photo_service_1 = require("./services/product-photo.service");
const product_photo_validation_service_1 = require("./services/product-photo-validation.service");
const prisma_module_1 = require("../../infrastructure/database/prisma.module");
const upload_module_1 = require("../upload/upload.module");
const plan_limits_module_1 = require("../../shared/services/plan-limits.module");
let ProductModule = class ProductModule {
};
exports.ProductModule = ProductModule;
exports.ProductModule = ProductModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, upload_module_1.UploadModule, plan_limits_module_1.PlanLimitsModule],
        providers: [
            product_service_1.ProductService,
            product_photo_service_1.ProductPhotoService,
            product_photo_validation_service_1.ProductPhotoValidationService,
        ],
        controllers: [product_controller_1.ProductController],
        exports: [product_service_1.ProductService],
    })
], ProductModule);
//# sourceMappingURL=product.module.js.map
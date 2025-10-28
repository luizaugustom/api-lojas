"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyModule = void 0;
const common_1 = require("@nestjs/common");
const company_service_1 = require("./company.service");
const company_controller_1 = require("./company.controller");
const prisma_module_1 = require("../../infrastructure/database/prisma.module");
const hash_module_1 = require("../../shared/services/hash.module");
const plan_limits_module_1 = require("../../shared/services/plan-limits.module");
const encryption_service_1 = require("../../shared/services/encryption.service");
const upload_module_1 = require("../upload/upload.module");
let CompanyModule = class CompanyModule {
};
exports.CompanyModule = CompanyModule;
exports.CompanyModule = CompanyModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, hash_module_1.HashModule, plan_limits_module_1.PlanLimitsModule, upload_module_1.UploadModule],
        providers: [company_service_1.CompanyService, encryption_service_1.EncryptionService],
        controllers: [company_controller_1.CompanyController],
        exports: [company_service_1.CompanyService],
    })
], CompanyModule);
//# sourceMappingURL=company.module.js.map
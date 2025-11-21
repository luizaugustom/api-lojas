"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiscalModule = void 0;
const common_1 = require("@nestjs/common");
const fiscal_service_1 = require("./fiscal.service");
const fiscal_controller_1 = require("./fiscal.controller");
const prisma_module_1 = require("../../infrastructure/database/prisma.module");
const config_1 = require("@nestjs/config");
const fiscal_api_service_1 = require("../../shared/services/fiscal-api.service");
const validation_module_1 = require("../../shared/services/validation.module");
const ibpt_service_1 = require("../../shared/services/ibpt.service");
const platform_express_1 = require("@nestjs/platform-express");
let FiscalModule = class FiscalModule {
};
exports.FiscalModule = FiscalModule;
exports.FiscalModule = FiscalModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            config_1.ConfigModule,
            validation_module_1.ValidationModule,
            platform_express_1.MulterModule.register({
                limits: {
                    fileSize: 10 * 1024 * 1024,
                },
            })
        ],
        providers: [fiscal_service_1.FiscalService, fiscal_api_service_1.FiscalApiService, ibpt_service_1.IBPTService],
        controllers: [fiscal_controller_1.FiscalController],
        exports: [fiscal_service_1.FiscalService, fiscal_api_service_1.FiscalApiService],
    })
], FiscalModule);
//# sourceMappingURL=fiscal.module.js.map
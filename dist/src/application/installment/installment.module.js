"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallmentModule = void 0;
const common_1 = require("@nestjs/common");
const installment_service_1 = require("./installment.service");
const installment_controller_1 = require("./installment.controller");
const installment_messaging_service_1 = require("./installment-messaging.service");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const whatsapp_module_1 = require("../whatsapp/whatsapp.module");
let InstallmentModule = class InstallmentModule {
};
exports.InstallmentModule = InstallmentModule;
exports.InstallmentModule = InstallmentModule = __decorate([
    (0, common_1.Module)({
        imports: [whatsapp_module_1.WhatsappModule],
        controllers: [installment_controller_1.InstallmentController],
        providers: [installment_service_1.InstallmentService, installment_messaging_service_1.InstallmentMessagingService, prisma_service_1.PrismaService],
        exports: [installment_service_1.InstallmentService, installment_messaging_service_1.InstallmentMessagingService],
    })
], InstallmentModule);
//# sourceMappingURL=installment.module.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaleModule = void 0;
const common_1 = require("@nestjs/common");
const sale_service_1 = require("./sale.service");
const sale_controller_1 = require("./sale.controller");
const prisma_module_1 = require("../../infrastructure/database/prisma.module");
const product_module_1 = require("../product/product.module");
const printer_module_1 = require("../printer/printer.module");
const fiscal_module_1 = require("../fiscal/fiscal.module");
const email_module_1 = require("../../shared/services/email.module");
const ibpt_service_1 = require("../../shared/services/ibpt.service");
let SaleModule = class SaleModule {
};
exports.SaleModule = SaleModule;
exports.SaleModule = SaleModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, product_module_1.ProductModule, printer_module_1.PrinterModule, fiscal_module_1.FiscalModule, email_module_1.EmailModule],
        providers: [sale_service_1.SaleService, ibpt_service_1.IBPTService],
        controllers: [sale_controller_1.SaleController],
        exports: [sale_service_1.SaleService],
    })
], SaleModule);
//# sourceMappingURL=sale.module.js.map
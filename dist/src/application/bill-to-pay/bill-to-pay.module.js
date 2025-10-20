"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillToPayModule = void 0;
const common_1 = require("@nestjs/common");
const bill_to_pay_service_1 = require("./bill-to-pay.service");
const bill_to_pay_controller_1 = require("./bill-to-pay.controller");
const prisma_module_1 = require("../../infrastructure/database/prisma.module");
let BillToPayModule = class BillToPayModule {
};
exports.BillToPayModule = BillToPayModule;
exports.BillToPayModule = BillToPayModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        providers: [bill_to_pay_service_1.BillToPayService],
        controllers: [bill_to_pay_controller_1.BillToPayController],
        exports: [bill_to_pay_service_1.BillToPayService],
    })
], BillToPayModule);
//# sourceMappingURL=bill-to-pay.module.js.map
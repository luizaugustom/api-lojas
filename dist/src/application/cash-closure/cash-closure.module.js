"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashClosureModule = void 0;
const common_1 = require("@nestjs/common");
const cash_closure_service_1 = require("./cash-closure.service");
const cash_closure_controller_1 = require("./cash-closure.controller");
const prisma_module_1 = require("../../infrastructure/database/prisma.module");
const printer_module_1 = require("../printer/printer.module");
let CashClosureModule = class CashClosureModule {
};
exports.CashClosureModule = CashClosureModule;
exports.CashClosureModule = CashClosureModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, printer_module_1.PrinterModule],
        providers: [cash_closure_service_1.CashClosureService],
        controllers: [cash_closure_controller_1.CashClosureController],
        exports: [cash_closure_service_1.CashClosureService],
    })
], CashClosureModule);
//# sourceMappingURL=cash-closure.module.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetModule = void 0;
const common_1 = require("@nestjs/common");
const budget_service_1 = require("./budget.service");
const budget_controller_1 = require("./budget.controller");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const printer_module_1 = require("../printer/printer.module");
let BudgetModule = class BudgetModule {
};
exports.BudgetModule = BudgetModule;
exports.BudgetModule = BudgetModule = __decorate([
    (0, common_1.Module)({
        imports: [printer_module_1.PrinterModule],
        controllers: [budget_controller_1.BudgetController],
        providers: [budget_service_1.BudgetService, prisma_service_1.PrismaService],
        exports: [budget_service_1.BudgetService],
    })
], BudgetModule);
//# sourceMappingURL=budget.module.js.map
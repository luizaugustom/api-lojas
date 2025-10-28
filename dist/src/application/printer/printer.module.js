"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrinterModule = void 0;
const common_1 = require("@nestjs/common");
const printer_service_1 = require("./printer.service");
const printer_controller_1 = require("./printer.controller");
const prisma_module_1 = require("../../infrastructure/database/prisma.module");
const printer_driver_service_1 = require("../../shared/services/printer-driver.service");
const thermal_printer_service_1 = require("../../shared/services/thermal-printer.service");
let PrinterModule = class PrinterModule {
};
exports.PrinterModule = PrinterModule;
exports.PrinterModule = PrinterModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
        ],
        providers: [
            printer_service_1.PrinterService,
            printer_driver_service_1.PrinterDriverService,
            thermal_printer_service_1.ThermalPrinterService,
        ],
        controllers: [printer_controller_1.PrinterController],
        exports: [printer_service_1.PrinterService],
    })
], PrinterModule);
//# sourceMappingURL=printer.module.js.map
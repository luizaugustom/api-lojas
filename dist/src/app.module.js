"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("./infrastructure/database/prisma.module");
const hash_module_1 = require("./shared/services/hash.module");
const email_module_1 = require("./shared/services/email.module");
const auth_module_1 = require("./application/auth/auth.module");
const admin_module_1 = require("./application/admin/admin.module");
const company_module_1 = require("./application/company/company.module");
const seller_module_1 = require("./application/seller/seller.module");
const product_module_1 = require("./application/product/product.module");
const sale_module_1 = require("./application/sale/sale.module");
const customer_module_1 = require("./application/customer/customer.module");
const bill_to_pay_module_1 = require("./application/bill-to-pay/bill-to-pay.module");
const cash_closure_module_1 = require("./application/cash-closure/cash-closure.module");
const fiscal_module_1 = require("./application/fiscal/fiscal.module");
const printer_module_1 = require("./application/printer/printer.module");
const upload_module_1 = require("./application/upload/upload.module");
const scale_module_1 = require("./application/scale/scale.module");
const whatsapp_module_1 = require("./application/whatsapp/whatsapp.module");
const n8n_module_1 = require("./application/n8n/n8n.module");
const health_module_1 = require("./application/health/health.module");
const reports_module_1 = require("./application/reports/reports.module");
const dashboard_module_1 = require("./application/dashboard/dashboard.module");
const installment_module_1 = require("./application/installment/installment.module");
const notification_module_1 = require("./application/notification/notification.module");
const budget_module_1 = require("./application/budget/budget.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            schedule_1.ScheduleModule.forRoot(),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    throttlers: [{
                            ttl: parseInt(config.get('THROTTLE_TTL', '60')),
                            limit: parseInt(config.get('THROTTLE_LIMIT', '100')),
                        }]
                }),
            }),
            prisma_module_1.PrismaModule,
            hash_module_1.HashModule,
            email_module_1.EmailModule,
            auth_module_1.AuthModule,
            admin_module_1.AdminModule,
            company_module_1.CompanyModule,
            seller_module_1.SellerModule,
            product_module_1.ProductModule,
            sale_module_1.SaleModule,
            customer_module_1.CustomerModule,
            bill_to_pay_module_1.BillToPayModule,
            cash_closure_module_1.CashClosureModule,
            printer_module_1.PrinterModule,
            fiscal_module_1.FiscalModule,
            upload_module_1.UploadModule,
            whatsapp_module_1.WhatsappModule,
            n8n_module_1.N8nModule,
            reports_module_1.ReportsModule,
            dashboard_module_1.DashboardModule,
            installment_module_1.InstallmentModule,
            notification_module_1.NotificationModule,
            budget_module_1.BudgetModule,
            health_module_1.HealthModule,
            scale_module_1.ScaleModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
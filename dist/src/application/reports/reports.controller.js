"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ReportsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reports_service_1 = require("./reports.service");
const generate_report_dto_1 = require("./dto/generate-report.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const client_time_util_1 = require("../../shared/utils/client-time.util");
let ReportsController = ReportsController_1 = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
        this.logger = new common_1.Logger(ReportsController_1.name);
    }
    async generateReport(user, generateReportDto, req, res) {
        try {
            const clientTimeInfo = (0, client_time_util_1.extractClientTimeInfo)(req);
            const result = await this.reportsService.generateReport(user.companyId, generateReportDto, clientTimeInfo);
            res.setHeader('Content-Type', result.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
            if (Buffer.isBuffer(result.data) || typeof result.data === 'string') {
                res.setHeader('Content-Length', Buffer.byteLength(result.data));
                return res.status(common_1.HttpStatus.OK).send(result.data);
            }
            return res.status(common_1.HttpStatus.OK).json(result.data);
        }
        catch (error) {
            this.logger.error('Erro ao gerar relatório:', error);
            this.logger.error('Stack trace:', error?.stack);
            throw new common_1.InternalServerErrorException(`Erro ao gerar relatório: ${error?.message || 'Erro desconhecido'}`);
        }
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({
        summary: 'Gerar relatório completo para contabilidade',
        description: 'Gera relatórios de vendas, produtos, notas fiscais e outros dados em formato JSON, XML ou Excel para envio à contabilidade',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Relatório gerado com sucesso',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Dados inválidos',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Empresa não encontrada',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generate_report_dto_1.GenerateReportDto, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "generateReport", null);
exports.ReportsController = ReportsController = ReportsController_1 = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map
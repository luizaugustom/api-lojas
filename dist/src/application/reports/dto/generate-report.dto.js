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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateReportDto = exports.ReportFormat = exports.ReportType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var ReportType;
(function (ReportType) {
    ReportType["SALES"] = "sales";
    ReportType["PRODUCTS"] = "products";
    ReportType["INVOICES"] = "invoices";
    ReportType["COMPLETE"] = "complete";
})(ReportType || (exports.ReportType = ReportType = {}));
var ReportFormat;
(function (ReportFormat) {
    ReportFormat["JSON"] = "json";
    ReportFormat["XML"] = "xml";
    ReportFormat["EXCEL"] = "excel";
})(ReportFormat || (exports.ReportFormat = ReportFormat = {}));
class GenerateReportDto {
}
exports.GenerateReportDto = GenerateReportDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ReportType,
        description: 'Tipo de relatório',
        example: ReportType.COMPLETE,
    }),
    (0, class_validator_1.IsEnum)(ReportType),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "reportType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ReportFormat,
        description: 'Formato do relatório',
        example: ReportFormat.XML,
    }),
    (0, class_validator_1.IsEnum)(ReportFormat),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "format", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Data inicial do período (ISO 8601)',
        example: '2025-01-01T00:00:00.000Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Data final do período (ISO 8601)',
        example: '2025-12-31T23:59:59.999Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID do vendedor (opcional)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "sellerId", void 0);
//# sourceMappingURL=generate-report.dto.js.map
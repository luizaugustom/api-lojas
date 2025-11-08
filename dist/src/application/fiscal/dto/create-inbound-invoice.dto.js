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
exports.CreateInboundInvoiceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateInboundInvoiceDto {
}
exports.CreateInboundInvoiceDto = CreateInboundInvoiceDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Chave de acesso da nota fiscal (44 dígitos)',
        example: '35240114200166000187550010000000071123456789',
        minLength: 44,
        maxLength: 44,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{44}$/, { message: 'Chave de acesso deve ter 44 dígitos numéricos' }),
    __metadata("design:type", String)
], CreateInboundInvoiceDto.prototype, "accessKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome do fornecedor',
        example: 'Fornecedor ABC Ltda',
        maxLength: 255,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nome do fornecedor é obrigatório' }),
    (0, class_validator_1.MaxLength)(255, { message: 'Nome do fornecedor deve ter no máximo 255 caracteres' }),
    __metadata("design:type", String)
], CreateInboundInvoiceDto.prototype, "supplierName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Valor total da nota fiscal',
        example: 1500.50,
        minimum: 0,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'Total deve ser um número válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Total é obrigatório' }),
    (0, class_validator_1.Min)(0, { message: 'Total deve ser maior ou igual a zero' }),
    __metadata("design:type", Number)
], CreateInboundInvoiceDto.prototype, "totalValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Número do documento fiscal',
        example: '123456',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInboundInvoiceDto.prototype, "documentNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'URL do PDF anexado à nota fiscal',
        example: 'https://cdn.exemplo.com/notas/nota123.pdf',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInboundInvoiceDto.prototype, "pdfUrl", void 0);
//# sourceMappingURL=create-inbound-invoice.dto.js.map
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
exports.CreateProductDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateProductDto {
}
exports.CreateProductDto = CreateProductDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome do produto',
        example: 'Smartphone Samsung Galaxy',
        minLength: 2,
        maxLength: 255,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateProductDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'URLs das fotos do produto',
        example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
        required: false,
        type: [String],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (!Array.isArray(value))
            return [];
        return value.filter(item => typeof item === 'string' && item.trim().length > 0);
    }),
    __metadata("design:type", Array)
], CreateProductDto.prototype, "photos", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Código de barras do produto',
        example: '7891234567890',
        minLength: 8,
        maxLength: 20,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateProductDto.prototype, "barcode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tamanho do produto',
        example: 'M',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateProductDto.prototype, "size", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade em estoque',
        example: 100,
        minimum: 0,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "stockQuantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Preço do produto',
        example: 1299.99,
        minimum: 0,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Categoria do produto',
        example: 'Eletrônicos',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateProductDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de vencimento do produto',
        example: '2024-12-31',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (!value || value === null || value === '' || (typeof value === 'string' && value.trim() === '')) {
            return undefined;
        }
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return new Date(value + 'T00:00:00.000Z').toISOString();
        }
        return value;
    }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "expirationDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NCM - Nomenclatura Comum do Mercosul (8 dígitos)',
        example: '85171231',
        required: false,
        default: '99999999',
        minLength: 8,
        maxLength: 8,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(8),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (!value)
            return '99999999';
        const cleaned = value.replace(/\D/g, '');
        return cleaned.length === 8 ? cleaned : '99999999';
    }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "ncm", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CFOP - Código Fiscal de Operações e Prestações (4 dígitos)',
        example: '5102',
        required: false,
        default: '5102',
        minLength: 4,
        maxLength: 4,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4),
    (0, class_validator_1.MaxLength)(4),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (!value)
            return '5102';
        const cleaned = value.replace(/\D/g, '');
        return cleaned.length === 4 ? cleaned : '5102';
    }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "cfop", void 0);
//# sourceMappingURL=create-product.dto.js.map
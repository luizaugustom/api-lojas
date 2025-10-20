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
exports.GenerateNFeDto = exports.NFeItemDto = exports.PaymentMethod = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CREDIT_CARD"] = "credit_card";
    PaymentMethod["DEBIT_CARD"] = "debit_card";
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["PIX"] = "pix";
    PaymentMethod["INSTALLMENT"] = "installment";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
class NFeItemDto {
}
exports.NFeItemDto = NFeItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do produto',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NFeItemDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade do produto',
        example: 2,
        minimum: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NFeItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Preço unitário do produto',
        example: 25.50,
        minimum: 0,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NFeItemDto.prototype, "unitPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Preço total do item',
        example: 51.00,
        minimum: 0,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NFeItemDto.prototype, "totalPrice", void 0);
class GenerateNFeDto {
}
exports.GenerateNFeDto = GenerateNFeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CPF ou CNPJ do cliente',
        example: '123.456.789-00',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateNFeDto.prototype, "clientCpfCnpj", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome do cliente',
        example: 'João Silva',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateNFeDto.prototype, "clientName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Itens da NFe',
        type: [NFeItemDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => NFeItemDto),
    __metadata("design:type", Array)
], GenerateNFeDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Valor total da NFe',
        example: 150.75,
        minimum: 0,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], GenerateNFeDto.prototype, "totalValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Métodos de pagamento',
        example: ['cash', 'pix'],
        enum: PaymentMethod,
        isArray: true,
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(PaymentMethod, { each: true }),
    __metadata("design:type", Array)
], GenerateNFeDto.prototype, "paymentMethod", void 0);
//# sourceMappingURL=generate-nfe.dto.js.map
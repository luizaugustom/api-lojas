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
exports.GenerateNFSeDto = exports.PaymentMethod = void 0;
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
class GenerateNFSeDto {
}
exports.GenerateNFSeDto = GenerateNFSeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CPF ou CNPJ do cliente',
        example: '123.456.789-00',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateNFSeDto.prototype, "clientCpfCnpj", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome do cliente',
        example: 'João Silva',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateNFSeDto.prototype, "clientName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Descrição do serviço',
        example: 'Consultoria em desenvolvimento de software',
        minLength: 5,
        maxLength: 255,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateNFSeDto.prototype, "serviceDescription", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Valor do serviço',
        example: 500.00,
        minimum: 0,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], GenerateNFSeDto.prototype, "serviceValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Métodos de pagamento',
        example: ['pix'],
        enum: PaymentMethod,
        isArray: true,
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(PaymentMethod, { each: true }),
    __metadata("design:type", Array)
], GenerateNFSeDto.prototype, "paymentMethod", void 0);
//# sourceMappingURL=generate-nfse.dto.js.map
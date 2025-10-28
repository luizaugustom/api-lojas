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
exports.PaymentMethodDto = exports.PaymentMethod = void 0;
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
class PaymentMethodDto {
}
exports.PaymentMethodDto = PaymentMethodDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Método de pagamento',
        enum: PaymentMethod,
        example: PaymentMethod.CASH,
    }),
    (0, class_validator_1.IsEnum)(PaymentMethod),
    __metadata("design:type", String)
], PaymentMethodDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Valor pago neste método específico',
        example: 50.00,
        minimum: 0.01,
    }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0.01, { message: 'O valor deve ser pelo menos 0.01' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], PaymentMethodDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informações adicionais do pagamento (opcional)',
        example: 'Parcelado em 3x',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PaymentMethodDto.prototype, "additionalInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do cliente (obrigatório para vendas a prazo)',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PaymentMethodDto.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Número de parcelas (obrigatório para vendas a prazo)',
        example: 3,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], PaymentMethodDto.prototype, "installments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data do primeiro vencimento (obrigatório para vendas a prazo)',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (!value || value === null || value === '') {
            return undefined;
        }
        if (value instanceof Date && !isNaN(value.getTime())) {
            return value;
        }
        if (typeof value === 'string' && !isNaN(Date.parse(value))) {
            return new Date(value);
        }
        return undefined;
    }),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)({ message: 'A data de vencimento deve ser uma data válida' }),
    __metadata("design:type", Date)
], PaymentMethodDto.prototype, "firstDueDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Descrição das parcelas (opcional)',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentMethodDto.prototype, "description", void 0);
//# sourceMappingURL=payment-method.dto.js.map
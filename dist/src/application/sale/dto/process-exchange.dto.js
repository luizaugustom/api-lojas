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
exports.ProcessExchangeDto = exports.ExchangePaymentDto = exports.ExchangeNewItemDto = exports.ExchangeReturnedItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const payment_method_dto_1 = require("./payment-method.dto");
class ExchangeReturnedItemDto {
}
exports.ExchangeReturnedItemDto = ExchangeReturnedItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do item da venda original',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ExchangeReturnedItemDto.prototype, "saleItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do produto devolvido',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ExchangeReturnedItemDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade devolvida',
        example: 1,
        minimum: 1,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ExchangeReturnedItemDto.prototype, "quantity", void 0);
class ExchangeNewItemDto {
}
exports.ExchangeNewItemDto = ExchangeNewItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do produto entregue na troca',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ExchangeNewItemDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade entregue',
        example: 1,
        minimum: 1,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ExchangeNewItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Preço unitário aplicado (opcional, usa preço atual se omitido)',
        example: 149.9,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ExchangeNewItemDto.prototype, "unitPrice", void 0);
class ExchangePaymentDto {
}
exports.ExchangePaymentDto = ExchangePaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Método de pagamento',
        example: payment_method_dto_1.PaymentMethod.CASH,
        enum: payment_method_dto_1.PaymentMethod,
    }),
    (0, class_validator_1.IsEnum)(payment_method_dto_1.PaymentMethod),
    __metadata("design:type", String)
], ExchangePaymentDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Valor pago ou reembolsado',
        example: 25.5,
        minimum: 0.01,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ExchangePaymentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informações adicionais (opcional)',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExchangePaymentDto.prototype, "additionalInfo", void 0);
class ProcessExchangeDto {
}
exports.ProcessExchangeDto = ProcessExchangeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da venda original',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ProcessExchangeDto.prototype, "originalSaleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Motivo da troca',
        example: 'Produto com defeito',
        minLength: 3,
        maxLength: 255,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ProcessExchangeDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Observações adicionais',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessExchangeDto.prototype, "note", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Itens devolvidos da venda original',
        type: [ExchangeReturnedItemDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ExchangeReturnedItemDto),
    __metadata("design:type", Array)
], ProcessExchangeDto.prototype, "returnedItems", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Novos itens entregues ao cliente',
        type: [ExchangeNewItemDto],
        required: false,
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ExchangeNewItemDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ProcessExchangeDto.prototype, "newItems", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Pagamentos recebidos do cliente (quando o novo total é maior)',
        type: [ExchangePaymentDto],
        required: false,
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ExchangePaymentDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ProcessExchangeDto.prototype, "payments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reembolsos devolvidos ao cliente (quando o novo total é menor)',
        type: [ExchangePaymentDto],
        required: false,
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ExchangePaymentDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ProcessExchangeDto.prototype, "refunds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Gerar crédito em loja ao invés de reembolso imediato',
        default: false,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ProcessExchangeDto.prototype, "issueStoreCredit", void 0);
//# sourceMappingURL=process-exchange.dto.js.map
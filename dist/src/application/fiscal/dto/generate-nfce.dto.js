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
exports.GenerateNFCeDto = exports.NFCePaymentDto = exports.NFCeItemDto = exports.PaymentMethod = void 0;
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
    PaymentMethod["STORE_CREDIT"] = "store_credit";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
class NFCeItemDto {
}
exports.NFCeItemDto = NFCeItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do produto',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], NFCeItemDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome do produto',
        example: 'Produto Exemplo',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NFCeItemDto.prototype, "productName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Código de barras do produto',
        example: '1234567890123',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NFCeItemDto.prototype, "barcode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade do item',
        example: 2,
        minimum: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NFCeItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Preço unitário do item',
        example: 25.50,
        minimum: 0,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NFCeItemDto.prototype, "unitPrice", void 0);
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
], NFCeItemDto.prototype, "totalPrice", void 0);
class NFCePaymentDto {
}
exports.NFCePaymentDto = NFCePaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Método de pagamento',
        enum: PaymentMethod,
        example: PaymentMethod.CASH,
    }),
    (0, class_validator_1.IsEnum)(PaymentMethod),
    __metadata("design:type", String)
], NFCePaymentDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Valor pago com este método',
        example: 150.0,
        minimum: 0,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NFCePaymentDto.prototype, "amount", void 0);
class GenerateNFCeDto {
}
exports.GenerateNFCeDto = GenerateNFCeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da venda',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GenerateNFCeDto.prototype, "saleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome do vendedor',
        example: 'João Silva',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateNFCeDto.prototype, "sellerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CPF ou CNPJ do cliente',
        example: '123.456.789-00',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateNFCeDto.prototype, "clientCpfCnpj", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome do cliente',
        example: 'Maria Santos',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateNFCeDto.prototype, "clientName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Itens da venda',
        type: [NFCeItemDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => NFCeItemDto),
    __metadata("design:type", Array)
], GenerateNFCeDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Valor total da venda',
        example: 150.00,
        minimum: 0,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], GenerateNFCeDto.prototype, "totalValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Métodos de pagamento',
        example: ['cash', 'pix'],
        enum: PaymentMethod,
        isArray: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(PaymentMethod, { each: true }),
    __metadata("design:type", Array)
], GenerateNFCeDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Pagamentos detalhados com valores',
        type: [NFCePaymentDto],
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => NFCePaymentDto),
    __metadata("design:type", Array)
], GenerateNFCeDto.prototype, "payments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informações adicionais para a NFC-e',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateNFCeDto.prototype, "additionalInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Natureza da operação',
        required: false,
        example: 'Venda de mercadorias',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateNFCeDto.prototype, "operationNature", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Finalidade da emissão (1=normal, 4=devolução, etc.)',
        required: false,
        example: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], GenerateNFCeDto.prototype, "emissionPurpose", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Chave de acesso da NFC-e referenciada (para devoluções)',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateNFCeDto.prototype, "referenceAccessKey", void 0);
//# sourceMappingURL=generate-nfce.dto.js.map
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
exports.CreateSaleDto = exports.SaleItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const payment_method_dto_1 = require("./payment-method.dto");
class SaleItemDto {
}
exports.SaleItemDto = SaleItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do produto',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SaleItemDto.prototype, "productId", void 0);
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
], SaleItemDto.prototype, "quantity", void 0);
class CreateSaleDto {
}
exports.CreateSaleDto = CreateSaleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do vendedor (obrigatório apenas para empresas)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "sellerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Itens da venda',
        type: [SaleItemDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SaleItemDto),
    __metadata("design:type", Array)
], CreateSaleDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CPF ou CNPJ do cliente',
        example: '123.456.789-00',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "clientCpfCnpj", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome do cliente (obrigatório para vendas a prazo)',
        example: 'João Silva',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "clientName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Métodos de pagamento com valores específicos',
        type: [payment_method_dto_1.PaymentMethodDto],
        example: [
            { method: 'cash', amount: 50.00 },
            { method: 'pix', amount: 30.00 }
        ],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => payment_method_dto_1.PaymentMethodDto),
    __metadata("design:type", Array)
], CreateSaleDto.prototype, "paymentMethods", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Valor total pago (para cálculo de troco)',
        example: 150.00,
        required: false,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateSaleDto.prototype, "totalPaid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Se true, não imprime automaticamente a NFC-e (permite confirmação manual)',
        example: false,
        required: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSaleDto.prototype, "skipPrint", void 0);
//# sourceMappingURL=create-sale.dto.js.map
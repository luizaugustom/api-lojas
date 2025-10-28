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
exports.GenerateNFeDto = exports.PaymentInfoDto = exports.NFeManualItemDto = exports.RecipientDto = exports.RecipientAddressDto = exports.PaymentMethod = void 0;
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
class RecipientAddressDto {
}
exports.RecipientAddressDto = RecipientAddressDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'CEP', example: '88000-000', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecipientAddressDto.prototype, "zipCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Logradouro', example: 'Rua das Flores', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecipientAddressDto.prototype, "street", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Número', example: '123', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecipientAddressDto.prototype, "number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Complemento', example: 'Apto 101', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecipientAddressDto.prototype, "complement", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Bairro', example: 'Centro', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecipientAddressDto.prototype, "district", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cidade', example: 'Florianópolis', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecipientAddressDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'UF', example: 'SC', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], RecipientAddressDto.prototype, "state", void 0);
class RecipientDto {
}
exports.RecipientDto = RecipientDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'CPF ou CNPJ do destinatário', example: '123.456.789-00' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecipientDto.prototype, "document", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nome ou Razão Social', example: 'João Silva' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecipientDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Email', example: 'joao@email.com', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecipientDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Telefone', example: '(48) 99999-9999', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecipientDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Endereço do destinatário', type: RecipientAddressDto, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RecipientAddressDto),
    __metadata("design:type", RecipientAddressDto)
], RecipientDto.prototype, "address", void 0);
class NFeManualItemDto {
}
exports.NFeManualItemDto = NFeManualItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Descrição do produto/serviço', example: 'Produto XYZ' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NFeManualItemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Quantidade', example: 2, minimum: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NFeManualItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Valor unitário', example: 25.50, minimum: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NFeManualItemDto.prototype, "unitPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'NCM (8 dígitos)', example: '85171231', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(8),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], NFeManualItemDto.prototype, "ncm", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'CFOP (4 dígitos)', example: '5102' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4),
    (0, class_validator_1.MinLength)(4),
    __metadata("design:type", String)
], NFeManualItemDto.prototype, "cfop", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unidade de medida', example: 'UN' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NFeManualItemDto.prototype, "unitOfMeasure", void 0);
class PaymentInfoDto {
}
exports.PaymentInfoDto = PaymentInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Forma de pagamento (código SEFAZ)', example: '01' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentInfoDto.prototype, "method", void 0);
class GenerateNFeDto {
}
exports.GenerateNFeDto = GenerateNFeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da venda para emitir NF-e vinculada',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateNFeDto.prototype, "saleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Dados do destinatário (obrigatório para emissão manual)',
        type: RecipientDto,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RecipientDto),
    __metadata("design:type", RecipientDto)
], GenerateNFeDto.prototype, "recipient", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Itens da nota fiscal (obrigatório para emissão manual)',
        type: [NFeManualItemDto],
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => NFeManualItemDto),
    __metadata("design:type", Array)
], GenerateNFeDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informações de pagamento (obrigatório para emissão manual)',
        type: PaymentInfoDto,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PaymentInfoDto),
    __metadata("design:type", PaymentInfoDto)
], GenerateNFeDto.prototype, "payment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informações adicionais / observações',
        example: 'Observação sobre a nota fiscal',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateNFeDto.prototype, "additionalInfo", void 0);
//# sourceMappingURL=generate-nfe.dto.js.map
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
exports.SendBulkPromotionalEmailDto = exports.SendPromotionalEmailDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SendPromotionalEmailDto {
}
exports.SendPromotionalEmailDto = SendPromotionalEmailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Título da promoção',
        example: 'Oferta Especial - 20% OFF',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendPromotionalEmailDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Mensagem da promoção',
        example: 'Aproveite nossa oferta especial com 20% de desconto em todos os produtos!',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendPromotionalEmailDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Descrição detalhada da promoção',
        example: 'Válido para todos os produtos da loja. Não acumula com outras promoções.',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendPromotionalEmailDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Informação sobre desconto',
        example: '20% de desconto',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendPromotionalEmailDto.prototype, "discount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de validade da promoção',
        example: '2024-12-31',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SendPromotionalEmailDto.prototype, "validUntil", void 0);
class SendBulkPromotionalEmailDto extends SendPromotionalEmailDto {
}
exports.SendBulkPromotionalEmailDto = SendBulkPromotionalEmailDto;
//# sourceMappingURL=send-email.dto.js.map
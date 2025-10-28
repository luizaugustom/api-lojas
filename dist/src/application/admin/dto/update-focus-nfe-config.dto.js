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
exports.UpdateFocusNfeConfigDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateFocusNfeConfigDto {
}
exports.UpdateFocusNfeConfigDto = UpdateFocusNfeConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'API Key global do Focus NFe (compartilhada por todas as empresas)',
        example: 'sua-api-key-focus-nfe',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    __metadata("design:type", String)
], UpdateFocusNfeConfigDto.prototype, "focusNfeApiKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Ambiente padrão Focus NFe',
        example: 'sandbox',
        enum: ['sandbox', 'production'],
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['sandbox', 'production']),
    __metadata("design:type", String)
], UpdateFocusNfeConfigDto.prototype, "focusNfeEnvironment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token da API IBPT para cálculo de tributos (opcional)',
        example: 'seu-token-ibpt',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateFocusNfeConfigDto.prototype, "ibptToken", void 0);
//# sourceMappingURL=update-focus-nfe-config.dto.js.map
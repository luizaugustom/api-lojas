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
exports.UpdateFiscalConfigDto = exports.TaxRegime = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var TaxRegime;
(function (TaxRegime) {
    TaxRegime["SIMPLES_NACIONAL"] = "SIMPLES_NACIONAL";
    TaxRegime["LUCRO_PRESUMIDO"] = "LUCRO_PRESUMIDO";
    TaxRegime["LUCRO_REAL"] = "LUCRO_REAL";
    TaxRegime["MEI"] = "MEI";
})(TaxRegime || (exports.TaxRegime = TaxRegime = {}));
class UpdateFiscalConfigDto {
}
exports.UpdateFiscalConfigDto = UpdateFiscalConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Regime tributário da empresa',
        example: 'SIMPLES_NACIONAL',
        enum: TaxRegime,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TaxRegime),
    __metadata("design:type", String)
], UpdateFiscalConfigDto.prototype, "taxRegime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CNAE - Classificação Nacional de Atividades Econômicas (7 dígitos)',
        example: '4761001',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(7),
    (0, class_validator_1.MaxLength)(7),
    (0, class_validator_1.Matches)(/^\d{7}$/, { message: 'CNAE deve ter 7 dígitos numéricos' }),
    __metadata("design:type", String)
], UpdateFiscalConfigDto.prototype, "cnae", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Senha do certificado digital (será criptografada)',
        example: 'senha-do-certificado',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateFiscalConfigDto.prototype, "certificatePassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'URL do arquivo do certificado digital',
        example: 'https://storage.googleapis.com/...',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateFiscalConfigDto.prototype, "certificateFileUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Série da NFC-e (geralmente 1)',
        example: '1',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d+$/, { message: 'Série deve conter apenas números' }),
    __metadata("design:type", String)
], UpdateFiscalConfigDto.prototype, "nfceSerie", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Código IBGE do município (7 dígitos)',
        example: '4205407',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(7),
    (0, class_validator_1.MaxLength)(7),
    (0, class_validator_1.Matches)(/^\d{7}$/, { message: 'Código IBGE deve ter 7 dígitos' }),
    __metadata("design:type", String)
], UpdateFiscalConfigDto.prototype, "municipioIbge", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CSC - Código de Segurança do Contribuinte (será criptografado)',
        example: 'seu-codigo-csc',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateFiscalConfigDto.prototype, "csc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do Token CSC (geralmente 000001)',
        example: '000001',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateFiscalConfigDto.prototype, "idTokenCsc", void 0);
//# sourceMappingURL=update-fiscal-config.dto.js.map
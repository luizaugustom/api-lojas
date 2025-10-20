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
exports.UpdateCustomFooterDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateCustomFooterDto {
}
exports.UpdateCustomFooterDto = UpdateCustomFooterDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Footer personalizado para impressão de NFCe',
        example: 'OBRIGADO PELA PREFERÊNCIA!\nVOLTE SEMPRE!\n\nSiga-nos nas redes sociais:\n@minhaloja',
        required: false,
        maxLength: 500,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500, { message: 'Footer personalizado deve ter no máximo 500 caracteres' }),
    __metadata("design:type", String)
], UpdateCustomFooterDto.prototype, "customFooter", void 0);
//# sourceMappingURL=update-custom-footer.dto.js.map
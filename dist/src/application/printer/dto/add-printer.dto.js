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
exports.AddPrinterDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class AddPrinterDto {
}
exports.AddPrinterDto = AddPrinterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nome da impressora', example: 'EPSON TM-T20' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nome da impressora é obrigatório' }),
    (0, class_validator_1.MaxLength)(255, { message: 'Nome da impressora muito longo' }),
    __metadata("design:type", String)
], AddPrinterDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tipo de conexão', example: 'usb', enum: ['usb', 'network', 'bluetooth'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['usb', 'network', 'bluetooth'], { message: 'Tipo de conexão inválido' }),
    __metadata("design:type", String)
], AddPrinterDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Informações de conexão', example: 'USB001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Informações de conexão são obrigatórias' }),
    (0, class_validator_1.MaxLength)(500, { message: 'Informações de conexão muito longas' }),
    __metadata("design:type", String)
], AddPrinterDto.prototype, "connectionInfo", void 0);
//# sourceMappingURL=add-printer.dto.js.map
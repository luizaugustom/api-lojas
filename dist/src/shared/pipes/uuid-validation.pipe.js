"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UuidValidationPipe = void 0;
const common_1 = require("@nestjs/common");
let UuidValidationPipe = class UuidValidationPipe {
    transform(value, metadata) {
        if (!value) {
            throw new common_1.BadRequestException('ID é obrigatório');
        }
        const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidV4Regex.test(value)) {
            throw new common_1.BadRequestException(`ID inválido: ${value}. Esperado formato UUID v4 válido (ex: 550e8400-e29b-41d4-a716-446655440000)`);
        }
        return value;
    }
};
exports.UuidValidationPipe = UuidValidationPipe;
exports.UuidValidationPipe = UuidValidationPipe = __decorate([
    (0, common_1.Injectable)()
], UuidValidationPipe);
//# sourceMappingURL=uuid-validation.pipe.js.map
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
exports.UpdateBudgetDto = exports.BudgetStatus = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var BudgetStatus;
(function (BudgetStatus) {
    BudgetStatus["PENDING"] = "pending";
    BudgetStatus["APPROVED"] = "approved";
    BudgetStatus["REJECTED"] = "rejected";
    BudgetStatus["EXPIRED"] = "expired";
})(BudgetStatus || (exports.BudgetStatus = BudgetStatus = {}));
class UpdateBudgetDto {
}
exports.UpdateBudgetDto = UpdateBudgetDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Status do orçamento',
        enum: BudgetStatus,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(BudgetStatus),
    __metadata("design:type", String)
], UpdateBudgetDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Observações do orçamento',
        example: 'Cliente solicitou revisão de preços',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBudgetDto.prototype, "notes", void 0);
//# sourceMappingURL=update-budget.dto.js.map
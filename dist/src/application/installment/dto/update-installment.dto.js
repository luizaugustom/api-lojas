"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateInstallmentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_installment_dto_1 = require("./create-installment.dto");
class UpdateInstallmentDto extends (0, swagger_1.PartialType)(create_installment_dto_1.CreateInstallmentDto) {
}
exports.UpdateInstallmentDto = UpdateInstallmentDto;
//# sourceMappingURL=update-installment.dto.js.map
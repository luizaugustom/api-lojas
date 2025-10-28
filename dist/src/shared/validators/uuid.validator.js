"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsValidUUID = IsValidUUID;
exports.IsValidUUIDArray = IsValidUUIDArray;
const class_validator_1 = require("class-validator");
function IsValidUUID(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isValidUUID',
            target: object.constructor,
            propertyName: propertyName,
            options: {
                message: `${propertyName} deve ser um UUID válido`,
                ...validationOptions,
            },
            validator: {
                validate(value, args) {
                    if (!value)
                        return true;
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                    return typeof value === 'string' && uuidRegex.test(value);
                },
            },
        });
    };
}
function IsValidUUIDArray(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isValidUUIDArray',
            target: object.constructor,
            propertyName: propertyName,
            options: {
                message: `${propertyName} deve ser um array de UUIDs válidos`,
                ...validationOptions,
            },
            validator: {
                validate(value, args) {
                    if (!value)
                        return true;
                    if (!Array.isArray(value))
                        return false;
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                    return value.every(item => typeof item === 'string' && uuidRegex.test(item));
                },
            },
        });
    };
}
//# sourceMappingURL=uuid.validator.js.map
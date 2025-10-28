import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Valida se o valor é um UUID válido (v4)
 * Este decorador é usado para garantir consistência em toda a aplicação
 */
export function IsValidUUID(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidUUID',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `${propertyName} deve ser um UUID válido`,
        ...validationOptions,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true; // Para campos opcionais
          
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return typeof value === 'string' && uuidRegex.test(value);
        },
      },
    });
  };
}

/**
 * Valida se o valor é um array de UUIDs válidos
 */
export function IsValidUUIDArray(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidUUIDArray',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `${propertyName} deve ser um array de UUIDs válidos`,
        ...validationOptions,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true;
          if (!Array.isArray(value)) return false;
          
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return value.every(item => typeof item === 'string' && uuidRegex.test(item));
        },
      },
    });
  };
}





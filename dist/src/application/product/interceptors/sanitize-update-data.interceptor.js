"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanitizeUpdateDataInterceptor = void 0;
const common_1 = require("@nestjs/common");
let SanitizeUpdateDataInterceptor = class SanitizeUpdateDataInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        if (request.body && request.method === 'PATCH' && request.url.includes('/product')) {
            const allowedFields = [
                'name',
                'photos',
                'photosToDelete',
                'barcode',
                'size',
                'stockQuantity',
                'price',
                'category',
                'expirationDate',
                'unitOfMeasure'
            ];
            const sanitizedBody = {};
            allowedFields.forEach(field => {
                if (request.body[field] !== undefined) {
                    sanitizedBody[field] = request.body[field];
                }
            });
            if (sanitizedBody['photos']) {
                if (Array.isArray(sanitizedBody['photos'])) {
                    sanitizedBody['photos'] = sanitizedBody['photos']
                        .filter(item => typeof item === 'string' && item.trim().length > 0);
                }
                else {
                    delete sanitizedBody['photos'];
                }
            }
            if (sanitizedBody['photosToDelete']) {
                if (Array.isArray(sanitizedBody['photosToDelete'])) {
                    sanitizedBody['photosToDelete'] = sanitizedBody['photosToDelete']
                        .map(item => String(item))
                        .filter(item => item.trim().length > 0);
                }
                else if (typeof sanitizedBody['photosToDelete'] === 'string') {
                    const value = sanitizedBody['photosToDelete'];
                    try {
                        const parsed = JSON.parse(value);
                        sanitizedBody['photosToDelete'] = Array.isArray(parsed)
                            ? parsed.map(item => String(item)).filter(item => item.trim().length > 0)
                            : [value];
                    }
                    catch {
                        sanitizedBody['photosToDelete'] = value.includes(',')
                            ? value.split(',').map(item => item.trim()).filter(item => item.length > 0)
                            : [value];
                    }
                }
                else {
                    delete sanitizedBody['photosToDelete'];
                }
            }
            if (sanitizedBody['stockQuantity']) {
                sanitizedBody['stockQuantity'] = parseInt(sanitizedBody['stockQuantity'], 10);
            }
            if (sanitizedBody['price']) {
                sanitizedBody['price'] = parseFloat(sanitizedBody['price']);
            }
            if (sanitizedBody['expirationDate']) {
                const date = sanitizedBody['expirationDate'];
                if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    sanitizedBody['expirationDate'] = new Date(date + 'T00:00:00.000Z').toISOString();
                }
                else if (date instanceof Date) {
                    sanitizedBody['expirationDate'] = date.toISOString();
                }
                else if (typeof date === 'string' && !isNaN(Date.parse(date))) {
                    sanitizedBody['expirationDate'] = new Date(date).toISOString();
                }
                else {
                    delete sanitizedBody['expirationDate'];
                }
            }
            request.body = sanitizedBody;
        }
        if (request.params && request.params.id) {
            const id = request.params.id;
            const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidV4Regex.test(id)) {
                throw new common_1.BadRequestException(`ID inválido: ${id}. Esperado formato UUID v4 válido (ex: 550e8400-e29b-41d4-a716-446655440000)`);
            }
        }
        return next.handle();
    }
};
exports.SanitizeUpdateDataInterceptor = SanitizeUpdateDataInterceptor;
exports.SanitizeUpdateDataInterceptor = SanitizeUpdateDataInterceptor = __decorate([
    (0, common_1.Injectable)()
], SanitizeUpdateDataInterceptor);
//# sourceMappingURL=sanitize-update-data.interceptor.js.map
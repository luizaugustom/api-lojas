"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanitizeProductDataInterceptor = void 0;
const common_1 = require("@nestjs/common");
let SanitizeProductDataInterceptor = class SanitizeProductDataInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        if (request.body && request.method === 'POST' && request.url.includes('/product')) {
            const allowedFields = [
                'name',
                'photos',
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
        return next.handle();
    }
};
exports.SanitizeProductDataInterceptor = SanitizeProductDataInterceptor;
exports.SanitizeProductDataInterceptor = SanitizeProductDataInterceptor = __decorate([
    (0, common_1.Injectable)()
], SanitizeProductDataInterceptor);
//# sourceMappingURL=sanitize-product-data.interceptor.js.map
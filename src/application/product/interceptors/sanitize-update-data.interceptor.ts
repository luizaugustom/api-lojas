import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SanitizeUpdateDataInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Limpar dados do body para atualização de produto
    if (request.body && request.method === 'PATCH' && request.url.includes('/product')) {
      const allowedFields = [
        'name',
        'photos',
        'barcode',
        'size',
        'stockQuantity',
        'price',
        'category',
        'expirationDate'
      ];

      // Filtrar apenas campos permitidos
      const sanitizedBody = {};
      allowedFields.forEach(field => {
        if (request.body[field] !== undefined) {
          sanitizedBody[field] = request.body[field];
        }
      });

      // Sanitizar array de photos
      if (sanitizedBody['photos']) {
        if (Array.isArray(sanitizedBody['photos'])) {
          sanitizedBody['photos'] = sanitizedBody['photos']
            .filter(item => typeof item === 'string' && item.trim().length > 0);
        } else {
          delete sanitizedBody['photos'];
        }
      }

      // Converter strings para números
      if (sanitizedBody['stockQuantity']) {
        sanitizedBody['stockQuantity'] = parseInt(sanitizedBody['stockQuantity'], 10);
      }
      
      if (sanitizedBody['price']) {
        sanitizedBody['price'] = parseFloat(sanitizedBody['price']);
      }

      // Converter data para formato ISO-8601 DateTime se necessário
      if (sanitizedBody['expirationDate']) {
        const date = sanitizedBody['expirationDate'];
        
        // Se é apenas uma data (YYYY-MM-DD), converter para DateTime
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
          sanitizedBody['expirationDate'] = new Date(date + 'T00:00:00.000Z').toISOString();
        }
        // Se já é um DateTime válido, manter como está
        else if (date instanceof Date) {
          sanitizedBody['expirationDate'] = date.toISOString();
        }
        // Se é uma string ISO válida, manter como está
        else if (typeof date === 'string' && !isNaN(Date.parse(date))) {
          sanitizedBody['expirationDate'] = new Date(date).toISOString();
        }
        // Se não é válido, remover
        else {
          delete sanitizedBody['expirationDate'];
        }
      }

      request.body = sanitizedBody;
    }

    // Validar e sanitizar o ID do parâmetro
    if (request.params && request.params.id) {
      const id = request.params.id;
      
      // Regex para validar UUID v4 APENAS
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (!uuidV4Regex.test(id)) {
        throw new BadRequestException(`ID inválido: ${id}. Esperado formato UUID v4 válido (ex: 550e8400-e29b-41d4-a716-446655440000)`);
      }
    }

    return next.handle();
  }
}

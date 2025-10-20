import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Aplicar apenas para rotas de produto
    if (req.url.includes('/product') && req.method === 'POST') {
      this.sanitizeProductData(req);
    }
    next();
  }

  private sanitizeProductData(req: Request) {
    if (!req.body) return;

    // Campos permitidos para criação de produto
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

    // Criar novo objeto apenas com campos permitidos
    const sanitizedBody = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        sanitizedBody[field] = req.body[field];
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

    // Converter strings para números quando necessário
    if (sanitizedBody['stockQuantity']) {
      const stockQty = parseInt(sanitizedBody['stockQuantity'], 10);
      if (!isNaN(stockQty)) {
        sanitizedBody['stockQuantity'] = stockQty;
      }
    }
    
    if (sanitizedBody['price']) {
      const price = parseFloat(sanitizedBody['price']);
      if (!isNaN(price)) {
        sanitizedBody['price'] = price;
      }
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

    req.body = sanitizedBody;
  }
}

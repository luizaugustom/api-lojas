import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

/**
 * Pipe para validação de UUID v4 em toda a aplicação
 * Garante consistência no formato de IDs usados no sistema
 */
@Injectable()
export class UuidValidationPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) {
      throw new BadRequestException('ID é obrigatório');
    }

    // Regex para validar UUID v4 estrito
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidV4Regex.test(value)) {
      throw new BadRequestException(
        `ID inválido: ${value}. Esperado formato UUID v4 válido (ex: 550e8400-e29b-41d4-a716-446655440000)`
      );
    }

    return value;
  }
}

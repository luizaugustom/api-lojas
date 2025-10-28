import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;
  private readonly iv: Buffer;

  constructor(private readonly configService: ConfigService) {
    // Usar JWT_SECRET como base para gerar chave de criptografia
    const secret = this.configService.get('JWT_SECRET', 'default-secret-key-change-this');
    // Gerar chave de 32 bytes (256 bits) a partir do secret
    this.key = crypto.scryptSync(secret, 'salt', 32);
    // IV fixo baseado no secret (em produção, considere IV por registro)
    this.iv = crypto.scryptSync(secret, 'iv-salt', 16);
  }

  /**
   * Criptografa um texto
   */
  encrypt(text: string): string {
    if (!text) return '';

    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Descriptografa um texto
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return '';

    try {
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      // Se falhar a descriptografia, retornar vazio
      return '';
    }
  }

  /**
   * Mascara dados sensíveis para exibição
   */
  mask(text: string, visibleChars: number = 4): string {
    if (!text) return '';
    if (text.length <= visibleChars) return '*'.repeat(text.length);
    
    const visible = text.substring(0, visibleChars);
    const masked = '*'.repeat(Math.max(text.length - visibleChars, 8));
    return visible + masked;
  }
}


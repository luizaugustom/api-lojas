import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ValidationService {
  /**
   * Valida CPF com dígitos verificadores
   */
  isValidCPF(cpf: string): boolean {
    if (!cpf) return false;
    
    const numbers = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (numbers.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais (inválidos: 111.111.111-11, 222.222.222-22, etc)
    if (/^(\d)\1+$/.test(numbers)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(numbers.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(numbers.charAt(10))) return false;
    
    return true;
  }

  /**
   * Valida CNPJ com dígitos verificadores
   */
  isValidCNPJ(cnpj: string): boolean {
    if (!cnpj) return false;
    
    const numbers = cnpj.replace(/\D/g, '');
    
    // Verifica se tem 14 dígitos
    if (numbers.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais (inválidos: 11.111.111/1111-11, etc)
    if (/^(\d)\1+$/.test(numbers)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    let pos = 5;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(numbers.charAt(i)) * pos;
      pos = pos === 2 ? 9 : pos - 1;
    }
    let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (digit !== parseInt(numbers.charAt(12))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    pos = 6;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(numbers.charAt(i)) * pos;
      pos = pos === 2 ? 9 : pos - 1;
    }
    digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (digit !== parseInt(numbers.charAt(13))) return false;
    
    return true;
  }

  /**
   * Valida CPF ou CNPJ
   */
  isValidCPFOrCNPJ(document: string): boolean {
    if (!document) return false;
    
    const numbers = document.replace(/\D/g, '');
    
    if (numbers.length === 11) {
      return this.isValidCPF(document);
    } else if (numbers.length === 14) {
      return this.isValidCNPJ(document);
    }
    
    return false;
  }

  /**
   * Valida NCM (8 dígitos)
   */
  isValidNCM(ncm: string): boolean {
    if (!ncm) return false;
    
    const numbers = ncm.replace(/\D/g, '');
    
    // NCM deve ter exatamente 8 dígitos
    if (numbers.length !== 8) return false;
    
    // Deve conter apenas números
    if (!/^\d{8}$/.test(numbers)) return false;
    
    return true;
  }

  /**
   * Valida CFOP (4 dígitos)
   */
  isValidCFOP(cfop: string): boolean {
    if (!cfop) return false;
    
    const numbers = cfop.replace(/\D/g, '');
    
    // CFOP deve ter exatamente 4 dígitos
    if (numbers.length !== 4) return false;
    
    // Deve conter apenas números
    if (!/^\d{4}$/.test(numbers)) return false;
    
    return true;
  }

  /**
   * Valida CNAE (7 dígitos)
   */
  isValidCNAE(cnae: string): boolean {
    if (!cnae) return false;
    
    const numbers = cnae.replace(/\D/g, '');
    
    // CNAE deve ter exatamente 7 dígitos
    if (numbers.length !== 7) return false;
    
    // Deve conter apenas números
    if (!/^\d{7}$/.test(numbers)) return false;
    
    return true;
  }

  /**
   * Valida Código IBGE (7 dígitos)
   */
  isValidMunicipioIBGE(ibge: string): boolean {
    if (!ibge) return false;
    
    const numbers = ibge.replace(/\D/g, '');
    
    // Código IBGE deve ter exatamente 7 dígitos
    if (numbers.length !== 7) return false;
    
    // Deve conter apenas números
    if (!/^\d{7}$/.test(numbers)) return false;
    
    return true;
  }

  /**
   * Valida Inscrição Estadual (IE)
   * Nota: IE tem diferentes formatos por estado, então apenas verificamos formato básico
   */
  isValidInscricaoEstadual(ie: string): boolean {
    if (!ie) return false;
    
    // IE pode ter de 8 a 14 caracteres alfanuméricos
    if (ie.length < 8 || ie.length > 14) return false;
    
    // Deve conter apenas números e hífen
    if (!/^[\d-]+$/.test(ie)) return false;
    
    return true;
  }

  /**
   * Valida CEP (formato XXXXX-XXX)
   */
  isValidCEP(cep: string): boolean {
    if (!cep) return false;
    
    const numbers = cep.replace(/\D/g, '');
    
    // CEP deve ter 8 dígitos
    if (numbers.length !== 8) return false;
    
    return true;
  }

  /**
   * Valida e lança exceção se CNPJ inválido
   */
  validateCNPJ(cnpj: string): void {
    if (!this.isValidCNPJ(cnpj)) {
      throw new BadRequestException('CNPJ inválido');
    }
  }

  /**
   * Valida e lança exceção se CPF inválido
   */
  validateCPF(cpf: string): void {
    if (!this.isValidCPF(cpf)) {
      throw new BadRequestException('CPF inválido');
    }
  }

  /**
   * Valida e lança exceção se CPF ou CNPJ inválido
   */
  validateCPFOrCNPJ(document: string): void {
    if (!this.isValidCPFOrCNPJ(document)) {
      throw new BadRequestException('CPF ou CNPJ inválido');
    }
  }

  /**
   * Valida e lança exceção se NCM inválido
   */
  validateNCM(ncm: string): void {
    if (!this.isValidNCM(ncm)) {
      throw new BadRequestException('NCM inválido. NCM deve ter 8 dígitos numéricos');
    }
  }

  /**
   * Valida e lança exceção se CFOP inválido
   */
  validateCFOP(cfop: string): void {
    if (!this.isValidCFOP(cfop)) {
      throw new BadRequestException('CFOP inválido. CFOP deve ter 4 dígitos numéricos');
    }
  }

  /**
   * Valida e lança exceção se CNAE inválido
   */
  validateCNAE(cnae: string): void {
    if (!this.isValidCNAE(cnae)) {
      throw new BadRequestException('CNAE inválido. CNAE deve ter 7 dígitos numéricos');
    }
  }

  /**
   * Valida e lança exceção se código IBGE inválido
   */
  validateMunicipioIBGE(ibge: string): void {
    if (!this.isValidMunicipioIBGE(ibge)) {
      throw new BadRequestException('Código IBGE inválido. Código IBGE deve ter 7 dígitos numéricos');
    }
  }
}


/**
 * Interface para providers de WhatsApp
 * Permite trocar facilmente entre diferentes APIs (Z-API, etc.)
 */
export interface IWhatsAppProvider {
  /**
   * Envia uma mensagem de texto
   */
  sendMessage(phone: string, message: string): Promise<boolean>;

  /**
   * Verifica se a instância está conectada e pronta
   */
  checkConnection(): Promise<{ connected: boolean; status?: string }>;

  /**
   * Valida um número de telefone
   */
  validatePhoneNumber(phone: string): Promise<boolean>;

  /**
   * Formata um número de telefone para o formato internacional
   */
  formatPhoneNumber(phone: string): Promise<string>;
}


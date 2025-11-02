import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ScaleDriverService } from '../../shared/services/scale-driver.service';

@Injectable()
export class ScaleService {
  private readonly logger = new Logger(ScaleService.name);
  // Armazena dispositivos por computador (sem mexer no DB)
  private clientDevices = new Map<string, { scales: any[]; lastUpdate: Date }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly driver: ScaleDriverService,
  ) {}

  async addScale(companyId: string, data: { name: string; connectionInfo: string }) {
    const scale = await this.prisma.scale.create({
      data: {
        name: data.name,
        connectionInfo: data.connectionInfo,
        isConnected: false,
        lastStatusCheck: null,
        companyId,
      },
    });
    return scale;
  }

  async getScales(companyId?: string) {
    const where = companyId ? { companyId } : {};
    return this.prisma.scale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async detectAvailable(computerId?: string | null) {
    // Se há um computerId, retorna dispositivos do cliente
    if (computerId) {
      const clientData = this.clientDevices.get(computerId);
      if (clientData) {
        this.logger.log(`Retornando ${clientData.scales.length} balança(s) do computador ${computerId}`);
        return clientData.scales;
      }
      // Se não encontrou, retorna vazio (dispositivos ainda não foram detectados)
      this.logger.warn(`Nenhuma balança encontrada para o computador ${computerId}`);
      return [];
    }
    
    // Comportamento antigo: detecta no servidor (para compatibilidade)
    return await this.driver.detectSystemScales();
  }

  async registerClientDevices(computerId: string, scales: any[]): Promise<{ success: boolean; message: string }> {
    try {
      // Normaliza dados das balanças
      const normalizedScales = scales.map((s: any) => ({
        name: s.name || s.Name || 'Balança Desconhecida',
        port: s.port || s.Port || s.connectionInfo || '',
        vendor: s.vendor || s.Vendor,
        modelHint: s.modelHint || s.ModelHint || s.name,
        connection: (s.connection || s.Connection || 'serial') as 'usb' | 'serial' | 'bluetooth' | 'hid',
      }));

      // Armazena em memória associado ao computerId
      this.clientDevices.set(computerId, {
        scales: normalizedScales,
        lastUpdate: new Date(),
      });

      this.logger.log(`Balanças registradas para computador ${computerId}: ${normalizedScales.length} balança(s)`);
      
      return {
        success: true,
        message: `${normalizedScales.length} balança(s) registrada(s) para este computador`,
      };
    } catch (error) {
      this.logger.error('Erro ao registrar balanças do cliente:', error);
      return {
        success: false,
        message: 'Erro ao registrar balanças',
      };
    }
  }

  async discover() {
    const devices = await this.driver.detectSystemScales();
    return { devices };
  }

  async checkDrivers() {
    const drivers = await this.driver.checkScaleDrivers();
    return drivers;
  }

  async installDrivers() {
    return await this.driver.installScaleDrivers();
  }

  async status(id: string) {
    const scale = await this.prisma.scale.findUnique({ where: { id } });
    if (!scale) return { connected: false };
    const port = scale.connectionInfo;
    const res = await this.driver.tryReadWeight(port);
    const connected = !!res.success;
    await this.prisma.scale.update({
      where: { id },
      data: { isConnected: connected, lastStatusCheck: new Date() },
    });
    return { connected, raw: res.raw, weight: res.weight, error: res.error };
  }

  async test(id: string) {
    const scale = await this.prisma.scale.findUnique({ where: { id } });
    if (!scale) return { success: false, message: 'Balança não encontrada' };
    const res = await this.driver.tryReadWeight(scale.connectionInfo);
    return { success: res.success, weight: res.weight, raw: res.raw, error: res.error };
  }
}



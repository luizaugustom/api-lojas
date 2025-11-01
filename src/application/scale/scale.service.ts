import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ScaleDriverService } from '../../shared/services/scale-driver.service';

@Injectable()
export class ScaleService {
  private readonly logger = new Logger(ScaleService.name);
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

  async detectAvailable() {
    return await this.driver.detectSystemScales();
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



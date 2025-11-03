import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PrinterDriverService, SystemPrinter } from '../../shared/services/printer-driver.service';
import { ThermalPrinterService } from '../../shared/services/thermal-printer.service';
import * as QRCode from 'qrcode';
// import { Cron, CronExpression } from '@nestjs/schedule'; // Mantido comentado - Cron de verificação automática desabilitado

export interface PrinterConfig {
  type: 'usb' | 'network' | 'bluetooth';
  connectionInfo: string;
  name: string;
}

export interface ReceiptData {
  company: {
    name: string;
    cnpj: string;
    address?: string;
  };
  sale: {
    id: string;
    date: Date;
    total: number;
    paymentMethods: string[];
    change: number;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  seller: {
    name: string;
  };
  client?: {
    name?: string;
    cpfCnpj?: string;
  };
}

export interface NFCePrintData {
  company: {
    name: string;
    cnpj: string;
    address?: string;
    phone?: string;
    email?: string;
    inscricaoEstadual?: string;
  };
  fiscal: {
    documentNumber: string;
    accessKey: string;
    emissionDate: Date;
    status: string;
    protocol?: string;
    qrCodeUrl?: string;
    serieNumber?: string;
    isMock?: boolean;
  };
  sale: {
    id: string;
    total: number;
    clientName?: string;
    clientCpfCnpj?: string;
    paymentMethod: string[];
    change: number;
    saleDate: Date;
    sellerName: string;
    totalTaxes?: number;
  };
  items: Array<{
    productName: string;
    barcode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    ncm?: string;
    cfop?: string;
  }>;
  customFooter?: string;
}

export interface CashClosureReportData {
  company: {
    name: string;
    cnpj: string;
  };
  closure: {
    openingDate: Date;
    closingDate: Date;
    openingAmount: number;
    closingAmount: number;
    totalSales: number;
    totalWithdrawals: number;
  };
  sales: Array<{
    id: string;
    date: Date;
    total: number;
    seller: string;
    paymentMethods: string[];
  }>;
}

export interface PrintResult {
  success: boolean;
  error?: string;
  details?: {
    printerName?: string;
    printerSource?: string;
    status?: string;
    reason?: string;
  };
}

@Injectable()
export class PrinterService {
  private readonly logger = new Logger(PrinterService.name);
  private readonly printerTimeout: number;
  private readonly printerRetryAttempts: number;
  private lastPrinterCheck: Date | null = null;
  private availablePrinters: SystemPrinter[] = [];
  // Armazena dispositivos por computador (sem mexer no DB)
  private clientDevices = new Map<string, { printers: SystemPrinter[]; lastUpdate: Date }>();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly driverService: PrinterDriverService,
    private readonly thermalPrinter: ThermalPrinterService,
  ) {
    this.printerTimeout = this.configService.get('PRINTER_TIMEOUT', 5000);
    this.printerRetryAttempts = this.configService.get('PRINTER_RETRY_ATTEMPTS', 3);
    
    // Inicia verificação de impressoras
    this.initializePrinters();
  }

  /**
   * Inicializa e detecta impressoras ao iniciar o serviço
   */
  private async initializePrinters() {
    try {
      this.logger.log('Inicializando sistema de impressão...');
      
      // Detecta impressoras do sistema
      this.availablePrinters = await this.driverService.detectSystemPrinters();
      this.lastPrinterCheck = new Date();
      
      this.logger.log(`${this.availablePrinters.length} impressora(s) detectada(s)`);
      
      // Verifica drivers
      const drivers = await this.driverService.checkThermalPrinterDrivers();
      const installedDrivers = drivers.filter(d => d.installed);
      this.logger.log(`${installedDrivers.length} driver(s) de impressora térmica instalado(s)`);
      
      // Sincroniza com banco de dados
      await this.syncPrintersWithDatabase();
      
    } catch (error) {
      this.logger.error('Erro ao inicializar impressoras:', error);
    }
  }

  /**
   * Sincroniza impressoras detectadas com o banco de dados
   */
  private async syncPrintersWithDatabase() {
    try {
      for (const sysPrinter of this.availablePrinters) {
        // Verifica se já existe no banco
        const existing = await this.prisma.printer.findFirst({
          where: {
            name: sysPrinter.name,
          },
        });

        if (!existing) {
          this.logger.log(`Nova impressora detectada: ${sysPrinter.name}`);
        } else {
          // Atualiza status
          await this.prisma.printer.update({
            where: { id: existing.id },
            data: {
              isConnected: sysPrinter.status === 'online',
              paperStatus: sysPrinter.status === 'paper-empty' ? 'EMPTY' : 'OK',
              lastStatusCheck: new Date(),
            },
          });
        }
      }
    } catch (error) {
      this.logger.error('Erro ao sincronizar impressoras:', error);
    }
  }

  /**
   * Verifica impressoras periodicamente (DESABILITADO - agora verifica apenas no login ou manualmente)
   * @deprecated - Removida verificação automática. Use checkPrintersStatus() manualmente quando necessário.
   */
  // @Cron(CronExpression.EVERY_30_SECONDS) // DESABILITADO - verificação agora é manual
  async checkPrintersStatus() {
    try {
      this.logger.debug('Verificando status das impressoras...');
      
      // Redetecta impressoras
      this.availablePrinters = await this.driverService.detectSystemPrinters();
      this.lastPrinterCheck = new Date();
      
      // Atualiza status no banco
      const dbPrinters = await this.prisma.printer.findMany();
      
      for (const dbPrinter of dbPrinters) {
        const sysPrinter = this.availablePrinters.find(p => p.name === dbPrinter.name);
        
        if (sysPrinter) {
          // Verifica status detalhado
          const status = await this.thermalPrinter.checkPrinterStatus(dbPrinter.name);
          
          await this.prisma.printer.update({
            where: { id: dbPrinter.id },
            data: {
              isConnected: status.online,
              paperStatus: status.paperOk ? 'OK' : status.error ? 'ERROR' : 'LOW',
              lastStatusCheck: new Date(),
            },
          });
        } else {
          // Impressora não encontrada
          await this.prisma.printer.update({
            where: { id: dbPrinter.id },
            data: {
              isConnected: false,
              paperStatus: 'ERROR',
              lastStatusCheck: new Date(),
            },
          });
        }
      }
      
      this.logger.debug('Verificação de impressoras concluída');
    } catch (error) {
      this.logger.error('Erro ao verificar status das impressoras:', error);
    }
  }

  async discoverPrinters(): Promise<PrinterConfig[]> {
    try {
      this.logger.log('Descobrindo impressoras no sistema...');
      
      // Detecta impressoras reais do sistema
      const systemPrinters = await this.driverService.detectSystemPrinters();
      this.availablePrinters = systemPrinters;
      this.lastPrinterCheck = new Date();
      
      // Converte para formato PrinterConfig
      const printers: PrinterConfig[] = systemPrinters.map(sp => ({
        name: sp.name,
        type: sp.connection as 'usb' | 'network' | 'bluetooth',
        connectionInfo: sp.port,
      }));

      this.logger.log(`${printers.length} impressora(s) descoberta(s)`);
      
      return printers;
    } catch (error) {
      this.logger.error('Erro ao descobrir impressoras:', error);
      return [];
    }
  }

  /**
   * Obtém impressoras disponíveis no sistema
   * Se computerId for fornecido, retorna dispositivos do computador do cliente
   * Se companyId for fornecido, também retorna impressoras do banco de dados da empresa
   */
  async getAvailablePrinters(computerId?: string | null, companyId?: string): Promise<SystemPrinter[]> {
    const printers: SystemPrinter[] = [];
    
    // Se há um computerId, retorna dispositivos do cliente (em memória)
    if (computerId) {
      const clientData = this.clientDevices.get(computerId);
      if (clientData && clientData.printers.length > 0) {
        this.logger.log(`Retornando ${clientData.printers.length} impressora(s) do computador ${computerId}`);
        printers.push(...clientData.printers);
      }
    }
    
    // Se há companyId, também busca impressoras do banco de dados
    if (companyId) {
      try {
        const dbPrinters = await this.prisma.printer.findMany({
          where: { companyId },
          select: {
            name: true,
            type: true,
            connectionInfo: true,
            isConnected: true,
          },
        });
        
        // Converte impressoras do banco para formato SystemPrinter
        const dbSystemPrinters: SystemPrinter[] = dbPrinters.map(p => ({
          name: p.name,
          driver: 'Database',
          port: p.connectionInfo || 'Unknown',
          status: p.isConnected ? 'online' : 'offline',
          isDefault: false,
          connection: (p.type || 'usb') as 'usb' | 'network' | 'bluetooth',
        }));
        
        // Adiciona apenas impressoras que não estão já na lista (evita duplicatas)
        for (const dbPrinter of dbSystemPrinters) {
          if (!printers.find(p => p.name === dbPrinter.name)) {
            printers.push(dbPrinter);
          }
        }
        
        this.logger.log(`Adicionadas ${dbSystemPrinters.length} impressora(s) do banco de dados para empresa ${companyId}`);
      } catch (error) {
        this.logger.warn('Erro ao buscar impressoras do banco:', error);
      }
    }
    
    // Se não encontrou nenhuma impressora e não há computerId/companyId, detecta no servidor
    if (printers.length === 0 && !computerId && !companyId) {
      if (!this.lastPrinterCheck || 
          (new Date().getTime() - this.lastPrinterCheck.getTime()) > 60000) {
        this.availablePrinters = await this.driverService.detectSystemPrinters();
        this.lastPrinterCheck = new Date();
      }
      return this.availablePrinters;
    }
    
    // Se não encontrou nenhuma impressora e há computerId, avisa
    if (printers.length === 0 && computerId) {
      this.logger.warn(`Nenhum dispositivo encontrado para o computador ${computerId}`);
    }
    
    return printers;
  }

  /**
   * Registra dispositivos detectados do computador do cliente
   * Se companyId for fornecido, salva as impressoras no banco de dados
   */
  async registerClientDevices(
    computerId: string, 
    printers: any[], 
    companyId?: string
  ): Promise<{ success: boolean; message: string; printersCreated?: number }> {
    try {
      // Converte para formato SystemPrinter
      const systemPrinters: SystemPrinter[] = printers.map((p: any) => ({
        name: p.name || p.Name || 'Impressora Desconhecida',
        driver: p.driver || p.DriverName || 'Unknown',
        port: p.port || p.PortName || p.connectionInfo || 'Unknown',
        status: p.status === 'online' || p.PrinterStatus === 0 ? 'online' : 'offline',
        isDefault: p.isDefault || false,
        connection: (p.connection || p.type || 'usb') as 'usb' | 'network' | 'bluetooth',
      }));

      // Armazena em memória associado ao computerId
      this.clientDevices.set(computerId, {
        printers: systemPrinters,
        lastUpdate: new Date(),
      });

      let printersCreated = 0;

      // Se companyId foi fornecido, salva as impressoras no banco de dados
      if (companyId) {
        for (const printer of systemPrinters) {
          try {
            // Verifica se já existe uma impressora com esse nome para essa empresa
            const existing = await this.prisma.printer.findFirst({
              where: {
                name: printer.name,
                companyId,
              },
            });

            if (!existing) {
              // Cria nova impressora no banco
              await this.prisma.printer.create({
                data: {
                  name: printer.name,
                  type: printer.connection,
                  connectionInfo: printer.port,
                  companyId,
                  isConnected: printer.status === 'online',
                  paperStatus: printer.status === 'online' ? 'OK' : 'ERROR',
                },
              });
              printersCreated++;
              this.logger.log(`Impressora "${printer.name}" salva no banco de dados para empresa ${companyId}`);
            } else {
              // Atualiza status da impressora existente
              await this.prisma.printer.update({
                where: { id: existing.id },
                data: {
                  isConnected: printer.status === 'online',
                  paperStatus: printer.status === 'online' ? 'OK' : 'ERROR',
                  lastStatusCheck: new Date(),
                  connectionInfo: printer.port, // Atualiza porta se mudou
                },
              });
              this.logger.log(`Status da impressora "${printer.name}" atualizado no banco`);
            }
          } catch (dbError) {
            this.logger.warn(`Erro ao salvar impressora "${printer.name}" no banco:`, dbError);
            // Continua processando outras impressoras mesmo se uma falhar
          }
        }
      }

      this.logger.log(`Dispositivos registrados para computador ${computerId}: ${systemPrinters.length} impressora(s)${companyId ? `, ${printersCreated} nova(s) salva(s) no banco` : ''}`);
      
      return {
        success: true,
        message: `${systemPrinters.length} impressora(s) registrada(s)${companyId ? `. ${printersCreated} nova(s) salva(s) no banco de dados` : ' em memória'}`,
        printersCreated,
      };
    } catch (error) {
      this.logger.error('Erro ao registrar dispositivos do cliente:', error);
      return {
        success: false,
        message: 'Erro ao registrar dispositivos',
      };
    }
  }

  /**
   * Verifica drivers instalados
   */
  async checkDrivers(): Promise<{
    allInstalled: boolean;
    drivers: any[];
    message: string;
  }> {
    try {
      this.logger.log('Verificando drivers de impressora...');
      
      // Verifica drivers atuais
      const drivers = await this.driverService.checkThermalPrinterDrivers();
      const missingDrivers = drivers.filter(d => !d.installed);
      
      if (missingDrivers.length === 0) {
        return {
          allInstalled: true,
          drivers,
          message: 'Todos os drivers necessários estão instalados',
        };
      }
      
      return {
        allInstalled: false,
        drivers,
        message: `${missingDrivers.length} driver(s) faltando`,
      };
    } catch (error) {
      this.logger.error('Erro ao verificar drivers:', error);
      return {
        allInstalled: false,
        drivers: [],
        message: 'Erro ao verificar drivers',
      };
    }
  }

  /**
   * Instala drivers automaticamente
   */
  async installDrivers(): Promise<{
    success: boolean;
    message: string;
    errors: string[];
  }> {
    try {
      this.logger.log('Instalando drivers de impressora...');
      
      // Tenta instalar drivers
      const installResult = await this.driverService.installThermalPrinterDrivers();
      
      return {
        success: installResult.success,
        message: installResult.message,
        errors: installResult.errors,
      };
    } catch (error) {
      this.logger.error('Erro ao instalar drivers:', error);
      return {
        success: false,
        message: 'Erro ao instalar drivers',
        errors: [error.message],
      };
    }
  }

  /**
   * Verifica e instala drivers se necessário (DEPRECATED - usar checkDrivers e installDrivers)
   */
  async checkAndInstallDrivers(): Promise<{
    driversInstalled: boolean;
    message: string;
    errors: string[];
  }> {
    try {
      this.logger.log('Verificando drivers de impressora...');
      
      // Verifica drivers atuais
      const drivers = await this.driverService.checkThermalPrinterDrivers();
      const missingDrivers = drivers.filter(d => !d.installed);
      
      if (missingDrivers.length === 0) {
        return {
          driversInstalled: true,
          message: 'Todos os drivers necessários estão instalados',
          errors: [],
        };
      }
      
      this.logger.log(`${missingDrivers.length} driver(s) faltando. Tentando instalar...`);
      
      // Tenta instalar drivers
      const installResult = await this.driverService.installThermalPrinterDrivers();
      
      return {
        driversInstalled: installResult.success,
        message: installResult.message,
        errors: installResult.errors,
      };
    } catch (error) {
      this.logger.error('Erro ao verificar/instalar drivers:', error);
      return {
        driversInstalled: false,
        message: 'Erro ao verificar drivers',
        errors: [error.message],
      };
    }
  }

  async addPrinter(companyId: string, printerConfig: PrinterConfig) {
    try {
      const printer = await this.prisma.printer.create({
        data: {
          name: printerConfig.name,
          type: printerConfig.type,
          connectionInfo: printerConfig.connectionInfo,
          companyId,
        },
      });

      this.logger.log(`Printer added: ${printer.id} for company: ${companyId}`);
      return printer;
    } catch (error) {
      this.logger.error('Error adding printer:', error);
      throw error;
    }
  }

  async getPrinters(companyId?: string) {
    const where = companyId ? { companyId } : {};
    
    return this.prisma.printer.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deletePrinter(user: any, id: string) {
    // Admin pode excluir qualquer impressora; empresa só as suas
    const printer = await this.prisma.printer.findUnique({ where: { id } });
    if (!printer) {
      throw new BadRequestException('Impressora não encontrada');
    }
    if (user.role !== 'ADMIN' && printer.companyId !== user.companyId) {
      throw new BadRequestException('Sem permissão para excluir esta impressora');
    }

    const deleted = await this.prisma.printer.delete({ where: { id } });
    this.logger.log(`Printer deleted: ${id} by user: ${user.id}`);
    return deleted;
  }

  async updatePrinterStatus(id: string, status: { isConnected: boolean; paperStatus: string }) {
    return this.prisma.printer.update({
      where: { id },
      data: {
        isConnected: status.isConnected,
        paperStatus: status.paperStatus,
        lastStatusCheck: new Date(),
      },
    });
  }

  async printReceipt(receiptData: ReceiptData, companyId?: string): Promise<PrintResult> {
    try {
      const receipt = this.generateReceiptContent(receiptData);
      const result = await this.sendToPrinter(receipt, companyId);
      
      if (result.success) {
        this.logger.log(`Receipt printed successfully for sale: ${receiptData.sale.id}`);
      } else {
        this.logger.warn(`Receipt printing failed for sale: ${receiptData.sale.id}: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error printing receipt:', error);
      return {
        success: false,
        error: `Erro ao imprimir cupom: ${errorMessage}`,
        details: {
          reason: `Erro inesperado durante a impressão do cupom: ${errorMessage}`,
        },
      };
    }
  }

  async printCashClosureReport(reportData: CashClosureReportData, companyId?: string): Promise<PrintResult> {
    try {
      const report = this.generateCashClosureReport(reportData);
      const result = await this.sendToPrinter(report, companyId);
      
      if (result.success) {
        this.logger.log('Cash closure report printed successfully');
      } else {
        this.logger.warn(`Cash closure report printing failed: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error printing cash closure report:', error);
      return {
        success: false,
        error: `Erro ao imprimir relatório: ${errorMessage}`,
        details: {
          reason: `Erro inesperado durante a impressão do relatório de fechamento: ${errorMessage}`,
        },
      };
    }
  }

  async printNonFiscalReceipt(receiptData: ReceiptData, companyId?: string, isMocked: boolean = false): Promise<PrintResult> {
    try {
      this.logger.log(`Iniciando impressão de cupom não fiscal para venda: ${receiptData.sale.id}${isMocked ? ' (DADOS MOCKADOS)' : ''}`);
      
      const receipt = this.generateNonFiscalReceiptContent(receiptData, isMocked);
      const result = await this.sendToPrinter(receipt, companyId);
      
      if (result.success) {
        this.logger.log(`✅ Cupom não fiscal impresso com sucesso para venda: ${receiptData.sale.id}`);
      } else {
        this.logger.warn(`⚠️ Falha ao imprimir cupom não fiscal para venda: ${receiptData.sale.id}. ${result.error}`);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Erro ao imprimir cupom não fiscal para venda ${receiptData.sale.id}:`, error);
      return {
        success: false,
        error: `Erro ao imprimir cupom não fiscal: ${errorMessage}`,
        details: {
          reason: `Erro inesperado durante a impressão do cupom não fiscal: ${errorMessage}`,
        },
      };
    }
  }

  /**
   * Gera o conteúdo de NFCe sem imprimir (para impressão local no cliente)
   */
  async getNFCeContent(nfceData: NFCePrintData): Promise<string> {
    try {
      this.logger.log(`Gerando conteúdo de NFCe para venda: ${nfceData.sale.id}`);
      
      // Verificar se é mock (status MOCK ou flag isMock)
      const isMock = nfceData.fiscal.status === 'MOCK' || (nfceData.fiscal as any).isMock === true;
      
      if (isMock) {
        // Se for mock, gerar cupom não fiscal ao invés de NFCe
        this.logger.warn(`⚠️ NFCe mockada detectada. Gerando cupom não fiscal para venda: ${nfceData.sale.id}`);
        
        const receiptData: ReceiptData = {
          company: {
            name: nfceData.company.name,
            cnpj: nfceData.company.cnpj,
            address: nfceData.company.address,
          },
          sale: {
            id: nfceData.sale.id,
            date: nfceData.sale.saleDate,
            total: nfceData.sale.total,
            paymentMethods: nfceData.sale.paymentMethod,
            change: nfceData.sale.change,
          },
          items: nfceData.items.map(item => ({
            name: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
          seller: {
            name: nfceData.sale.sellerName,
          },
          client: {
            name: nfceData.sale.clientName,
            cpfCnpj: nfceData.sale.clientCpfCnpj,
          },
        };
        
        return this.generateNonFiscalReceiptContent(receiptData, true);
      }
      
      return await this.generateNFCeContent(nfceData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Erro ao gerar conteúdo de NFCe para venda ${nfceData.sale.id}:`, error);
      throw new Error(`Erro ao gerar conteúdo NFC-e: ${errorMessage}`);
    }
  }

  async printNFCe(nfceData: NFCePrintData, companyId?: string): Promise<PrintResult> {
    try {
      this.logger.log(`Iniciando impressão de NFCe para venda: ${nfceData.sale.id}`);
      
      // Verificar se é mock (status MOCK ou flag isMock)
      const isMock = nfceData.fiscal.status === 'MOCK' || (nfceData.fiscal as any).isMock === true;
      
      if (isMock) {
        // Se for mock, imprimir cupom não fiscal ao invés de NFCe
        this.logger.warn(`⚠️ NFCe mockada detectada. Imprimindo cupom não fiscal para venda: ${nfceData.sale.id}`);
        
        const receiptData: ReceiptData = {
          company: {
            name: nfceData.company.name,
            cnpj: nfceData.company.cnpj,
            address: nfceData.company.address,
          },
          sale: {
            id: nfceData.sale.id,
            date: nfceData.sale.saleDate,
            total: nfceData.sale.total,
            paymentMethods: nfceData.sale.paymentMethod,
            change: nfceData.sale.change,
          },
          items: nfceData.items.map(item => ({
            name: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
          seller: {
            name: nfceData.sale.sellerName,
          },
          client: {
            name: nfceData.sale.clientName,
            cpfCnpj: nfceData.sale.clientCpfCnpj,
          },
        };
        
        return await this.printNonFiscalReceipt(receiptData, companyId, true);
      }
      
      const nfce = await this.generateNFCeContent(nfceData);
      const result = await this.sendToPrinter(nfce, companyId);
      
      if (result.success) {
        this.logger.log(`✅ NFCe impressa com sucesso para venda: ${nfceData.sale.id}`);
      } else {
        this.logger.warn(`⚠️ Falha ao imprimir NFCe para venda: ${nfceData.sale.id}. ${result.error}`);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Erro ao imprimir NFCe para venda ${nfceData.sale.id}:`, error);
      return {
        success: false,
        error: `Erro ao imprimir NFC-e: ${errorMessage}`,
        details: {
          reason: `Erro inesperado durante a impressão da NFC-e: ${errorMessage}`,
        },
      };
    }
  }

  private generateReceiptContent(data: ReceiptData): string {
    const { company, sale, items, seller, client } = data;
    
    let receipt = '';
    
    // Header
    receipt += this.centerText(company.name) + '\n';
    receipt += this.centerText(`CNPJ: ${company.cnpj}`) + '\n';
    if (company.address) {
      receipt += this.centerText(company.address) + '\n';
    }
    receipt += this.centerText('--------------------------------') + '\n';
    receipt += this.centerText('CUPOM FISCAL') + '\n';
    receipt += this.centerText('--------------------------------') + '\n';
    
    // Sale info
    receipt += `Venda: ${sale.id}\n`;
    receipt += `Data: ${this.formatDate(sale.date)}\n`;
    receipt += `Vendedor: ${seller.name}\n`;
    
    if (client?.name) {
      receipt += `Cliente: ${client.name}\n`;
    }
    if (client?.cpfCnpj) {
      receipt += `CPF/CNPJ: ${client.cpfCnpj}\n`;
    }
    
    receipt += this.centerText('--------------------------------') + '\n';
    
    // Items
    receipt += 'ITEM DESCRIÇÃO           QTD  V.UNIT  TOTAL\n';
    receipt += '----------------------------------------\n';
    
    items.forEach((item, index) => {
      const itemNumber = (index + 1).toString().padStart(3);
      const description = item.name.substring(0, 20).padEnd(20);
      const quantity = item.quantity.toString().padStart(3);
      const unitPrice = this.formatCurrency(item.unitPrice).padStart(7);
      const total = this.formatCurrency(item.totalPrice).padStart(8);
      
      receipt += `${itemNumber} ${description} ${quantity} ${unitPrice} ${total}\n`;
    });
    
    receipt += '----------------------------------------\n';
    
    // Totals
    receipt += `TOTAL: ${this.formatCurrency(sale.total).padStart(40)}\n`;
    
    // Payment methods
    receipt += 'FORMAS DE PAGAMENTO:\n';
    sale.paymentMethods.forEach(method => {
      receipt += `- ${this.getPaymentMethodName(method)}\n`;
    });
    
    if (sale.change > 0) {
      receipt += `TROCO: ${this.formatCurrency(sale.change)}\n`;
    }
    
    receipt += this.centerText('--------------------------------') + '\n\n\n';
    
    return receipt;
  }

  private generateNonFiscalReceiptContent(data: ReceiptData, isMocked: boolean = false): string {
    const { company, sale, items, seller, client } = data;
    
    let receipt = '';
    
    // Header
    receipt += this.centerText(company.name) + '\n';
    receipt += this.centerText(`CNPJ: ${company.cnpj}`) + '\n';
    if (company.address) {
      receipt += this.centerText(company.address) + '\n';
    }
    receipt += this.centerText('================================') + '\n';
    
    // Aviso importante quando mockado
    if (isMocked) {
      receipt += this.centerText('⚠️ AVISO IMPORTANTE ⚠️') + '\n';
      receipt += this.centerText('================================') + '\n';
      receipt += this.wrapText('EMPRESA NÃO POSSUI CONFIGURAÇÃO FISCAL COMPLETA PARA EMISSÃO DE NFCe', 32);
      receipt += this.wrapText('Este é um CUPOM NÃO FISCAL', 32);
      receipt += this.wrapText('Configure os dados fiscais nas configurações para emitir NFCe válida', 32);
      receipt += this.centerText('================================') + '\n\n';
    }
    
    receipt += this.centerText('CUPOM NÃO FISCAL') + '\n';
    receipt += this.centerText('================================') + '\n';
    
    // Sale info
    receipt += `Venda: ${sale.id}\n`;
    receipt += `Data: ${this.formatDate(sale.date)}\n`;
    receipt += `Vendedor: ${seller.name}\n`;
    
    if (client?.name) {
      receipt += `Cliente: ${client.name}\n`;
    }
    if (client?.cpfCnpj) {
      receipt += `CPF/CNPJ: ${client.cpfCnpj}\n`;
    }
    
    receipt += this.centerText('================================') + '\n';
    
    // Items
    receipt += 'ITEM DESCRIÇÃO           QTD  V.UNIT  TOTAL\n';
    receipt += '----------------------------------------\n';
    
    items.forEach((item, index) => {
      const itemNumber = (index + 1).toString().padStart(3);
      const description = item.name.substring(0, 20).padEnd(20);
      const quantity = item.quantity.toString().padStart(3);
      const unitPrice = this.formatCurrency(item.unitPrice).padStart(7);
      const total = this.formatCurrency(item.totalPrice).padStart(8);
      
      receipt += `${itemNumber} ${description} ${quantity} ${unitPrice} ${total}\n`;
    });
    
    receipt += '----------------------------------------\n';
    
    // Totals
    receipt += `TOTAL: ${this.formatCurrency(sale.total).padStart(40)}\n`;
    
    // Payment methods
    receipt += 'FORMAS DE PAGAMENTO:\n';
    sale.paymentMethods.forEach(method => {
      receipt += `- ${this.getPaymentMethodName(method)}\n`;
    });
    
    if (sale.change > 0) {
      receipt += `TROCO: ${this.formatCurrency(sale.change)}\n`;
    }
    
    receipt += this.centerText('================================') + '\n';
    
    if (isMocked) {
      receipt += this.wrapText('NÃO É DOCUMENTO FISCAL', 32);
      receipt += this.wrapText('Configure dados fiscais para emissão de NFCe', 32);
      receipt += this.centerText('================================') + '\n';
    }
    
    receipt += this.centerText('OBRIGADO PELA PREFERÊNCIA!') + '\n';
    receipt += this.centerText('VOLTE SEMPRE!') + '\n';
    receipt += this.centerText('================================') + '\n';
    receipt += this.centerText('🚀SISTEMA MONTSHOP! 🚀') + '\n';
    receipt += '\n\n\n';
    
    return receipt;
  }

  private generateCashClosureReport(data: CashClosureReportData): string {
    const { company, closure, sales } = data;
    
    let report = '';
    
    // Header
    report += this.centerText(company.name) + '\n';
    report += this.centerText(`CNPJ: ${company.cnpj}`) + '\n';
    report += this.centerText('--------------------------------') + '\n';
    report += this.centerText('RELATÓRIO DE FECHAMENTO') + '\n';
    report += this.centerText('--------------------------------') + '\n';
    
    // Closure info
    report += `Abertura: ${this.formatDate(closure.openingDate)}\n`;
    report += `Fechamento: ${this.formatDate(closure.closingDate)}\n`;
    report += `Valor inicial: ${this.formatCurrency(closure.openingAmount)}\n`;
    report += `Valor final: ${this.formatCurrency(closure.closingAmount)}\n`;
    report += `Total vendas: ${this.formatCurrency(closure.totalSales)}\n`;
    report += `Total saques: ${this.formatCurrency(closure.totalWithdrawals)}\n`;
    
    report += this.centerText('--------------------------------') + '\n';
    
    // Sales summary
    report += `Total de vendas: ${sales.length}\n`;
    
    // Payment methods summary
    const paymentSummary = sales.reduce((acc, sale) => {
      sale.paymentMethods.forEach(method => {
        acc[method] = (acc[method] || 0) + sale.total;
      });
      return acc;
    }, {});
    
    report += '\nRESUMO POR FORMA DE PAGAMENTO:\n';
    Object.entries(paymentSummary).forEach(([method, total]) => {
      report += `${this.getPaymentMethodName(method)}: ${this.formatCurrency(total as number)}\n`;
    });
    
    // Sellers summary
    const sellerSummary = sales.reduce((acc, sale) => {
      acc[sale.seller] = (acc[sale.seller] || 0) + sale.total;
      return acc;
    }, {});
    
    report += '\nRESUMO POR VENDEDOR:\n';
    Object.entries(sellerSummary).forEach(([seller, total]) => {
      report += `${seller}: ${this.formatCurrency(total as number)}\n`;
    });
    
    report += this.centerText('--------------------------------') + '\n';
    report += this.centerText('RELATÓRIO GERADO EM:') + '\n';
    report += this.centerText(this.formatDate(new Date())) + '\n';
    report += this.centerText('--------------------------------') + '\n\n\n';
    
    return report;
  }

  private async generateNFCeContent(data: NFCePrintData): Promise<string> {
    const { company, fiscal, sale, items, customFooter } = data;
    
    let nfce = '';
    
    // ===== CABEÇALHO (Dados do Emitente) =====
    nfce += this.centerText(company.name.toUpperCase()) + '\n';
    nfce += this.centerText(`CNPJ: ${this.formatCnpj(company.cnpj)}`) + '\n';
    if (company.inscricaoEstadual) {
      nfce += this.centerText(`IE: ${company.inscricaoEstadual}`) + '\n';
    }
    if (company.address) {
      nfce += this.centerText(company.address) + '\n';
    }
    if (company.phone) {
      nfce += this.centerText(`Tel: ${company.phone}`) + '\n';
    }
    if (company.email) {
      nfce += this.centerText(`Email: ${company.email}`) + '\n';
    }
    nfce += this.centerText('================================') + '\n';
    
    // ===== IDENTIFICAÇÃO DO DOCUMENTO =====
    nfce += this.centerText('DOCUMENTO AUXILIAR DA NOTA') + '\n';
    nfce += this.centerText('FISCAL DE CONSUMIDOR ELETRONICA') + '\n';
    nfce += this.centerText('NFC-e') + '\n';
    nfce += this.centerText('================================') + '\n';
    nfce += this.centerText('NÃO PERMITE APROVEITAMENTO') + '\n';
    nfce += this.centerText('DE CRÉDITO FISCAL DE ICMS') + '\n';
    nfce += this.centerText('================================') + '\n\n';
    
    // ===== DADOS DA NFC-e =====
    nfce += `Nº: ${fiscal.documentNumber}`;
    if (fiscal.serieNumber) {
      nfce += ` Série: ${fiscal.serieNumber}`;
    }
    nfce += '\n';
    nfce += `Emissão: ${this.formatDate(fiscal.emissionDate)}\n`;
    
    // ===== CHAVE DE ACESSO =====
    nfce += '\n';
    nfce += this.centerText('CHAVE DE ACESSO') + '\n';
    nfce += this.formatAccessKey(fiscal.accessKey) + '\n';
    nfce += '\n';
    
    // ===== CONSULTA VIA LEITOR DE QR CODE =====
    if (fiscal.qrCodeUrl) {
      nfce += this.centerText('CONSULTE PELA CHAVE DE ACESSO EM') + '\n';
      nfce += this.centerText('www.nfce.fazenda.gov.br/consultanfce') + '\n';
      nfce += this.centerText('OU UTILIZE O QR CODE ABAIXO:') + '\n';
      nfce += '\n';
      
      // Gerar QR Code ASCII
      try {
        const qrCodeAscii = await this.generateQRCodeAscii(fiscal.qrCodeUrl);
        nfce += qrCodeAscii + '\n';
      } catch (error) {
        this.logger.warn('Erro ao gerar QR Code, usando placeholder:', error);
        nfce += this.centerText('[QR CODE]') + '\n';
        nfce += this.centerText(fiscal.qrCodeUrl.substring(0, 32)) + '\n';
      }
      nfce += '\n';
    }
    
    // ===== DADOS DO CONSUMIDOR =====
    if (sale.clientName || sale.clientCpfCnpj) {
      nfce += this.centerText('================================') + '\n';
      nfce += this.centerText('CONSUMIDOR') + '\n';
      nfce += this.centerText('================================') + '\n';
      if (sale.clientName) {
        nfce += `Nome: ${sale.clientName}\n`;
      }
      if (sale.clientCpfCnpj) {
        nfce += `CPF/CNPJ: ${this.formatCpfCnpj(sale.clientCpfCnpj)}\n`;
      }
    }
    
    // ===== PRODUTOS E SERVIÇOS =====
    nfce += '\n';
    nfce += this.centerText('================================') + '\n';
    nfce += this.centerText('PRODUTOS/SERVIÇOS') + '\n';
    nfce += this.centerText('================================') + '\n';
    nfce += 'COD  DESCRICAO         QTD  VL.UNIT  VL.TOTAL\n';
    nfce += '----------------------------------------\n';
    
    items.forEach((item, index) => {
      const itemNumber = (index + 1).toString().padStart(3);
      const description = item.productName.substring(0, 17).padEnd(17);
      const quantity = item.quantity.toString().padStart(3);
      const unitPrice = this.formatCurrency(item.unitPrice).padStart(8);
      const totalPrice = this.formatCurrency(item.totalPrice).padStart(9);
      
      nfce += `${itemNumber}  ${description}${quantity} ${unitPrice} ${totalPrice}\n`;
      
      // Código de barras (EAN/GTIN)
      if (item.barcode) {
        nfce += `     EAN: ${item.barcode}`;
        if (item.ncm) {
          nfce += ` NCM: ${item.ncm}`;
        }
        nfce += '\n';
      }
      
      // CFOP se disponível
      if (item.cfop) {
        nfce += `     CFOP: ${item.cfop}\n`;
      }
    });
    
    // ===== TOTAIS =====
    nfce += '----------------------------------------\n';
    nfce += `Qtd. Total de Itens: ${items.length}\n`;
    nfce += '\n';
    nfce += `VALOR TOTAL: ${this.formatCurrency(sale.total).padStart(30)}\n`;
    
    // ===== FORMA DE PAGAMENTO =====
    nfce += '\n';
    nfce += this.centerText('================================') + '\n';
    nfce += this.centerText('FORMA DE PAGAMENTO') + '\n';
    nfce += this.centerText('================================') + '\n';
    sale.paymentMethod.forEach(method => {
      nfce += `${this.getPaymentMethodName(method)}\n`;
    });
    
    if (sale.change > 0) {
      nfce += '\n';
      nfce += `Valor Recebido: ${this.formatCurrency(sale.total + sale.change).padStart(22)}\n`;
      nfce += `Troco: ${this.formatCurrency(sale.change).padStart(33)}\n`;
    }
    
    // ===== INFORMAÇÕES DE TRIBUTOS (Lei da Transparência 12.741/2012) =====
    nfce += '\n';
    nfce += this.centerText('================================') + '\n';
    nfce += this.centerText('INFORMAÇÃO DOS TRIBUTOS') + '\n';
    nfce += this.centerText('================================') + '\n';
    
    const estimatedTaxes = sale.totalTaxes || (sale.total * 0.1665); // Estimativa de ~16.65%
    nfce += `Valor Aproximado dos Tributos:\n`;
    nfce += `${this.formatCurrency(estimatedTaxes).padStart(40)}\n`;
    nfce += `(${((estimatedTaxes / sale.total) * 100).toFixed(2)}% do valor)\n`;
    nfce += '\n';
    nfce += 'Fonte: IBPT - Instituto Brasileiro de\n';
    nfce += 'Planejamento e Tributação\n';
    nfce += 'Lei 12.741/2012 - Lei da Transparência\n';
    
    // ===== PROTOCOLO DE AUTORIZAÇÃO =====
    nfce += '\n';
    nfce += this.centerText('================================') + '\n';
    if (fiscal.protocol) {
      nfce += this.centerText('NFC-e AUTORIZADA') + '\n';
      nfce += `Protocolo: ${fiscal.protocol}\n`;
      nfce += `Data Autorização: ${this.formatDate(fiscal.emissionDate)}\n`;
    } else {
      nfce += this.centerText(`STATUS: ${fiscal.status}`) + '\n';
    }
    nfce += this.centerText('================================') + '\n';
    
    // ===== INFORMAÇÕES COMPLEMENTARES =====
    nfce += '\n';
    if (customFooter) {
      nfce += this.centerText('--------------------------------') + '\n';
      nfce += this.wrapText(customFooter, 32);
      nfce += this.centerText('--------------------------------') + '\n';
    }
    
    // ===== DADOS DO VENDEDOR =====
    nfce += '\n';
    nfce += `Vendedor: ${sale.sellerName}\n`;
    nfce += `ID Venda: ${sale.id}\n`;
    
    // ===== RODAPÉ =====
    nfce += '\n';
    nfce += this.centerText('================================') + '\n';
    nfce += this.centerText('OBRIGADO PELA PREFERÊNCIA!') + '\n';
    nfce += this.centerText('VOLTE SEMPRE!') + '\n';
    nfce += this.centerText('================================') + '\n';
    nfce += this.centerText('🚀SISTEMA MONTSHOP! 🚀') + '\n';
    nfce += this.centerText(this.formatDate(new Date())) + '\n';
    nfce += '\n\n\n';
    
    return nfce;
  }

  /**
   * Envia conteúdo para impressão real
   */
  private async sendToPrinter(content: string, companyId?: string): Promise<PrintResult> {
    try {
      // Obtém impressora padrão da empresa ou do sistema
      let printerName: string | null = null;
      let printerSource = 'não encontrada';
      
      if (companyId) {
        const dbPrinter = await this.prisma.printer.findFirst({
          where: {
            companyId,
            isConnected: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        
        if (dbPrinter) {
          printerName = dbPrinter.name;
          printerSource = 'banco de dados (empresa)';
          this.logger.log(`Impressora encontrada no banco: ${printerName}`);
        }
      }
      
      // Se não encontrou impressora cadastrada, usa a padrão do sistema
      if (!printerName) {
        this.logger.log('Buscando impressora padrão do sistema...');
        // Busca impressoras disponíveis considerando companyId se disponível
        const systemPrinters = await this.getAvailablePrinters(null, companyId);
        
        if (systemPrinters.length === 0) {
          this.logger.warn('⚠️ Nenhuma impressora detectada no sistema');
          return {
            success: false,
            error: 'Nenhuma impressora detectada no sistema',
            details: {
              reason: 'Nenhuma impressora foi encontrada no sistema operacional. Verifique se a impressora está conectada e instalada corretamente.',
            },
          };
        }
        
        // Prioriza impressora padrão online, depois qualquer impressora online
        const defaultPrinter = systemPrinters.find(p => p.isDefault && p.status === 'online');
        const anyOnlinePrinter = systemPrinters.find(p => p.status === 'online');
        
        if (defaultPrinter) {
          printerName = defaultPrinter.name;
          printerSource = 'impressora padrão do sistema';
        } else if (anyOnlinePrinter) {
          printerName = anyOnlinePrinter.name;
          printerSource = 'primeira impressora online';
        }
      }
      
      if (!printerName) {
        this.logger.error('❌ Nenhuma impressora disponível para impressão');
        this.logger.warn('💡 Dica: Cadastre uma impressora em Impressoras ou conecte uma impressora ao sistema');
        return {
          success: false,
          error: 'Nenhuma impressora disponível',
          details: {
            reason: 'Nenhuma impressora online foi encontrada. Verifique se existe uma impressora cadastrada no sistema ou conecte uma impressora ao computador.',
          },
        };
      }
      
      this.logger.log(`📄 Enviando para impressora: ${printerName} (${printerSource})`);
      
      // Verifica status antes de imprimir
      const status = await this.thermalPrinter.checkPrinterStatus(printerName);
      
      if (!status.online) {
        const errorMessage = status.message || 'Status desconhecido';
        this.logger.warn(`⚠️ Impressora ${printerName} está offline: ${errorMessage}`);
        return {
          success: false,
          error: `Impressora "${printerName}" está offline`,
          details: {
            printerName,
            printerSource,
            status: 'offline',
            reason: `A impressora "${printerName}" não está disponível. Verifique se ela está ligada, conectada ao computador e configurada corretamente. Erro: ${errorMessage}`,
          },
        };
      }
      
      if (!status.paperOk && status.error) {
        this.logger.warn(`⚠️ Problema com papel na impressora ${printerName}`);
        return {
          success: false,
          error: `Problema detectado na impressora "${printerName}"`,
          details: {
            printerName,
            printerSource,
            status: 'paper-error',
            reason: `A impressora "${printerName}" está reportando problemas com papel ou erro de hardware. Verifique se há papel suficiente e se a impressora não está com tampa aberta ou outro erro.`,
          },
        };
      }
      
      // Envia para impressão real
      this.logger.log('🖨️ Enviando comando de impressão...');
      const success = await this.thermalPrinter.print(printerName, content, true);
      
      if (success) {
        this.logger.log('✅ Impressão enviada com sucesso!');
        
        // Atualiza último uso da impressora
        if (companyId) {
          await this.prisma.printer.updateMany({
            where: { name: printerName, companyId },
            data: { lastStatusCheck: new Date() },
          }).catch(err => this.logger.warn('Erro ao atualizar timestamp:', err));
        }
        
        return {
          success: true,
          details: {
            printerName,
            printerSource,
            status: 'printed',
          },
        };
      } else {
        this.logger.error('❌ Falha ao enviar impressão');
        return {
          success: false,
          error: `Falha ao enviar comando de impressão para "${printerName}"`,
          details: {
            printerName,
            printerSource,
            status: 'print-failed',
            reason: `O comando de impressão falhou. Pode ser um problema de driver, permissões ou comunicação com a impressora "${printerName}". Verifique se o driver da impressora está instalado corretamente.`,
          },
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('❌ Erro ao enviar para impressora:', error);
      this.logger.error('Stack:', error instanceof Error ? error.stack : '');
      
      return {
        success: false,
        error: `Erro inesperado ao imprimir: ${errorMessage}`,
        details: {
          reason: `Ocorreu um erro inesperado durante a impressão: ${errorMessage}. Verifique os logs do sistema para mais detalhes.`,
        },
      };
    }
  }

  private centerText(text: string, width = 32): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  private formatDate(date: Date): string {
    return date.toLocaleString('pt-BR');
  }

  private formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  private getPaymentMethodName(method: string): string {
    const methods = {
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'cash': 'Dinheiro',
      'pix': 'PIX',
      'installment': 'A Prazo',
    };
    
    return methods[method] || method;
  }

  private formatCnpj(cnpj: string): string {
    // Remove caracteres não numéricos
    const numbers = cnpj.replace(/\D/g, '');
    
    // Se já está formatado, retorna
    if (cnpj.includes('.') || cnpj.includes('/')) {
      return cnpj;
    }
    
    // Formata: XX.XXX.XXX/XXXX-XX
    if (numbers.length === 14) {
      return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    
    return cnpj;
  }

  private formatCpfCnpj(value: string): string {
    const numbers = value.replace(/\D/g, '');
    
    // Se já está formatado, retorna
    if (value.includes('.') || value.includes('/') || value.includes('-')) {
      return value;
    }
    
    // CPF: XXX.XXX.XXX-XX
    if (numbers.length === 11) {
      return numbers.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
    
    // CNPJ: XX.XXX.XXX/XXXX-XX
    if (numbers.length === 14) {
      return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    
    return value;
  }

  private formatAccessKey(key: string): string {
    // Formata chave de acesso em blocos de 4 dígitos
    const numbers = key.replace(/\D/g, '');
    const chunks = numbers.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  }

  private wrapText(text: string, width: number = 32): string {
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(this.centerText(currentLine, width));
        currentLine = word;
      }
    });

    if (currentLine) {
      lines.push(this.centerText(currentLine, width));
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Gera QR Code em formato ASCII para impressão térmica
   */
  private async generateQRCodeAscii(url: string): Promise<string> {
    try {
      // Gerar QR Code em formato de terminal (ASCII)
      const qrAscii = await QRCode.toString(url, {
        type: 'terminal',
        small: true,
        errorCorrectionLevel: 'M',
      });

      // Centralizar cada linha do QR Code
      const lines = qrAscii.split('\n');
      const centeredLines = lines.map(line => this.centerText(line, 32));
      
      return centeredLines.join('\n');
    } catch (error) {
      this.logger.error('Erro ao gerar QR Code ASCII:', error);
      throw error;
    }
  }

  async testPrinter(id: string): Promise<PrintResult> {
    try {
      const printer = await this.prisma.printer.findUnique({
        where: { id },
      });

      if (!printer) {
        throw new BadRequestException('Impressora não encontrada');
      }

      const testContent = this.generateTestContent();
      const result = await this.sendToPrinter(testContent, printer.companyId);
      
      if (result.success) {
        await this.updatePrinterStatus(id, {
          isConnected: true,
          paperStatus: 'OK',
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error testing printer:', error);
      return {
        success: false,
        error: `Erro ao testar impressora: ${errorMessage}`,
        details: {
          reason: `Erro ao executar teste de impressão: ${errorMessage}`,
        },
      };
    }
  }

  private generateTestContent(): string {
    let content = '';
    content += this.centerText('--------------------------------') + '\n';
    content += this.centerText('TESTE DE IMPRESSÃO') + '\n';
    content += this.centerText('--------------------------------') + '\n';
    content += 'Esta é uma impressão de teste.\n';
    content += 'Se você está lendo isso, a impressora\n';
    content += 'está funcionando corretamente.\n';
    content += this.centerText('--------------------------------') + '\n';
    content += this.centerText('TESTE CONCLUÍDO') + '\n';
    content += this.centerText('--------------------------------') + '\n\n\n';
    return content;
  }

  async getPrinterStatus(id: string) {
    const printer = await this.prisma.printer.findUnique({
      where: { id },
    });

    if (!printer) {
      throw new BadRequestException('Impressora não encontrada');
    }

    return {
      id: printer.id,
      name: printer.name,
      type: printer.type,
      isConnected: printer.isConnected,
      paperStatus: printer.paperStatus,
      lastStatusCheck: printer.lastStatusCheck,
    };
  }

  async updateCustomFooter(companyId: string, customFooter: string): Promise<void> {
    try {
      await this.prisma.company.update({
        where: { id: companyId },
        data: { customFooter },
      });
      
      this.logger.log(`Custom footer updated for company: ${companyId}`);
    } catch (error) {
      this.logger.error('Error updating custom footer:', error);
      throw new BadRequestException('Erro ao atualizar footer personalizado');
    }
  }

  async getCustomFooter(companyId: string): Promise<string | null> {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { customFooter: true },
      });
      
      return company?.customFooter || null;
    } catch (error) {
      this.logger.error('Error getting custom footer:', error);
      return null;
    }
  }

  /**
   * Abre a gaveta de dinheiro
   */
  async openCashDrawer(printerId: string): Promise<boolean> {
    try {
      const printer = await this.prisma.printer.findUnique({
        where: { id: printerId },
      });

      if (!printer) {
        throw new BadRequestException('Impressora não encontrada');
      }

      this.logger.log(`Abrindo gaveta de dinheiro na impressora: ${printer.name}`);
      
      return await this.thermalPrinter.openCashDrawer(printer.name);
    } catch (error) {
      this.logger.error('Erro ao abrir gaveta:', error);
      return false;
    }
  }

  /**
   * Obtém a fila de impressão
   */
  async getPrintQueue(printerId: string): Promise<any[]> {
    try {
      const printer = await this.prisma.printer.findUnique({
        where: { id: printerId },
      });

      if (!printer) {
        throw new BadRequestException('Impressora não encontrada');
      }

      return await this.thermalPrinter.getPrintQueue(printer.name);
    } catch (error) {
      this.logger.error('Erro ao obter fila de impressão:', error);
      return [];
    }
  }

  /**
   * Obtém logs de erro/sistema relacionados à impressora
   */
  async getPrinterLogs(printerId: string): Promise<string[]> {
    try {
      const printer = await this.prisma.printer.findUnique({
        where: { id: printerId },
      });

      if (!printer) {
        throw new BadRequestException('Impressora não encontrada');
      }

      return await this.driverService.getPrinterErrorLogs(printer.name);
    } catch (error) {
      this.logger.error('Erro ao obter logs da impressora:', error);
      return [];
    }
  }

  /**
   * Imprime orçamento
   */
  async printBudget(data: any): Promise<boolean> {
    try {
      this.logger.log(`Printing budget: ${data.budget.id}`);
      
      const content = this.generateBudgetContent(data);
      const result = await this.sendToPrinter(content, data.company.id);
      
      if (result.success) {
        this.logger.log(`Budget ${data.budget.id} printed successfully`);
      } else {
        this.logger.warn(`Failed to print budget ${data.budget.id}`);
      }
      
      return result.success;
    } catch (error) {
      this.logger.error('Error printing budget:', error);
      return false;
    }
  }

  /**
   * Gera conteúdo de orçamento para impressão térmica
   */
  private generateBudgetContent(data: any): string {
    const { company, budget, client, items, seller } = data;
    let content = '';
    
    // ===== CABEÇALHO =====
    content += '\n';
    content += this.centerText('================================') + '\n';
    content += this.centerText('*** ORÇAMENTO ***') + '\n';
    content += this.centerText('================================') + '\n';
    content += this.centerText(company.name.toUpperCase()) + '\n';
    content += this.centerText(`CNPJ: ${this.formatCnpj(company.cnpj)}`) + '\n';
    
    if (company.address) {
      content += this.centerText(company.address) + '\n';
    }
    
    if (company.phone) {
      content += this.centerText(`Tel: ${company.phone}`) + '\n';
    }
    
    if (company.email) {
      content += this.centerText(`Email: ${company.email}`) + '\n';
    }
    
    // ===== DADOS DO ORÇAMENTO =====
    content += '\n';
    content += this.centerText('================================') + '\n';
    content += `ORÇAMENTO Nº: ${budget.budgetNumber.toString().padStart(6, '0')}\n`;
    content += `Data: ${this.formatDate(new Date(budget.budgetDate))}\n`;
    content += `Validade: ${this.formatDate(new Date(budget.validUntil))}\n`;
    content += `Status: ${this.getBudgetStatus(budget.status)}\n`;
    
    // ===== DADOS DO CLIENTE =====
    if (client) {
      content += '\n';
      content += this.centerText('================================') + '\n';
      content += this.centerText('DADOS DO CLIENTE') + '\n';
      content += this.centerText('================================') + '\n';
      
      if (client.name) {
        content += `Nome: ${client.name}\n`;
      }
      
      if (client.cpfCnpj) {
        content += `CPF/CNPJ: ${this.formatCpfCnpj(client.cpfCnpj)}\n`;
      }
      
      if (client.phone) {
        content += `Telefone: ${client.phone}\n`;
      }
      
      if (client.email) {
        content += `Email: ${client.email}\n`;
      }
    }
    
    // ===== PRODUTOS =====
    content += '\n';
    content += this.centerText('================================') + '\n';
    content += this.centerText('PRODUTOS') + '\n';
    content += this.centerText('================================') + '\n';
    content += 'ITEM DESCRICAO     QTD  VL.UNIT  VL.TOTAL\n';
    content += '----------------------------------------\n';
    
    items.forEach((item: any, index: number) => {
      const itemNumber = (index + 1).toString().padStart(3);
      const description = item.productName.substring(0, 13).padEnd(13);
      const quantity = item.quantity.toString().padStart(3);
      const unitPrice = this.formatCurrency(item.unitPrice).padStart(8);
      const totalPrice = this.formatCurrency(item.totalPrice).padStart(9);
      
      content += `${itemNumber}  ${description}${quantity} ${unitPrice} ${totalPrice}\n`;
      
      if (item.barcode) {
        content += `     Cód: ${item.barcode}\n`;
      }
    });
    
    // ===== TOTAIS =====
    content += '----------------------------------------\n';
    content += `Qtd. Total de Itens: ${items.length}\n`;
    content += '\n';
    content += `VALOR TOTAL: ${this.formatCurrency(budget.total).padStart(30)}\n`;
    
    // ===== OBSERVAÇÕES =====
    if (budget.notes) {
      content += '\n';
      content += this.centerText('================================') + '\n';
      content += this.centerText('OBSERVAÇÕES') + '\n';
      content += this.centerText('================================') + '\n';
      content += this.wrapText(budget.notes, 40);
    }
    
    // ===== VENDEDOR =====
    if (seller) {
      content += '\n';
      content += `Vendedor: ${seller.name}\n`;
    }
    
    // ===== RODAPÉ =====
    content += '\n';
    content += this.centerText('================================') + '\n';
    content += this.centerText('ORÇAMENTO SEM VALOR FISCAL') + '\n';
    content += this.centerText('NÃO É DOCUMENTO FISCAL') + '\n';
    content += this.centerText('================================') + '\n';
    content += this.centerText('Este orçamento tem validade até') + '\n';
    content += this.centerText(this.formatDate(new Date(budget.validUntil))) + '\n';
    content += '\n';
    content += this.centerText('OBRIGADO PELA PREFERÊNCIA!') + '\n';
    content += this.centerText('================================') + '\n';
    content += this.centerText('🚀SISTEMA MONTSHOP! 🚀') + '\n';
    content += this.centerText(this.formatDate(new Date())) + '\n';
    content += '\n\n\n';
    
    return content;
  }

  private getBudgetStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      expired: 'Expirado',
    };
    
    return statusMap[status] || status;
  }
}

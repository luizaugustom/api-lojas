import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export interface SystemPrinter {
  name: string;
  driver: string;
  port: string;
  status: 'online' | 'offline' | 'error' | 'paper-empty';
  isDefault: boolean;
  connection: 'usb' | 'network' | 'bluetooth' | 'local';
}

export interface DriverInfo {
  name: string;
  installed: boolean;
  version?: string;
  compatible: boolean;
}

@Injectable()
export class PrinterDriverService {
  private readonly logger = new Logger(PrinterDriverService.name);
  private readonly platform = os.platform();
  private readonly driverCache = new Map<string, DriverInfo>();

  /**
   * Detecta todas as impressoras disponíveis no sistema
   */
  async detectSystemPrinters(): Promise<SystemPrinter[]> {
    try {
      this.logger.log(`Detectando impressoras no sistema ${this.platform}...`);

      switch (this.platform) {
        case 'win32':
          return await this.detectWindowsPrinters();
        case 'linux':
          return await this.detectLinuxPrinters();
        case 'darwin':
          return await this.detectMacPrinters();
        default:
          this.logger.warn(`Plataforma ${this.platform} não suportada`);
          return [];
      }
    } catch (error) {
      this.logger.error('Erro ao detectar impressoras:', error);
      return [];
    }
  }

  /**
   * Detecta impressoras no Windows
   */
  private async detectWindowsPrinters(): Promise<SystemPrinter[]> {
    try {
      // PowerShell command para listar impressoras
      const psCommand = `
        Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus, @{Name='IsDefault';Expression={$_.IsDefault}} | ConvertTo-Json
      `;

      const { stdout } = await execAsync(`powershell.exe -Command "${psCommand.replace(/\n/g, ' ')}"`);
      
      let printersData = JSON.parse(stdout);
      if (!Array.isArray(printersData)) {
        printersData = [printersData];
      }

      return printersData.map((printer: any) => ({
        name: printer.Name,
        driver: printer.DriverName || 'Unknown',
        port: printer.PortName || 'Unknown',
        status: this.parseWindowsStatus(printer.PrinterStatus),
        isDefault: printer.IsDefault || false,
        connection: this.detectConnectionType(printer.PortName),
      }));
    } catch (error) {
      this.logger.error('Erro ao detectar impressoras Windows:', error);
      return [];
    }
  }

  /**
   * Detecta impressoras no Linux
   */
  private async detectLinuxPrinters(): Promise<SystemPrinter[]> {
    try {
      // Usa lpstat para listar impressoras
      const { stdout } = await execAsync('lpstat -p -d 2>/dev/null || true');
      const printers: SystemPrinter[] = [];
      
      const lines = stdout.split('\n').filter(line => line.trim());
      let defaultPrinter = '';

      for (const line of lines) {
        if (line.startsWith('system default destination:')) {
          defaultPrinter = line.split(':')[1].trim();
        } else if (line.startsWith('printer')) {
          const match = line.match(/printer (\S+) is (.+)/);
          if (match) {
            const name = match[1];
            const status = match[2];
            
            // Obter informações adicionais
            try {
              const { stdout: detailsStdout } = await execAsync(`lpstat -v ${name} 2>/dev/null || echo ""`);
              const portMatch = detailsStdout.match(/device for .+: (.+)/);
              const port = portMatch ? portMatch[1] : 'Unknown';

              printers.push({
                name,
                driver: await this.getLinuxPrinterDriver(name),
                port,
                status: status.includes('idle') ? 'online' : 'offline',
                isDefault: name === defaultPrinter,
                connection: this.detectConnectionType(port),
              });
            } catch (error) {
              this.logger.warn(`Erro ao obter detalhes da impressora ${name}:`, error);
            }
          }
        }
      }

      return printers;
    } catch (error) {
      this.logger.error('Erro ao detectar impressoras Linux:', error);
      return [];
    }
  }

  /**
   * Detecta impressoras no macOS
   */
  private async detectMacPrinters(): Promise<SystemPrinter[]> {
    try {
      const { stdout } = await execAsync('lpstat -p -d 2>/dev/null || true');
      const printers: SystemPrinter[] = [];
      
      const lines = stdout.split('\n').filter(line => line.trim());
      let defaultPrinter = '';

      for (const line of lines) {
        if (line.includes('system default destination:')) {
          defaultPrinter = line.split(':')[1].trim();
        } else if (line.startsWith('printer')) {
          const match = line.match(/printer (\S+) (.+)/);
          if (match) {
            const name = match[1];
            const status = match[2];

            // Obter informações adicionais
            try {
              const { stdout: detailsStdout } = await execAsync(`lpstat -v ${name} 2>/dev/null || echo ""`);
              const portMatch = detailsStdout.match(/device for .+: (.+)/);
              const port = portMatch ? portMatch[1] : 'Unknown';

              printers.push({
                name,
                driver: await this.getMacPrinterDriver(name),
                port,
                status: status.includes('idle') ? 'online' : 'offline',
                isDefault: name === defaultPrinter,
                connection: this.detectConnectionType(port),
              });
            } catch (error) {
              this.logger.warn(`Erro ao obter detalhes da impressora ${name}:`, error);
            }
          }
        }
      }

      return printers;
    } catch (error) {
      this.logger.error('Erro ao detectar impressoras macOS:', error);
      return [];
    }
  }

  /**
   * Verifica drivers instalados para impressoras térmicas
   */
  async checkThermalPrinterDrivers(): Promise<DriverInfo[]> {
    const drivers: DriverInfo[] = [];

    try {
      switch (this.platform) {
        case 'win32':
          drivers.push(...await this.checkWindowsDrivers());
          break;
        case 'linux':
          drivers.push(...await this.checkLinuxDrivers());
          break;
        case 'darwin':
          drivers.push(...await this.checkMacDrivers());
          break;
      }
    } catch (error) {
      this.logger.error('Erro ao verificar drivers:', error);
    }

    return drivers;
  }

  /**
   * Verifica drivers no Windows
   */
  private async checkWindowsDrivers(): Promise<DriverInfo[]> {
    const commonDrivers = [
      'Generic / Text Only',
      'EPSON TM-T20',
      'EPSON TM-T88',
      'Elgin i9',
      'Elgin i7',
      'Bematech MP-4200',
      'Daruma DR700',
      'Zebra ZDesigner',
    ];

    const drivers: DriverInfo[] = [];

    try {
      const psCommand = 'Get-PrinterDriver | Select-Object Name | ConvertTo-Json';
      const { stdout } = await execAsync(`powershell.exe -Command "${psCommand}"`);
      
      let installedDrivers = JSON.parse(stdout);
      if (!Array.isArray(installedDrivers)) {
        installedDrivers = [installedDrivers];
      }

      const installedNames = installedDrivers.map((d: any) => d.Name);

      for (const driverName of commonDrivers) {
        const installed = installedNames.some((name: string) => 
          name.toLowerCase().includes(driverName.toLowerCase())
        );

        drivers.push({
          name: driverName,
          installed,
          compatible: true,
        });
      }
    } catch (error) {
      this.logger.error('Erro ao verificar drivers Windows:', error);
    }

    return drivers;
  }

  /**
   * Verifica drivers no Linux
   */
  private async checkLinuxDrivers(): Promise<DriverInfo[]> {
    const drivers: DriverInfo[] = [];

    try {
      // Verifica CUPS drivers
      const { stdout } = await execAsync('lpinfo -m 2>/dev/null || echo ""');
      const driverLines = stdout.split('\n');

      const thermalDriverKeywords = ['thermal', 'epson', 'tm-', 'esc/pos', 'star', 'bematech', 'elgin', 'daruma'];
      
      for (const keyword of thermalDriverKeywords) {
        const matching = driverLines.filter(line => 
          line.toLowerCase().includes(keyword)
        );

        if (matching.length > 0) {
          drivers.push({
            name: keyword.toUpperCase(),
            installed: true,
            version: 'CUPS',
            compatible: true,
          });
        }
      }
    } catch (error) {
      this.logger.warn('Erro ao verificar drivers Linux:', error);
    }

    return drivers;
  }

  /**
   * Verifica drivers no macOS
   */
  private async checkMacDrivers(): Promise<DriverInfo[]> {
    // Similar ao Linux, usa CUPS
    return this.checkLinuxDrivers();
  }

  /**
   * Instala drivers automaticamente (se possível)
   */
  async installThermalPrinterDrivers(): Promise<{ success: boolean; message: string; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      switch (this.platform) {
        case 'win32':
          return await this.installWindowsDrivers();
        case 'linux':
          return await this.installLinuxDrivers();
        case 'darwin':
          return await this.installMacDrivers();
        default:
          return {
            success: false,
            message: `Plataforma ${this.platform} não suportada`,
            errors: ['Plataforma não suportada'],
          };
      }
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
   * Instala drivers no Windows
   */
  private async installWindowsDrivers(): Promise<{ success: boolean; message: string; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // No Windows, geralmente precisamos de privilégios de administrador
      // Vamos verificar se o driver "Generic / Text Only" está disponível
      const psCommand = `
        $driver = Get-PrinterDriver -Name "Generic / Text Only" -ErrorAction SilentlyContinue
        if ($driver) {
          "INSTALLED"
        } else {
          try {
            Add-PrinterDriver -Name "Generic / Text Only"
            "SUCCESS"
          } catch {
            "ERROR: " + $_.Exception.Message
          }
        }
      `;

      const { stdout } = await execAsync(`powershell.exe -Command "${psCommand.replace(/\n/g, ' ')}"`);
      
      if (stdout.includes('INSTALLED') || stdout.includes('SUCCESS')) {
        return {
          success: true,
          message: 'Driver Generic / Text Only instalado ou já disponível',
          errors: [],
        };
      }

      if (stdout.includes('ERROR:')) {
        errors.push(stdout);
      }

      return {
        success: false,
        message: 'Não foi possível instalar drivers automaticamente. Execute o aplicativo como Administrador ou instale manualmente.',
        errors,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao instalar drivers. Pode ser necessário executar como Administrador.',
        errors: [error.message],
      };
    }
  }

  /**
   * Instala drivers no Linux
   */
  private async installLinuxDrivers(): Promise<{ success: boolean; message: string; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Verifica se CUPS está instalado
      try {
        await execAsync('which cupsd');
      } catch {
        errors.push('CUPS não está instalado');
        return {
          success: false,
          message: 'CUPS não encontrado. Instale com: sudo apt-get install cups (Debian/Ubuntu) ou sudo yum install cups (RedHat/CentOS)',
          errors,
        };
      }

      // Verifica se o pacote de drivers ESC/POS está disponível
      try {
        const { stdout } = await execAsync('dpkg -l | grep escpos || rpm -qa | grep escpos || echo "NOT_FOUND"');
        
        if (stdout.includes('NOT_FOUND')) {
          return {
            success: false,
            message: 'Drivers ESC/POS não encontrados. A maioria das impressoras térmicas funcionam com drivers genéricos do CUPS.',
            errors: ['Drivers específicos não instalados'],
          };
        }

        return {
          success: true,
          message: 'Drivers ESC/POS encontrados no sistema',
          errors: [],
        };
      } catch (error) {
        // CUPS genérico geralmente funciona
        return {
          success: true,
          message: 'Usando drivers genéricos do CUPS',
          errors: [],
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao verificar drivers Linux',
        errors: [error.message],
      };
    }
  }

  /**
   * Instala drivers no macOS
   */
  private async installMacDrivers(): Promise<{ success: boolean; message: string; errors: string[] }> {
    // macOS geralmente tem drivers genéricos que funcionam
    return {
      success: true,
      message: 'macOS possui drivers genéricos integrados para impressoras térmicas',
      errors: [],
    };
  }

  /**
   * Obtém informações do driver de uma impressora no Linux
   */
  private async getLinuxPrinterDriver(printerName: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`lpoptions -p ${printerName} -l | grep -i driver || echo "Unknown"`);
      const match = stdout.match(/driver.*:\s*(.+)/i);
      return match ? match[1].trim() : 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Obtém informações do driver de uma impressora no macOS
   */
  private async getMacPrinterDriver(printerName: string): Promise<string> {
    return this.getLinuxPrinterDriver(printerName);
  }

  /**
   * Parse do status da impressora no Windows
   */
  private parseWindowsStatus(status: number): 'online' | 'offline' | 'error' | 'paper-empty' {
    // Windows PrinterStatus: 0=Other, 1=Unknown, 2=Idle, 3=Printing, 4=Warming Up, 5=Stopped Printing, 6=Offline
    switch (status) {
      case 2:
      case 3:
      case 4:
        return 'online';
      case 6:
        return 'offline';
      case 5:
        return 'error';
      default:
        return 'offline';
    }
  }

  /**
   * Detecta o tipo de conexão baseado na porta
   */
  private detectConnectionType(port: string): 'usb' | 'network' | 'bluetooth' | 'local' {
    const portLower = port.toLowerCase();
    
    if (portLower.includes('usb')) return 'usb';
    if (portLower.includes('tcp') || portLower.includes('ip') || /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(port)) {
      return 'network';
    }
    if (portLower.includes('bluetooth') || portLower.includes('bt')) return 'bluetooth';
    
    return 'local';
  }

  /**
   * Testa se uma impressora está acessível
   */
  async testPrinterConnection(printerName: string): Promise<boolean> {
    try {
      switch (this.platform) {
        case 'win32':
          const psTest = `Get-Printer -Name "${printerName}" -ErrorAction SilentlyContinue`;
          const { stdout } = await execAsync(`powershell.exe -Command "${psTest}"`);
          return stdout.trim().length > 0;
        
        case 'linux':
        case 'darwin':
          await execAsync(`lpstat -p ${printerName} 2>/dev/null`);
          return true;
        
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Obtém logs de erro da impressora
   */
  async getPrinterErrorLogs(printerName: string): Promise<string[]> {
    const logs: string[] = [];

    try {
      switch (this.platform) {
        case 'win32':
          // Logs do Event Viewer para impressoras
          const psCommand = `Get-EventLog -LogName System -Source "Print" -Newest 10 -ErrorAction SilentlyContinue | Where-Object {$_.Message -like "*${printerName}*"} | Select-Object -ExpandProperty Message`;
          const { stdout } = await execAsync(`powershell.exe -Command "${psCommand}"`);
          logs.push(...stdout.split('\n').filter(line => line.trim()));
          break;
        
        case 'linux':
        case 'darwin':
          // Logs do CUPS
          const cupsLog = await fs.readFile('/var/log/cups/error_log', 'utf-8').catch(() => '');
          const printerLogs = cupsLog.split('\n')
            .filter(line => line.includes(printerName))
            .slice(-10);
          logs.push(...printerLogs);
          break;
      }
    } catch (error) {
      this.logger.warn(`Não foi possível obter logs de erro para ${printerName}:`, error);
    }

    return logs;
  }
}



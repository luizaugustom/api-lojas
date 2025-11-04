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
   * Melhorado para detectar USB, Bluetooth e Rede corretamente
   */
  private async detectWindowsPrinters(): Promise<SystemPrinter[]> {
    try {
      // PowerShell command melhorado para obter mais informações sobre portas
      const psCommand = `
        $printers = Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus, @{Name='IsDefault';Expression={$_.IsDefault}}
        $result = @()
        foreach ($printer in $printers) {
          try {
            $portInfo = Get-PrinterPort -Name $printer.PortName -ErrorAction SilentlyContinue
            $portType = if ($portInfo) { $portInfo.PortType } else { $null }
            $portAddress = if ($portInfo) { $portInfo.PrinterHostAddress } else { $null }
            
            # Verificar se a impressora está realmente acessível
            $printerDetails = Get-Printer -Name $printer.Name -ErrorAction SilentlyContinue
            $isAccessible = $printerDetails -ne $null
            
            # Se PrinterStatus for 0 (Other) ou 1 (Unknown), tentar determinar status real
            $realStatus = $printer.PrinterStatus
            if ($printer.PrinterStatus -eq 0 -or $printer.PrinterStatus -eq 1) {
              try {
                $testJob = Get-PrintJob -PrinterName $printer.Name -ErrorAction SilentlyContinue
                if ($testJob -ne $null -or $isAccessible) {
                  $realStatus = 2 # Idle
                }
              } catch {
                # Manter status original
              }
            }
            
            $result += @{
              Name = $printer.Name
              DriverName = $printer.DriverName
              PortName = $printer.PortName
              PortType = $portType
              PortAddress = $portAddress
              PrinterStatus = $realStatus
              IsDefault = $printer.IsDefault
              IsAccessible = $isAccessible
            }
          } catch {
            # Se houver erro, incluir impressora mesmo assim
            $result += @{
              Name = $printer.Name
              DriverName = $printer.DriverName
              PortName = $printer.PortName
              PortType = $null
              PortAddress = $null
              PrinterStatus = $printer.PrinterStatus
              IsDefault = $printer.IsDefault
              IsAccessible = $false
            }
          }
        }
        $result | ConvertTo-Json -Depth 3
      `;

      const { stdout } = await execAsync(`powershell.exe -Command "${psCommand.replace(/\n/g, ' ')}"`);
      
      if (!stdout || stdout.trim() === '' || stdout.trim() === 'null') {
        this.logger.warn('Nenhuma impressora encontrada no Windows');
        return [];
      }

      let printersData = JSON.parse(stdout);
      if (!Array.isArray(printersData)) {
        printersData = [printersData];
      }

      // Filtrar valores null e mapear
      return printersData
        .filter((p: any) => p && p.Name)
        .map((printer: any) => {
          const portName = printer.PortName || 'Unknown';
          const portType = printer.PortType || null;
          const portAddress = printer.PortAddress || null;
          
          // Determinar tipo de conexão com mais precisão
          let connection: 'usb' | 'network' | 'bluetooth' | 'local' = 'local';
          
          if (portType) {
            // PortType pode ser: TCP, USB, LPT, etc.
            if (portType.toString().toUpperCase().includes('TCP') || portType.toString().toUpperCase().includes('IP')) {
              connection = 'network';
            } else if (portType.toString().toUpperCase().includes('USB')) {
              connection = 'usb';
            } else if (portType.toString().toUpperCase().includes('BLUETOOTH') || portType.toString().toUpperCase().includes('BT')) {
              connection = 'bluetooth';
            }
          }
          
          // Fallback: usar detecção por nome da porta
          if (connection === 'local') {
            connection = this.detectConnectionType(portName, portAddress);
          }

          // Determinar status real da impressora
          let status = this.parseWindowsStatus(printer.PrinterStatus);
          
          // Se o status foi determinado como "Other" ou "Unknown" mas IsAccessible é true, considerar online
          if ((printer.PrinterStatus === 0 || printer.PrinterStatus === 1) && printer.IsAccessible) {
            status = 'online';
          }
          
          // Se o status indica offline mas a impressora está acessível, reconsiderar
          if (status === 'offline' && printer.IsAccessible) {
            status = 'online';
          }

          return {
            name: printer.Name,
            driver: printer.DriverName || 'Unknown',
            port: portName,
            status,
            isDefault: printer.IsDefault || false,
            connection,
          };
        });
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
                connection: this.detectConnectionType(port, null),
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
                connection: this.detectConnectionType(port, null),
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
      'Bematech MP 4200 HS',
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
      
      const hasTextDriver = stdout.includes('INSTALLED') || stdout.includes('SUCCESS');

      // Após garantir driver genérico, tenta configurar impressoras USB sem driver (melhor esforço)
      if (hasTextDriver) {
        try {
          await this.ensureUsbPrintersConfigured();
        } catch (e) {
          this.logger.warn('Falha ao configurar impressoras USB automaticamente:', e);
        }

        return {
          success: true,
          message: 'Drivers verificados. Driver genérico disponível e USBs configuradas (quando possível).',
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
   * Windows: cria impressoras lógicas com driver "Generic / Text Only" para dispositivos USB detectados
   * que não aparecem em Get-Printer (sem driver) mas existem como PnP devices. Usa a primeira porta USB disponível (USB001, USB002...)
   */
  private async ensureUsbPrintersConfigured(): Promise<void> {
    try {
      // Lista dispositivos PnP de classe Printer conectados via USB
      const listPnp = `Get-PnpDevice -Class Printer -ErrorAction SilentlyContinue | Where-Object { $_.InstanceId -like 'USB*' } | Select-Object FriendlyName, InstanceId | ConvertTo-Json`;
      const { stdout: pnpOut } = await execAsync(`powershell.exe -Command "${listPnp}"`);
      let pnpPrinters: any[] = [];
      if (pnpOut && pnpOut.trim()) {
        const parsed = JSON.parse(pnpOut);
        pnpPrinters = Array.isArray(parsed) ? parsed : [parsed];
      }

      if (pnpPrinters.length === 0) {
        return; // nada a fazer
      }

      // Lista impressoras já conhecidas do sistema
      const { stdout: gpOut } = await execAsync(`powershell.exe -Command "Get-Printer | Select-Object Name | ConvertTo-Json"`);
      let systemPrinters = [] as any[];
      if (gpOut && gpOut.trim()) {
        const parsed = JSON.parse(gpOut);
        systemPrinters = Array.isArray(parsed) ? parsed : [parsed];
      }
      const existingNames = new Set(systemPrinters.map((p: any) => (p.Name || '').toString().toLowerCase()));

      // Descobre próxima porta USB disponível
      const getPorts = `Get-PrinterPort | Where-Object { $_.Name -like 'USB*' } | Select-Object Name | ConvertTo-Json`;
      const { stdout: portsOut } = await execAsync(`powershell.exe -Command "${getPorts}"`);
      let ports: string[] = [];
      if (portsOut && portsOut.trim()) {
        const parsed = JSON.parse(portsOut);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        ports = arr.map((p: any) => p.Name);
      }
      const nextUsbPort = this.findNextUsbPortName(ports);

      for (const dev of pnpPrinters) {
        const friendly = (dev.FriendlyName || 'Impressora USB').toString();
        if (existingNames.has(friendly.toLowerCase())) {
          continue; // já existe impressora lógica com esse nome
        }

        // Cria porta se não existir
        if (!ports.includes(nextUsbPort)) {
          try {
            await execAsync(`powershell.exe -Command "Add-PrinterPort -Name '${nextUsbPort}'"`);
            ports.push(nextUsbPort);
          } catch (e) {
            this.logger.warn(`Falha ao criar porta ${nextUsbPort}:`, e);
          }
        }

        // Cria impressora lógica com driver genérico
        try {
          const addPrinterPs = `Add-Printer -Name "${friendly}" -DriverName "Generic / Text Only" -PortName "${nextUsbPort}"`;
          await execAsync(`powershell.exe -Command "${addPrinterPs}"`);
          this.logger.log(`Impressora lógica criada: ${friendly} -> ${nextUsbPort}`);
        } catch (e) {
          this.logger.warn(`Falha ao criar impressora lógica ${friendly}:`, e);
        }
      }
    } catch (error) {
      this.logger.warn('Não foi possível configurar impressoras USB automaticamente:', error);
    }
  }

  private findNextUsbPortName(existing: string[]): string {
    const set = new Set(existing.map(n => n.toUpperCase()));
    for (let i = 1; i <= 20; i++) {
      const name = `USB${i.toString().padStart(3, '0')}`;
      if (!set.has(name)) return name;
    }
    return 'USB099';
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
   * IMPORTANTE: Windows PrinterStatus enum:
   * 0 = Other (Outro estado - pode estar online)
   * 1 = Unknown (Desconhecido - geralmente offline)
   * 2 = Idle (Ociosa - ONLINE)
   * 3 = Printing (Imprimindo - ONLINE)
   * 4 = Warming Up (Aquecendo - ONLINE)
   * 5 = Stopped Printing (Parada - ERROR)
   * 6 = Offline (Desconectada - OFFLINE)
   * 7 = Paused (Pausada - ONLINE mas não operacional)
   * 8 = Error (Erro - ERROR)
   * 9 = Busy (Ocupada - ONLINE)
   * 10 = Not Available (Não disponível - OFFLINE)
   * 11 = Waiting (Aguardando - ONLINE)
   * 12 = Processing (Processando - ONLINE)
   * 13 = Initialization (Inicializando - ONLINE)
   * 14 = Power Save (Economia de energia - pode estar online)
   * 15 = Pending Deletion (Pendente de exclusão - OFFLINE)
   */
  private parseWindowsStatus(status: number): 'online' | 'offline' | 'error' | 'paper-empty' {
    // Status que indicam impressora ONLINE e funcional
    const onlineStatuses = [2, 3, 4, 9, 11, 12, 13]; // Idle, Printing, Warming Up, Busy, Waiting, Processing, Initialization
    
    // Status que indicam erro ou problema
    const errorStatuses = [5, 8]; // Stopped Printing, Error
    
    // Status que indicam offline
    const offlineStatuses = [6, 10, 15]; // Offline, Not Available, Pending Deletion
    
    // Status 0 (Other) e 1 (Unknown) podem estar online ou offline - vamos verificar pelo nome
    // Status 7 (Paused) está online mas pausada
    // Status 14 (Power Save) pode estar online
    
    if (onlineStatuses.includes(status)) {
      return 'online';
    }
    
    if (errorStatuses.includes(status)) {
      return 'error';
    }
    
    if (offlineStatuses.includes(status)) {
      return 'offline';
    }
    
    // Para status 0 (Other), 1 (Unknown), 7 (Paused), 14 (Power Save)
    // Assumimos online se não houver indicação contrária (será verificado depois)
    if (status === 0 || status === 14) {
      return 'online'; // Other e Power Save geralmente indicam que está conectada
    }
    
    if (status === 7) {
      return 'online'; // Paused está online mas pausada
    }
    
    // Unknown (1) ou qualquer outro status desconhecido - assumir offline para ser seguro
    return 'offline';
  }

  /**
   * Detecta o tipo de conexão baseado na porta e endereço
   * Melhorado para detectar USB, Bluetooth e Rede com mais precisão
   */
  private detectConnectionType(port: string, address?: string | null): 'usb' | 'network' | 'bluetooth' | 'local' {
    const portLower = port.toLowerCase();
    const addressLower = address ? address.toLowerCase() : '';
    const combined = `${portLower} ${addressLower}`;
    
    // Detecção de USB
    if (portLower.includes('usb') || 
        portLower.match(/usb\d{3}/) || 
        portLower.startsWith('usb') ||
        portLower.includes('usbport')) {
      return 'usb';
    }
    
    // Detecção de Bluetooth
    if (portLower.includes('bluetooth') || 
        portLower.includes('bt') ||
        portLower.includes('bth') ||
        combined.includes('bluetooth') ||
        combined.includes('_bt_')) {
      return 'bluetooth';
    }
    
    // Detecção de Rede (TCP/IP)
    if (portLower.includes('tcp') || 
        portLower.includes('ip_') ||
        portLower.includes('ipp') ||
        portLower.includes('http') ||
        portLower.includes('https') ||
        portLower.includes('socket') ||
        /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(port) ||
        /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(address || '')) {
      return 'network';
    }
    
    // Detecção por padrões de porta de rede
    if (portLower.includes(':') && /:\d+$/.test(port)) {
      // Porta com formato IP:PORTA (ex: 192.168.1.100:9100)
      return 'network';
    }
    
    // Local/Serial/LPT
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



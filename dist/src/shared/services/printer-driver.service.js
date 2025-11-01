"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PrinterDriverService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrinterDriverService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const util_1 = require("util");
const os = require("os");
const fs = require("fs/promises");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let PrinterDriverService = PrinterDriverService_1 = class PrinterDriverService {
    constructor() {
        this.logger = new common_1.Logger(PrinterDriverService_1.name);
        this.platform = os.platform();
        this.driverCache = new Map();
    }
    async detectSystemPrinters() {
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
        }
        catch (error) {
            this.logger.error('Erro ao detectar impressoras:', error);
            return [];
        }
    }
    async detectWindowsPrinters() {
        try {
            const psCommand = `
        Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus, @{Name='IsDefault';Expression={$_.IsDefault}} | ConvertTo-Json
      `;
            const { stdout } = await execAsync(`powershell.exe -Command "${psCommand.replace(/\n/g, ' ')}"`);
            let printersData = JSON.parse(stdout);
            if (!Array.isArray(printersData)) {
                printersData = [printersData];
            }
            return printersData.map((printer) => ({
                name: printer.Name,
                driver: printer.DriverName || 'Unknown',
                port: printer.PortName || 'Unknown',
                status: this.parseWindowsStatus(printer.PrinterStatus),
                isDefault: printer.IsDefault || false,
                connection: this.detectConnectionType(printer.PortName),
            }));
        }
        catch (error) {
            this.logger.error('Erro ao detectar impressoras Windows:', error);
            return [];
        }
    }
    async detectLinuxPrinters() {
        try {
            const { stdout } = await execAsync('lpstat -p -d 2>/dev/null || true');
            const printers = [];
            const lines = stdout.split('\n').filter(line => line.trim());
            let defaultPrinter = '';
            for (const line of lines) {
                if (line.startsWith('system default destination:')) {
                    defaultPrinter = line.split(':')[1].trim();
                }
                else if (line.startsWith('printer')) {
                    const match = line.match(/printer (\S+) is (.+)/);
                    if (match) {
                        const name = match[1];
                        const status = match[2];
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
                        }
                        catch (error) {
                            this.logger.warn(`Erro ao obter detalhes da impressora ${name}:`, error);
                        }
                    }
                }
            }
            return printers;
        }
        catch (error) {
            this.logger.error('Erro ao detectar impressoras Linux:', error);
            return [];
        }
    }
    async detectMacPrinters() {
        try {
            const { stdout } = await execAsync('lpstat -p -d 2>/dev/null || true');
            const printers = [];
            const lines = stdout.split('\n').filter(line => line.trim());
            let defaultPrinter = '';
            for (const line of lines) {
                if (line.includes('system default destination:')) {
                    defaultPrinter = line.split(':')[1].trim();
                }
                else if (line.startsWith('printer')) {
                    const match = line.match(/printer (\S+) (.+)/);
                    if (match) {
                        const name = match[1];
                        const status = match[2];
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
                        }
                        catch (error) {
                            this.logger.warn(`Erro ao obter detalhes da impressora ${name}:`, error);
                        }
                    }
                }
            }
            return printers;
        }
        catch (error) {
            this.logger.error('Erro ao detectar impressoras macOS:', error);
            return [];
        }
    }
    async checkThermalPrinterDrivers() {
        const drivers = [];
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
        }
        catch (error) {
            this.logger.error('Erro ao verificar drivers:', error);
        }
        return drivers;
    }
    async checkWindowsDrivers() {
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
        const drivers = [];
        try {
            const psCommand = 'Get-PrinterDriver | Select-Object Name | ConvertTo-Json';
            const { stdout } = await execAsync(`powershell.exe -Command "${psCommand}"`);
            let installedDrivers = JSON.parse(stdout);
            if (!Array.isArray(installedDrivers)) {
                installedDrivers = [installedDrivers];
            }
            const installedNames = installedDrivers.map((d) => d.Name);
            for (const driverName of commonDrivers) {
                const installed = installedNames.some((name) => name.toLowerCase().includes(driverName.toLowerCase()));
                drivers.push({
                    name: driverName,
                    installed,
                    compatible: true,
                });
            }
        }
        catch (error) {
            this.logger.error('Erro ao verificar drivers Windows:', error);
        }
        return drivers;
    }
    async checkLinuxDrivers() {
        const drivers = [];
        try {
            const { stdout } = await execAsync('lpinfo -m 2>/dev/null || echo ""');
            const driverLines = stdout.split('\n');
            const thermalDriverKeywords = ['thermal', 'epson', 'tm-', 'esc/pos', 'star', 'bematech', 'elgin', 'daruma'];
            for (const keyword of thermalDriverKeywords) {
                const matching = driverLines.filter(line => line.toLowerCase().includes(keyword));
                if (matching.length > 0) {
                    drivers.push({
                        name: keyword.toUpperCase(),
                        installed: true,
                        version: 'CUPS',
                        compatible: true,
                    });
                }
            }
        }
        catch (error) {
            this.logger.warn('Erro ao verificar drivers Linux:', error);
        }
        return drivers;
    }
    async checkMacDrivers() {
        return this.checkLinuxDrivers();
    }
    async installThermalPrinterDrivers() {
        const errors = [];
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
        }
        catch (error) {
            this.logger.error('Erro ao instalar drivers:', error);
            return {
                success: false,
                message: 'Erro ao instalar drivers',
                errors: [error.message],
            };
        }
    }
    async installWindowsDrivers() {
        const errors = [];
        try {
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
            if (hasTextDriver) {
                try {
                    await this.ensureUsbPrintersConfigured();
                }
                catch (e) {
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
        }
        catch (error) {
            return {
                success: false,
                message: 'Erro ao instalar drivers. Pode ser necessário executar como Administrador.',
                errors: [error.message],
            };
        }
    }
    async ensureUsbPrintersConfigured() {
        try {
            const listPnp = `Get-PnpDevice -Class Printer -ErrorAction SilentlyContinue | Where-Object { $_.InstanceId -like 'USB*' } | Select-Object FriendlyName, InstanceId | ConvertTo-Json`;
            const { stdout: pnpOut } = await execAsync(`powershell.exe -Command "${listPnp}"`);
            let pnpPrinters = [];
            if (pnpOut && pnpOut.trim()) {
                const parsed = JSON.parse(pnpOut);
                pnpPrinters = Array.isArray(parsed) ? parsed : [parsed];
            }
            if (pnpPrinters.length === 0) {
                return;
            }
            const { stdout: gpOut } = await execAsync(`powershell.exe -Command "Get-Printer | Select-Object Name | ConvertTo-Json"`);
            let systemPrinters = [];
            if (gpOut && gpOut.trim()) {
                const parsed = JSON.parse(gpOut);
                systemPrinters = Array.isArray(parsed) ? parsed : [parsed];
            }
            const existingNames = new Set(systemPrinters.map((p) => (p.Name || '').toString().toLowerCase()));
            const getPorts = `Get-PrinterPort | Where-Object { $_.Name -like 'USB*' } | Select-Object Name | ConvertTo-Json`;
            const { stdout: portsOut } = await execAsync(`powershell.exe -Command "${getPorts}"`);
            let ports = [];
            if (portsOut && portsOut.trim()) {
                const parsed = JSON.parse(portsOut);
                const arr = Array.isArray(parsed) ? parsed : [parsed];
                ports = arr.map((p) => p.Name);
            }
            const nextUsbPort = this.findNextUsbPortName(ports);
            for (const dev of pnpPrinters) {
                const friendly = (dev.FriendlyName || 'Impressora USB').toString();
                if (existingNames.has(friendly.toLowerCase())) {
                    continue;
                }
                if (!ports.includes(nextUsbPort)) {
                    try {
                        await execAsync(`powershell.exe -Command "Add-PrinterPort -Name '${nextUsbPort}'"`);
                        ports.push(nextUsbPort);
                    }
                    catch (e) {
                        this.logger.warn(`Falha ao criar porta ${nextUsbPort}:`, e);
                    }
                }
                try {
                    const addPrinterPs = `Add-Printer -Name "${friendly}" -DriverName "Generic / Text Only" -PortName "${nextUsbPort}"`;
                    await execAsync(`powershell.exe -Command "${addPrinterPs}"`);
                    this.logger.log(`Impressora lógica criada: ${friendly} -> ${nextUsbPort}`);
                }
                catch (e) {
                    this.logger.warn(`Falha ao criar impressora lógica ${friendly}:`, e);
                }
            }
        }
        catch (error) {
            this.logger.warn('Não foi possível configurar impressoras USB automaticamente:', error);
        }
    }
    findNextUsbPortName(existing) {
        const set = new Set(existing.map(n => n.toUpperCase()));
        for (let i = 1; i <= 20; i++) {
            const name = `USB${i.toString().padStart(3, '0')}`;
            if (!set.has(name))
                return name;
        }
        return 'USB099';
    }
    async installLinuxDrivers() {
        const errors = [];
        try {
            try {
                await execAsync('which cupsd');
            }
            catch {
                errors.push('CUPS não está instalado');
                return {
                    success: false,
                    message: 'CUPS não encontrado. Instale com: sudo apt-get install cups (Debian/Ubuntu) ou sudo yum install cups (RedHat/CentOS)',
                    errors,
                };
            }
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
            }
            catch (error) {
                return {
                    success: true,
                    message: 'Usando drivers genéricos do CUPS',
                    errors: [],
                };
            }
        }
        catch (error) {
            return {
                success: false,
                message: 'Erro ao verificar drivers Linux',
                errors: [error.message],
            };
        }
    }
    async installMacDrivers() {
        return {
            success: true,
            message: 'macOS possui drivers genéricos integrados para impressoras térmicas',
            errors: [],
        };
    }
    async getLinuxPrinterDriver(printerName) {
        try {
            const { stdout } = await execAsync(`lpoptions -p ${printerName} -l | grep -i driver || echo "Unknown"`);
            const match = stdout.match(/driver.*:\s*(.+)/i);
            return match ? match[1].trim() : 'Unknown';
        }
        catch {
            return 'Unknown';
        }
    }
    async getMacPrinterDriver(printerName) {
        return this.getLinuxPrinterDriver(printerName);
    }
    parseWindowsStatus(status) {
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
    detectConnectionType(port) {
        const portLower = port.toLowerCase();
        if (portLower.includes('usb'))
            return 'usb';
        if (portLower.includes('tcp') || portLower.includes('ip') || /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(port)) {
            return 'network';
        }
        if (portLower.includes('bluetooth') || portLower.includes('bt'))
            return 'bluetooth';
        return 'local';
    }
    async testPrinterConnection(printerName) {
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
        }
        catch {
            return false;
        }
    }
    async getPrinterErrorLogs(printerName) {
        const logs = [];
        try {
            switch (this.platform) {
                case 'win32':
                    const psCommand = `Get-EventLog -LogName System -Source "Print" -Newest 10 -ErrorAction SilentlyContinue | Where-Object {$_.Message -like "*${printerName}*"} | Select-Object -ExpandProperty Message`;
                    const { stdout } = await execAsync(`powershell.exe -Command "${psCommand}"`);
                    logs.push(...stdout.split('\n').filter(line => line.trim()));
                    break;
                case 'linux':
                case 'darwin':
                    const cupsLog = await fs.readFile('/var/log/cups/error_log', 'utf-8').catch(() => '');
                    const printerLogs = cupsLog.split('\n')
                        .filter(line => line.includes(printerName))
                        .slice(-10);
                    logs.push(...printerLogs);
                    break;
            }
        }
        catch (error) {
            this.logger.warn(`Não foi possível obter logs de erro para ${printerName}:`, error);
        }
        return logs;
    }
};
exports.PrinterDriverService = PrinterDriverService;
exports.PrinterDriverService = PrinterDriverService = PrinterDriverService_1 = __decorate([
    (0, common_1.Injectable)()
], PrinterDriverService);
//# sourceMappingURL=printer-driver.service.js.map
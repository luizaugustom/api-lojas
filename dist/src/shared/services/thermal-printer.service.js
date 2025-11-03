"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ThermalPrinterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThermalPrinterService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const util_1 = require("util");
const os = require("os");
const fs = require("fs/promises");
const path = require("path");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let ThermalPrinterService = ThermalPrinterService_1 = class ThermalPrinterService {
    constructor() {
        this.logger = new common_1.Logger(ThermalPrinterService_1.name);
        this.platform = os.platform();
    }
    async checkPrinterStatus(printerName) {
        try {
            switch (this.platform) {
                case 'win32': {
                    const ps = `Get-Printer -Name "${printerName}" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty PrinterStatus`;
                    const { stdout } = await execAsync(`powershell.exe -Command "${ps}"`);
                    const statusText = (stdout || '').trim();
                    const online = ['2', '3', '4'].includes(statusText);
                    return {
                        online,
                        paperOk: true,
                        error: statusText === '5',
                        message: `Windows PrinterStatus=${statusText}`,
                    };
                }
                case 'linux':
                case 'darwin': {
                    try {
                        await execAsync(`lpstat -p ${printerName} 2>/dev/null`);
                        return { online: true, paperOk: true };
                    }
                    catch {
                        return { online: false, paperOk: false, error: true, message: 'lpstat não encontrou a impressora' };
                    }
                }
                default:
                    return { online: false, paperOk: false, error: true, message: `Plataforma ${this.platform} não suportada` };
            }
        }
        catch (error) {
            this.logger.error('Erro em checkPrinterStatus:', error);
            return { online: false, paperOk: false, error: true, message: error.message };
        }
    }
    async print(printerName, content, cutPaper = false) {
        try {
            const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'montshop-print-'));
            const filePath = path.join(tmpDir, 'print.txt');
            const cutCommand = cutPaper ? '\u001D\u0056\u0001' : '';
            const contentWithCut = content + (cutPaper ? `\n${cutCommand}\n` : '');
            await fs.writeFile(filePath, contentWithCut, { encoding: 'utf8' });
            switch (this.platform) {
                case 'win32': {
                    const ps = `
            $filePath = '${filePath.replace(/\\/g, '/').replace(/'/g, "''")}';
            $printerName = "${printerName.replace(/"/g, '`"')}";
            [Console]::OutputEncoding = [System.Text.Encoding]::UTF8;
            Get-Content -Path $filePath -Raw -Encoding UTF8 | Out-Printer -Name $printerName;
          `;
                    await execAsync(`powershell.exe -NoProfile -NonInteractive -Command "${ps.replace(/\n/g, ' ')}"`);
                    break;
                }
                case 'linux':
                case 'darwin': {
                    await execAsync(`lp -d ${printerName.replace(/ /g, '\\ ')} '${filePath.replace(/'/g, "'\\''")}'`);
                    break;
                }
                default:
                    throw new Error(`Plataforma ${this.platform} não suportada`);
            }
            fs.unlink(filePath).catch(() => { });
            fs.rmdir(tmpDir).catch(() => { });
            return true;
        }
        catch (error) {
            this.logger.error('Erro ao imprimir:', error);
            this.logger.error('Detalhes do erro:', error instanceof Error ? error.stack : String(error));
            return false;
        }
    }
    async openCashDrawer(printerName) {
        try {
            const lower = printerName.toLowerCase();
            let pulseBuffer = Buffer.from([0x1B, 0x70, 0x00, 0x32, 0xC8]);
            if (lower.includes('bematech') || lower.includes('mp-') || lower.includes('mp 4200')) {
                pulseBuffer = Buffer.from([0x10, 0x14, 0x01, 0x00]);
            }
            else if (lower.includes('elgin') || lower.includes('i9') || lower.includes('i7')) {
                pulseBuffer = Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]);
            }
            else if (lower.includes('epson') || lower.includes('tm-')) {
                pulseBuffer = Buffer.from([0x1B, 0x70, 0x00, 0x50, 0x50]);
            }
            const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'montshop-drawer-'));
            const filePath = path.join(tmpDir, 'drawer.bin');
            await fs.writeFile(filePath, pulseBuffer);
            switch (this.platform) {
                case 'win32': {
                    const ps = `Get-Content -Path '${filePath}' -Encoding Byte | Out-Printer -Name "${printerName}"`;
                    await execAsync(`powershell.exe -Command "${ps}"`);
                    break;
                }
                case 'linux':
                case 'darwin': {
                    await execAsync(`lp -d ${printerName} '${filePath}'`);
                    break;
                }
                default:
                    throw new Error(`Plataforma ${this.platform} não suportada`);
            }
            return true;
        }
        catch (error) {
            this.logger.warn('Falha ao abrir gaveta (pode não ser suportado):', error);
            return false;
        }
    }
    async getPrintQueue(printerName) {
        try {
            switch (this.platform) {
                case 'win32': {
                    const ps = `Get-PrintJob -PrinterName "${printerName}" | Select-Object Id, Name, JobStatus, PagesPrinted, TotalPages | ConvertTo-Json`;
                    const { stdout } = await execAsync(`powershell.exe -Command "${ps}"`);
                    const data = stdout ? JSON.parse(stdout) : [];
                    return Array.isArray(data) ? data : (data ? [data] : []);
                }
                case 'linux':
                case 'darwin': {
                    const { stdout } = await execAsync(`lpq -P ${printerName} 2>/dev/null || echo ''`);
                    return stdout.split('\n').filter(line => line.trim());
                }
                default:
                    return [];
            }
        }
        catch (error) {
            this.logger.warn('Erro ao obter fila de impressão:', error);
            return [];
        }
    }
};
exports.ThermalPrinterService = ThermalPrinterService;
exports.ThermalPrinterService = ThermalPrinterService = ThermalPrinterService_1 = __decorate([
    (0, common_1.Injectable)()
], ThermalPrinterService);
//# sourceMappingURL=thermal-printer.service.js.map
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
        this.printQueue = [];
        this.ESC = '\x1B';
        this.GS = '\x1D';
    }
    async print(printerName, content, useEscPos = true) {
        try {
            this.logger.log(`Iniciando impressão na impressora: ${printerName}`);
            let printContent = content;
            if (useEscPos) {
                printContent = this.addEscPosCommands(content);
            }
            switch (this.platform) {
                case 'win32':
                    return await this.printWindows(printerName, printContent);
                case 'linux':
                    return await this.printLinux(printerName, printContent);
                case 'darwin':
                    return await this.printMac(printerName, printContent);
                default:
                    this.logger.error(`Plataforma ${this.platform} não suportada`);
                    return false;
            }
        }
        catch (error) {
            this.logger.error('Erro ao imprimir:', error);
            return false;
        }
    }
    async printWindows(printerName, content) {
        let tempFile = null;
        try {
            if (!printerName || printerName.trim() === '') {
                throw new Error('Nome da impressora inválido');
            }
            if (!content || content.length === 0) {
                throw new Error('Conteúdo de impressão vazio');
            }
            const tempDir = os.tmpdir();
            tempFile = path.join(tempDir, `print_${Date.now()}_${Math.random().toString(36).substring(7)}.txt`);
            this.logger.log(`Criando arquivo temporário: ${tempFile}`);
            await fs.writeFile(tempFile, content, { encoding: 'binary' });
            try {
                this.logger.log('Tentando método 1: comando print direto');
                await Promise.race([
                    execAsync(`print /D:"${printerName}" "${tempFile}"`),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
                ]);
                this.logger.log(`✅ Impressão enviada com sucesso para ${printerName} (método direto)`);
            }
            catch (printError) {
                this.logger.warn('Método 1 falhou, tentando fallback...');
                try {
                    this.logger.log('Tentando método 2: Out-Printer');
                    await Promise.race([
                        execAsync(`powershell.exe -Command "Get-Content '${tempFile}' -Raw | Out-Printer -Name '${printerName}'"`),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
                    ]);
                    this.logger.log(`✅ Impressão enviada via Out-Printer para ${printerName}`);
                }
                catch (outPrinterError) {
                    this.logger.warn('Método 2 falhou, tentando último fallback...');
                    try {
                        this.logger.log('Tentando método 3: acesso direto à porta');
                        const psCommand = `
              $ErrorActionPreference = 'Stop'
              $printer = Get-Printer -Name "${printerName}"
              $port = $printer.PortName
              $bytes = [System.IO.File]::ReadAllBytes("${tempFile}")
              if ($port -like "FILE:*" -or $port -like "USB*") {
                throw "Porta não suporta escrita direta"
              }
              [System.IO.File]::WriteAllBytes($port, $bytes)
            `;
                        await Promise.race([
                            execAsync(`powershell.exe -Command "${psCommand.replace(/\n/g, ' ')}"`),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
                        ]);
                        this.logger.log(`✅ Impressão enviada via porta direta para ${printerName}`);
                    }
                    catch (directError) {
                        this.logger.error('Todos os métodos de impressão falharam');
                        throw new Error(`Falha ao imprimir: ${directError.message}`);
                    }
                }
            }
            return true;
        }
        catch (error) {
            this.logger.error('❌ Erro ao imprimir no Windows:', error.message);
            this.logger.error('Stack:', error.stack);
            return false;
        }
        finally {
            if (tempFile) {
                await fs.unlink(tempFile).catch(err => this.logger.warn(`Não foi possível remover arquivo temporário: ${err.message}`));
            }
        }
    }
    async printLinux(printerName, content) {
        let tempFile = null;
        try {
            if (!printerName || printerName.trim() === '') {
                throw new Error('Nome da impressora inválido');
            }
            if (!content || content.length === 0) {
                throw new Error('Conteúdo de impressão vazio');
            }
            tempFile = path.join(os.tmpdir(), `print_${Date.now()}_${Math.random().toString(36).substring(7)}.txt`);
            this.logger.log(`Criando arquivo temporário: ${tempFile}`);
            await fs.writeFile(tempFile, content, { encoding: 'binary' });
            this.logger.log(`Enviando para impressora ${printerName} via lp...`);
            await Promise.race([
                execAsync(`lp -d ${printerName} -o raw ${tempFile}`),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout ao imprimir')), 15000))
            ]);
            this.logger.log(`✅ Impressão enviada com sucesso para ${printerName}`);
            return true;
        }
        catch (error) {
            this.logger.error('❌ Erro ao imprimir no Linux:', error.message);
            if (tempFile) {
                try {
                    this.logger.log('Tentando método alternativo: cat para dispositivo');
                    const { stdout } = await execAsync(`lpstat -v ${printerName} 2>/dev/null || echo ""`);
                    const deviceMatch = stdout.match(/device for .+: (.+)/);
                    if (deviceMatch && deviceMatch[1]) {
                        const device = deviceMatch[1];
                        await execAsync(`cat ${tempFile} > ${device}`);
                        this.logger.log(`✅ Impressão enviada via cat para ${device}`);
                        return true;
                    }
                }
                catch (altError) {
                    this.logger.error('Método alternativo também falhou:', altError.message);
                }
            }
            return false;
        }
        finally {
            if (tempFile) {
                await fs.unlink(tempFile).catch(err => this.logger.warn(`Não foi possível remover arquivo temporário: ${err.message}`));
            }
        }
    }
    async printMac(printerName, content) {
        return this.printLinux(printerName, content);
    }
    addEscPosCommands(content) {
        let result = '';
        result += this.ESC + '@';
        const lines = content.split('\n');
        for (const line of lines) {
            if (line.includes('===') || line.includes('---')) {
                result += line + '\n';
            }
            else if (this.shouldBeBold(line)) {
                result += this.ESC + 'E' + '\x01';
                result += line + '\n';
                result += this.ESC + 'E' + '\x00';
            }
            else if (this.shouldBeCentered(line)) {
                result += this.ESC + 'a' + '\x01';
                result += line + '\n';
                result += this.ESC + 'a' + '\x00';
            }
            else if (this.shouldBeDoubleHeight(line)) {
                result += this.GS + '!' + '\x11';
                result += line + '\n';
                result += this.GS + '!' + '\x00';
            }
            else {
                result += line + '\n';
            }
        }
        result += '\n\n\n';
        result += this.GS + 'V' + '\x41' + '\x03';
        return result;
    }
    shouldBeBold(line) {
        const boldKeywords = [
            'TOTAL',
            'VALOR',
            'CHAVE DE ACESSO',
            'NFC-E',
            'CNPJ',
            'PROTOCOLO',
            'AUTORIZADA',
        ];
        return boldKeywords.some(keyword => line.toUpperCase().includes(keyword));
    }
    shouldBeCentered(line) {
        if (line.includes('===') || line.includes('---')) {
            return false;
        }
        return line.trim().length < 40 && line.trim().length > 0;
    }
    shouldBeDoubleHeight(line) {
        const largeKeywords = [
            'NFC-E',
            'CUPOM FISCAL',
            'OBRIGADO',
        ];
        return largeKeywords.some(keyword => line.toUpperCase().includes(keyword));
    }
    async printBarcode(printerName, code, type = 'EAN13') {
        try {
            let command = '';
            command += this.ESC + '@';
            command += this.ESC + 'a' + '\x01';
            switch (type) {
                case 'EAN13':
                    command += this.GS + 'k' + '\x02';
                    command += code;
                    command += '\x00';
                    break;
                case 'CODE128':
                    command += this.GS + 'k' + '\x49';
                    command += String.fromCharCode(code.length);
                    command += code;
                    break;
                case 'QR':
                    command += this.GS + '(k' + '\x04\x00\x31\x41\x32\x00';
                    command += this.GS + '(k' + '\x03\x00\x31\x43\x06';
                    command += this.GS + '(k' + '\x03\x00\x31\x45\x30';
                    const qrData = Buffer.from(code, 'utf-8');
                    const pL = (qrData.length + 3) % 256;
                    const pH = Math.floor((qrData.length + 3) / 256);
                    command += this.GS + '(k' + String.fromCharCode(pL) + String.fromCharCode(pH) + '\x31\x50\x30' + code;
                    command += this.GS + '(k' + '\x03\x00\x31\x51\x30';
                    break;
            }
            command += '\n\n\n';
            command += this.GS + 'V' + '\x41' + '\x03';
            return await this.print(printerName, command, false);
        }
        catch (error) {
            this.logger.error('Erro ao imprimir código de barras:', error);
            return false;
        }
    }
    async openCashDrawer(printerName) {
        try {
            const command = this.ESC + 'p' + '\x00' + '\x64' + '\x64';
            return await this.print(printerName, command, false);
        }
        catch (error) {
            this.logger.error('Erro ao abrir gaveta:', error);
            return false;
        }
    }
    async checkPrinterStatus(printerName) {
        try {
            switch (this.platform) {
                case 'win32':
                    return await this.checkWindowsStatus(printerName);
                case 'linux':
                case 'darwin':
                    return await this.checkUnixStatus(printerName);
                default:
                    return {
                        online: false,
                        paperOk: false,
                        error: true,
                        message: 'Plataforma não suportada',
                    };
            }
        }
        catch (error) {
            return {
                online: false,
                paperOk: false,
                error: true,
                message: error.message,
            };
        }
    }
    async checkWindowsStatus(printerName) {
        try {
            const psCommand = `
        $printer = Get-Printer -Name "${printerName}" -ErrorAction Stop
        $status = $printer.PrinterStatus
        @{
          Status = $status
          IsShared = $printer.Shared
          PortName = $printer.PortName
        } | ConvertTo-Json
      `;
            const { stdout } = await execAsync(`powershell.exe -Command "${psCommand.replace(/\n/g, ' ')}"`);
            const result = JSON.parse(stdout);
            const online = result.Status === 0 || result.Status === 3;
            return {
                online,
                paperOk: online,
                error: !online,
                message: online ? 'Impressora online' : 'Impressora offline',
            };
        }
        catch (error) {
            return {
                online: false,
                paperOk: false,
                error: true,
                message: `Erro ao verificar status: ${error.message}`,
            };
        }
    }
    async checkUnixStatus(printerName) {
        try {
            const { stdout } = await execAsync(`lpstat -p ${printerName}`);
            const online = stdout.includes('idle') || stdout.includes('printing');
            const error = stdout.includes('stopped') || stdout.includes('disabled');
            return {
                online,
                paperOk: online && !stdout.includes('out of paper'),
                error,
                message: stdout.trim(),
            };
        }
        catch (error) {
            return {
                online: false,
                paperOk: false,
                error: true,
                message: `Erro ao verificar status: ${error.message}`,
            };
        }
    }
    async printTestPage(printerName) {
        const testContent = `
================================
     TESTE DE IMPRESSÃO
================================

Impressora: ${printerName}
Data/Hora: ${new Date().toLocaleString('pt-BR')}
Sistema: ${this.platform}

--------------------------------

TESTE DE FORMATAÇÃO:

Normal
NEGRITO
Centralizado

--------------------------------

Teste de caracteres especiais:
ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêë
ìíîïñòóôõöùúûüýÿ

--------------------------------

TESTE DE LINHAS:
1234567890123456789012345678901234567890
----------------------------------------

================================
   TESTE CONCLUÍDO COM SUCESSO
================================


`;
        return await this.print(printerName, testContent, true);
    }
    async getPrintQueue(printerName) {
        try {
            switch (this.platform) {
                case 'win32':
                    const psCommand = `Get-PrintJob -PrinterName "${printerName}" | Select-Object Id, DocumentName, UserName, SubmittedTime, JobStatus | ConvertTo-Json`;
                    const { stdout } = await execAsync(`powershell.exe -Command "${psCommand}"`);
                    return JSON.parse(stdout) || [];
                case 'linux':
                case 'darwin':
                    const { stdout: lpqOutput } = await execAsync(`lpq -P ${printerName}`);
                    const jobs = lpqOutput.split('\n')
                        .slice(2)
                        .filter(line => line.trim())
                        .map(line => {
                        const parts = line.split(/\s+/);
                        return {
                            id: parts[0],
                            user: parts[1],
                            documentName: parts.slice(2, -2).join(' '),
                            status: 'pending',
                        };
                    });
                    return jobs;
                default:
                    return [];
            }
        }
        catch (error) {
            this.logger.warn('Erro ao obter fila de impressão:', error);
            return [];
        }
    }
    async cancelPrintJob(printerName, jobId) {
        try {
            switch (this.platform) {
                case 'win32':
                    await execAsync(`powershell.exe -Command "Remove-PrintJob -PrinterName '${printerName}' -ID ${jobId}"`);
                    return true;
                case 'linux':
                case 'darwin':
                    await execAsync(`cancel ${printerName}-${jobId}`);
                    return true;
                default:
                    return false;
            }
        }
        catch (error) {
            this.logger.error('Erro ao cancelar trabalho de impressão:', error);
            return false;
        }
    }
};
exports.ThermalPrinterService = ThermalPrinterService;
exports.ThermalPrinterService = ThermalPrinterService = ThermalPrinterService_1 = __decorate([
    (0, common_1.Injectable)()
], ThermalPrinterService);
//# sourceMappingURL=thermal-printer.service.js.map
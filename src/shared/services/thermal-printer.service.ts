import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export interface PrintJob {
  id: string;
  printerName: string;
  content: string;
  type: 'text' | 'escpos';
  status: 'pending' | 'printing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

@Injectable()
export class ThermalPrinterService {
  private readonly logger = new Logger(ThermalPrinterService.name);
  private readonly platform = os.platform();
  private readonly printQueue: PrintJob[] = [];
  private readonly ESC = '\x1B';
  private readonly GS = '\x1D';

  /**
   * Envia conteúdo para impressão
   */
  async print(printerName: string, content: string, useEscPos = true): Promise<boolean> {
    try {
      this.logger.log(`Iniciando impressão na impressora: ${printerName}`);

      // Converte para ESC/POS se necessário
      let printContent = content;
      if (useEscPos) {
        printContent = this.addEscPosCommands(content);
      }

      // Envia para impressão baseado no sistema operacional
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
    } catch (error) {
      this.logger.error('Erro ao imprimir:', error);
      return false;
    }
  }

  /**
   * Imprime no Windows
   */
  private async printWindows(printerName: string, content: string): Promise<boolean> {
    let tempFile: string | null = null;
    
    try {
      // Validação de entrada
      if (!printerName || printerName.trim() === '') {
        throw new Error('Nome da impressora inválido');
      }
      
      if (!content || content.length === 0) {
        throw new Error('Conteúdo de impressão vazio');
      }
      
      // Cria arquivo temporário
      const tempDir = os.tmpdir();
      tempFile = path.join(tempDir, `print_${Date.now()}_${Math.random().toString(36).substring(7)}.txt`);
      
      this.logger.log(`Criando arquivo temporário: ${tempFile}`);
      await fs.writeFile(tempFile, content, { encoding: 'binary' });

      // Envia para impressora usando print command ou PowerShell
      try {
        // Tenta usar o comando print (mais direto) com timeout
        this.logger.log('Tentando método 1: comando print direto');
        await Promise.race([
          execAsync(`print /D:"${printerName}" "${tempFile}"`),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
        ]);
        this.logger.log(`✅ Impressão enviada com sucesso para ${printerName} (método direto)`);
      } catch (printError) {
        this.logger.warn('Método 1 falhou, tentando fallback...');
        
        // Fallback para Out-Printer (mais confiável)
        try {
          this.logger.log('Tentando método 2: Out-Printer');
          await Promise.race([
            execAsync(`powershell.exe -Command "Get-Content '${tempFile}' -Raw | Out-Printer -Name '${printerName}'"`),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
          ]);
          this.logger.log(`✅ Impressão enviada via Out-Printer para ${printerName}`);
        } catch (outPrinterError) {
          this.logger.warn('Método 2 falhou, tentando último fallback...');
          
          // Último fallback: via porta direta (se possível)
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
          } catch (directError) {
            this.logger.error('Todos os métodos de impressão falharam');
            throw new Error(`Falha ao imprimir: ${directError.message}`);
          }
        }
      }

      return true;
    } catch (error) {
      this.logger.error('❌ Erro ao imprimir no Windows:', error.message);
      this.logger.error('Stack:', error.stack);
      return false;
    } finally {
      // Remove arquivo temporário
      if (tempFile) {
        await fs.unlink(tempFile).catch(err => 
          this.logger.warn(`Não foi possível remover arquivo temporário: ${err.message}`)
        );
      }
    }
  }

  /**
   * Imprime no Linux
   */
  private async printLinux(printerName: string, content: string): Promise<boolean> {
    let tempFile: string | null = null;
    
    try {
      // Validação de entrada
      if (!printerName || printerName.trim() === '') {
        throw new Error('Nome da impressora inválido');
      }
      
      if (!content || content.length === 0) {
        throw new Error('Conteúdo de impressão vazio');
      }
      
      // Cria arquivo temporário
      tempFile = path.join(os.tmpdir(), `print_${Date.now()}_${Math.random().toString(36).substring(7)}.txt`);
      this.logger.log(`Criando arquivo temporário: ${tempFile}`);
      await fs.writeFile(tempFile, content, { encoding: 'binary' });

      // Usa lp para imprimir com timeout
      this.logger.log(`Enviando para impressora ${printerName} via lp...`);
      await Promise.race([
        execAsync(`lp -d ${printerName} -o raw ${tempFile}`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout ao imprimir')), 15000))
      ]);
      
      this.logger.log(`✅ Impressão enviada com sucesso para ${printerName}`);
      
      return true;
    } catch (error) {
      this.logger.error('❌ Erro ao imprimir no Linux:', error.message);
      
      // Tenta método alternativo
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
        } catch (altError) {
          this.logger.error('Método alternativo também falhou:', altError.message);
        }
      }
      
      return false;
    } finally {
      // Remove arquivo temporário
      if (tempFile) {
        await fs.unlink(tempFile).catch(err =>
          this.logger.warn(`Não foi possível remover arquivo temporário: ${err.message}`)
        );
      }
    }
  }

  /**
   * Imprime no macOS
   */
  private async printMac(printerName: string, content: string): Promise<boolean> {
    // macOS usa CUPS igual ao Linux
    return this.printLinux(printerName, content);
  }

  /**
   * Adiciona comandos ESC/POS ao conteúdo
   */
  private addEscPosCommands(content: string): string {
    let result = '';

    // Inicializa impressora
    result += this.ESC + '@'; // Reset

    // Processa o conteúdo linha por linha
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Detecta marcadores especiais e aplica formatação
      if (line.includes('===') || line.includes('---')) {
        // Linhas separadoras
        result += line + '\n';
      } else if (this.shouldBeBold(line)) {
        // Texto em negrito
        result += this.ESC + 'E' + '\x01'; // Bold ON
        result += line + '\n';
        result += this.ESC + 'E' + '\x00'; // Bold OFF
      } else if (this.shouldBeCentered(line)) {
        // Texto centralizado
        result += this.ESC + 'a' + '\x01'; // Center
        result += line + '\n';
        result += this.ESC + 'a' + '\x00'; // Left align
      } else if (this.shouldBeDoubleHeight(line)) {
        // Texto maior
        result += this.GS + '!' + '\x11'; // Double height and width
        result += line + '\n';
        result += this.GS + '!' + '\x00'; // Normal
      } else {
        // Texto normal
        result += line + '\n';
      }
    }

    // Corta o papel
    result += '\n\n\n';
    result += this.GS + 'V' + '\x41' + '\x03'; // Partial cut

    return result;
  }

  /**
   * Verifica se a linha deve ser em negrito
   */
  private shouldBeBold(line: string): boolean {
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

  /**
   * Verifica se a linha deve ser centralizada
   */
  private shouldBeCentered(line: string): boolean {
    // Linhas com === ou --- são separadoras
    if (line.includes('===') || line.includes('---')) {
      return false;
    }

    // Linhas curtas geralmente são títulos
    return line.trim().length < 40 && line.trim().length > 0;
  }

  /**
   * Verifica se a linha deve ter altura dupla
   */
  private shouldBeDoubleHeight(line: string): boolean {
    const largeKeywords = [
      'NFC-E',
      'CUPOM FISCAL',
      'OBRIGADO',
    ];

    return largeKeywords.some(keyword => line.toUpperCase().includes(keyword));
  }

  /**
   * Imprime código de barras
   */
  async printBarcode(printerName: string, code: string, type: 'EAN13' | 'CODE128' | 'QR' = 'EAN13'): Promise<boolean> {
    try {
      let command = '';

      // Inicializa
      command += this.ESC + '@';

      // Centraliza
      command += this.ESC + 'a' + '\x01';

      switch (type) {
        case 'EAN13':
          command += this.GS + 'k' + '\x02'; // EAN13
          command += code;
          command += '\x00'; // Null terminator
          break;

        case 'CODE128':
          command += this.GS + 'k' + '\x49'; // CODE128
          command += String.fromCharCode(code.length);
          command += code;
          break;

        case 'QR':
          // QR Code (modelo 2, tamanho 6, correção de erro M)
          command += this.GS + '(k' + '\x04\x00\x31\x41\x32\x00'; // Set model
          command += this.GS + '(k' + '\x03\x00\x31\x43\x06'; // Set size
          command += this.GS + '(k' + '\x03\x00\x31\x45\x30'; // Set error correction
          
          const qrData = Buffer.from(code, 'utf-8');
          const pL = (qrData.length + 3) % 256;
          const pH = Math.floor((qrData.length + 3) / 256);
          command += this.GS + '(k' + String.fromCharCode(pL) + String.fromCharCode(pH) + '\x31\x50\x30' + code;
          command += this.GS + '(k' + '\x03\x00\x31\x51\x30'; // Print QR
          break;
      }

      // Corta papel
      command += '\n\n\n';
      command += this.GS + 'V' + '\x41' + '\x03';

      return await this.print(printerName, command, false);
    } catch (error) {
      this.logger.error('Erro ao imprimir código de barras:', error);
      return false;
    }
  }

  /**
   * Abre gaveta de dinheiro
   */
  async openCashDrawer(printerName: string): Promise<boolean> {
    try {
      // Comando ESC/POS para abrir gaveta (pulso no pino 2 ou 5)
      const command = this.ESC + 'p' + '\x00' + '\x64' + '\x64'; // ESC p 0 100 100

      return await this.print(printerName, command, false);
    } catch (error) {
      this.logger.error('Erro ao abrir gaveta:', error);
      return false;
    }
  }

  /**
   * Verifica status da impressora
   */
  async checkPrinterStatus(printerName: string): Promise<{
    online: boolean;
    paperOk: boolean;
    error: boolean;
    message: string;
  }> {
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
    } catch (error) {
      return {
        online: false,
        paperOk: false,
        error: true,
        message: error.message,
      };
    }
  }

  /**
   * Verifica status no Windows
   */
  private async checkWindowsStatus(printerName: string): Promise<{
    online: boolean;
    paperOk: boolean;
    error: boolean;
    message: string;
  }> {
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

      const online = result.Status === 0 || result.Status === 3; // Idle or Printing
      
      return {
        online,
        paperOk: online, // Windows não reporta status de papel facilmente
        error: !online,
        message: online ? 'Impressora online' : 'Impressora offline',
      };
    } catch (error) {
      return {
        online: false,
        paperOk: false,
        error: true,
        message: `Erro ao verificar status: ${error.message}`,
      };
    }
  }

  /**
   * Verifica status no Linux/Mac
   */
  private async checkUnixStatus(printerName: string): Promise<{
    online: boolean;
    paperOk: boolean;
    error: boolean;
    message: string;
  }> {
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
    } catch (error) {
      return {
        online: false,
        paperOk: false,
        error: true,
        message: `Erro ao verificar status: ${error.message}`,
      };
    }
  }

  /**
   * Imprime teste de página
   */
  async printTestPage(printerName: string): Promise<boolean> {
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

  /**
   * Lista trabalhos de impressão pendentes
   */
  async getPrintQueue(printerName: string): Promise<any[]> {
    try {
      switch (this.platform) {
        case 'win32':
          const psCommand = `Get-PrintJob -PrinterName "${printerName}" | Select-Object Id, DocumentName, UserName, SubmittedTime, JobStatus | ConvertTo-Json`;
          const { stdout } = await execAsync(`powershell.exe -Command "${psCommand}"`);
          return JSON.parse(stdout) || [];
        
        case 'linux':
        case 'darwin':
          const { stdout: lpqOutput } = await execAsync(`lpq -P ${printerName}`);
          // Parse lpq output
          const jobs = lpqOutput.split('\n')
            .slice(2) // Skip header
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
    } catch (error) {
      this.logger.warn('Erro ao obter fila de impressão:', error);
      return [];
    }
  }

  /**
   * Cancela um trabalho de impressão
   */
  async cancelPrintJob(printerName: string, jobId: string): Promise<boolean> {
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
    } catch (error) {
      this.logger.error('Erro ao cancelar trabalho de impressão:', error);
      return false;
    }
  }
}


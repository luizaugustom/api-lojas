import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export interface PrinterStatus {
  online: boolean;
  paperOk: boolean;
  error?: boolean;
  message?: string;
}

@Injectable()
export class ThermalPrinterService {
  private readonly logger = new Logger(ThermalPrinterService.name);
  private readonly platform = os.platform();

  /**
   * Verifica o status básico da impressora.
   */
  async checkPrinterStatus(printerName: string): Promise<PrinterStatus> {
    try {
      switch (this.platform) {
        case 'win32': {
          const ps = `Get-Printer -Name "${printerName}" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty PrinterStatus`;
          const { stdout } = await execAsync(`powershell.exe -Command "${ps}"`);
          const statusText = (stdout || '').trim();
          const online = ['2', '3', '4'].includes(statusText); // Idle/Printing/Warming Up
          return {
            online,
            paperOk: true,
            error: statusText === '5', // Stopped Printing
            message: `Windows PrinterStatus=${statusText}`,
          };
        }
        case 'linux':
        case 'darwin': {
          try {
            await execAsync(`lpstat -p ${printerName} 2>/dev/null`);
            return { online: true, paperOk: true };
          } catch {
            return { online: false, paperOk: false, error: true, message: 'lpstat não encontrou a impressora' };
          }
        }
        default:
          return { online: false, paperOk: false, error: true, message: `Plataforma ${this.platform} não suportada` };
      }
    } catch (error) {
      this.logger.error('Erro em checkPrinterStatus:', error);
      return { online: false, paperOk: false, error: true, message: (error as Error).message };
    }
  }

  /**
   * Envia texto para a impressora térmica.
   * Implementação básica usando comandos do SO.
   */
  async print(printerName: string, content: string, cutPaper = false): Promise<boolean> {
    try {
      // Gera arquivo temporário com o conteúdo
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'montshop-print-'));
      const filePath = path.join(tmpDir, 'print.txt');

      // Acrescenta comando ESC/POS de corte (parcial) se solicitado
      const cutCommand = cutPaper ? '\u001D\u0056\u0001' : '';
      await fs.writeFile(filePath, content + (cutPaper ? `\n${cutCommand}\n` : ''), { encoding: 'utf8' });

      switch (this.platform) {
        case 'win32': {
          // Usa Out-Printer para enviar como texto
          const ps = `Get-Content -Path '${filePath}' | Out-Printer -Name "${printerName}"`;
          await execAsync(`powershell.exe -Command "${ps}"`);
          break;
        }
        case 'linux':
        case 'darwin': {
          // Envia via lp
          await execAsync(`lp -d ${printerName} '${filePath}'`);
          break;
        }
        default:
          throw new Error(`Plataforma ${this.platform} não suportada`);
      }

      return true;
    } catch (error) {
      this.logger.error('Erro ao imprimir:', error);
      return false;
    }
  }

  /**
   * Envia pulso para abrir gaveta (melhor esforço). Pode não funcionar em todas as impressoras.
   */
  async openCashDrawer(printerName: string): Promise<boolean> {
    try {
      // Perfis por marca/modelo: diferentes firmwares usam comandos distintos
      const lower = printerName.toLowerCase();
      let pulseBuffer = Buffer.from([0x1B, 0x70, 0x00, 0x32, 0xC8]); // ESC p 0 t1 t2 (padrão)
      if (lower.includes('bematech') || lower.includes('mp-')) {
        // Algumas Bematech respondem melhor ao DLE DC4 1 0 ou ESC p 0 25 250
        pulseBuffer = Buffer.from([0x10, 0x14, 0x01, 0x00]); // DLE DC4 1 0
      } else if (lower.includes('elgin') || lower.includes('i9') || lower.includes('i7')) {
        pulseBuffer = Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]); // ESC p 0 25 250
      } else if (lower.includes('epson') || lower.includes('tm-')) {
        pulseBuffer = Buffer.from([0x1B, 0x70, 0x00, 0x50, 0x50]); // ESC p 0 80 80
      }
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'montshop-drawer-'));
      const filePath = path.join(tmpDir, 'drawer.bin');
      await fs.writeFile(filePath, pulseBuffer);

      switch (this.platform) {
        case 'win32': {
          // Envio como binário pode não ser suportado por Out-Printer; ainda assim tentamos
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
    } catch (error) {
      this.logger.warn('Falha ao abrir gaveta (pode não ser suportado):', error);
      return false;
    }
  }

  /**
   * Retorna a fila de impressão da impressora, se disponível na plataforma.
   */
  async getPrintQueue(printerName: string): Promise<any[]> {
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
    } catch (error) {
      this.logger.warn('Erro ao obter fila de impressão:', error);
      return [];
    }
  }
}



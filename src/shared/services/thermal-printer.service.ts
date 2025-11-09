import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);
const RECEIPT_CUT_MARKER = '<<CUT_RECEIPT>>';
const ESC = 0x1b;
const GS = 0x1d;

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

      const segments = content.includes(RECEIPT_CUT_MARKER)
        ? content.split(RECEIPT_CUT_MARKER)
        : [content];

      const lineBreakBuffer = Buffer.from('\n\n\n', 'utf8');
      const cutBuffer = Buffer.from([GS, 0x56, 0x00]); // GS V 0 -> corte total

      const buffers: Buffer[] = [];

      segments.forEach((segment, index) => {
        const normalizedSegment = segment.endsWith('\n') ? segment : `${segment}\n`;
        buffers.push(Buffer.from(normalizedSegment, 'utf8'));

        const isLastSegment = index === segments.length - 1;
        const shouldCutAfterSegment = !isLastSegment || cutPaper;

        if (shouldCutAfterSegment) {
          buffers.push(lineBreakBuffer, cutBuffer, Buffer.from('\n', 'utf8'));
        }
      });

      const finalBuffer = Buffer.concat(buffers);
      await fs.writeFile(filePath, finalBuffer);

      switch (this.platform) {
        case 'win32': {
          // Usa Out-Printer com encoding UTF-8 explícito para caracteres especiais
          // -Raw preserva quebras de linha e caracteres especiais
          // [Console]::OutputEncoding garante encoding correto
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
          // Envia via lp com encoding UTF-8
          await execAsync(`lp -d ${printerName.replace(/ /g, '\\ ')} '${filePath.replace(/'/g, "'\\''")}'`);
          break;
        }
        default:
          throw new Error(`Plataforma ${this.platform} não suportada`);
      }

      // Limpa arquivo temporário após impressão (não bloqueia se falhar)
      fs.unlink(filePath).catch(() => {});
      fs.rmdir(tmpDir).catch(() => {});

      return true;
    } catch (error) {
      this.logger.error('Erro ao imprimir:', error);
      this.logger.error('Detalhes do erro:', error instanceof Error ? error.stack : String(error));
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
      if (lower.includes('bematech') || lower.includes('mp-') || lower.includes('mp 4200')) {
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



import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

export interface SystemScale {
  name: string;
  port: string;
  vendor?: string;
  modelHint?: string;
  connection: 'usb' | 'serial' | 'bluetooth' | 'hid';
}

export interface ScaleDriverInfo {
  name: string;
  installed: boolean;
  compatible: boolean;
  notes?: string;
}

@Injectable()
export class ScaleDriverService {
  private readonly logger = new Logger(ScaleDriverService.name);
  private readonly platform = os.platform();

  async detectSystemScales(): Promise<SystemScale[]> {
    try {
      switch (this.platform) {
        case 'win32':
          return await this.detectWindowsScales();
        case 'linux':
          return await this.detectLinuxScales();
        case 'darwin':
          return await this.detectMacScales();
        default:
          return [];
      }
    } catch (error) {
      this.logger.error('Erro ao detectar balanças:', error);
      return [];
    }
  }

  private async detectWindowsScales(): Promise<SystemScale[]> {
    try {
      // Lista portas seriais e tenta extrair nomes amigáveis para identificar balanças comuns
      const ps = `
        $ports = Get-WmiObject Win32_SerialPort | Select-Object DeviceID, Description
        $bluetooth = Get-PnpDevice -Class Bluetooth -Status OK -ErrorAction SilentlyContinue | Select-Object FriendlyName, InstanceId
        $hid = Get-PnpDevice -Class HIDClass -Status OK -ErrorAction SilentlyContinue | Select-Object FriendlyName, InstanceId
        $result = @()
        foreach ($p in $ports) { $result += @{ Type = 'Serial'; Port = $p.DeviceID; Name = $p.Description } }
        foreach ($b in $bluetooth) { $result += @{ Type = 'Bluetooth'; Port = ''; Name = $b.FriendlyName } }
        foreach ($h in $hid) { $result += @{ Type = 'HID'; Port = ''; Name = $h.FriendlyName } }
        $result | ConvertTo-Json
      `;
      const { stdout } = await execAsync(`powershell.exe -Command "${ps.replace(/\n/g, ' ')}"`);
      let items = JSON.parse(stdout);
      if (!Array.isArray(items)) items = [items];

      const knownBrands = ['Toledo', 'Filizola', 'Urano', 'Elgin', 'Prix', 'Micheletti'];

      return items.map((it: any) => {
        const name: string = it.Name || '';
        const brand = knownBrands.find(b => name.toLowerCase().includes(b.toLowerCase()));
        const type = (it.Type || '').toLowerCase();
        return {
          name: name || it.Port || 'Dispositivo',
          port: it.Port || '',
          vendor: brand,
          modelHint: name,
          connection: type === 'serial' ? 'serial' : type === 'bluetooth' ? 'bluetooth' : 'hid',
        } as SystemScale;
      });
    } catch (error) {
      this.logger.warn('Falha ao detectar balanças no Windows:', error);
      return [];
    }
  }

  private async detectLinuxScales(): Promise<SystemScale[]> {
    try {
      const { stdout } = await execAsync('ls /dev/ttyUSB* /dev/ttyACM* 2>/dev/null || true');
      const ports = stdout.split('\n').filter(Boolean);
      return ports.map((p) => ({ name: p, port: p, connection: 'serial' } as SystemScale));
    } catch {
      return [];
    }
  }

  private async detectMacScales(): Promise<SystemScale[]> {
    try {
      const { stdout } = await execAsync('ls /dev/tty.* 2>/dev/null | grep -i usb || true');
      const ports = stdout.split('\n').filter(Boolean);
      return ports.map((p) => ({ name: p, port: p, connection: 'serial' } as SystemScale));
    } catch {
      return [];
    }
  }

  async checkScaleDrivers(): Promise<ScaleDriverInfo[]> {
    // Lista genérica de drivers/condições conhecidas
    const list: ScaleDriverInfo[] = [];
    try {
      switch (this.platform) {
        case 'win32':
          // No Windows, a maioria usa driver de Porta COM (USB-Serial). Verificar presença de portas.
          const { stdout } = await execAsync('powershell.exe -Command "Get-WmiObject Win32_SerialPort | ConvertTo-Json"');
          const hasSerial = stdout && stdout.trim() !== '' && stdout.trim() !== '[]';
          list.push({ name: 'USB-Serial (COM)', installed: !!hasSerial, compatible: true });
          list.push({ name: 'HID POS Scale', installed: true, compatible: true, notes: 'HID costuma funcionar sem driver extra' });
          break;
        case 'linux':
        case 'darwin':
          list.push({ name: 'ttyUSB/ttyACM', installed: true, compatible: true });
          break;
      }
    } catch (error) {
      this.logger.warn('Erro ao verificar drivers de balança:', error);
    }
    return list;
  }

  async installScaleDrivers(): Promise<{ success: boolean; message: string; errors: string[] }> {
    try {
      switch (this.platform) {
        case 'win32':
          // Tentar habilitar instalação automática de drivers USB-Serial via pnputil (requer admin)
          const ps = `
            try {
              pnputil /enum-drivers | Out-Null
              "OK"
            } catch {
              "ERROR: " + $_.Exception.Message
            }
          `;
          const { stdout } = await execAsync(`powershell.exe -Command "${ps.replace(/\n/g, ' ')}"`);
          if (stdout.includes('OK')) {
            return { success: true, message: 'Drivers do Windows prontos (PnPUtil). Conecte a balança para instalar automaticamente.', errors: [] };
          }
          return { success: false, message: 'Execute como Administrador para instalar/verificar drivers via PnPUtil.', errors: [stdout.trim()] };
        case 'linux':
          return { success: true, message: 'Drivers seriais geralmente nativos (cdc_acm, usbserial).', errors: [] };
        case 'darwin':
          return { success: true, message: 'macOS possui suporte a dispositivos seriais USB comuns.', errors: [] };
        default:
          return { success: false, message: 'Plataforma não suportada', errors: [] };
      }
    } catch (error) {
      return { success: false, message: 'Erro ao instalar drivers', errors: [error.message] };
    }
  }

  async tryReadWeight(port: string, baudRate = 9600, timeoutMs = 1200): Promise<{ success: boolean; weight?: number; raw?: string; error?: string }> {
    try {
      if (this.platform === 'win32') {
        const ps = `
          $portName = '${port}'
          $baud = ${baudRate}
          $sp = New-Object System.IO.Ports.SerialPort $portName, $baud, 'None', 8, 'One'
          $sp.ReadTimeout = ${timeoutMs}
          try {
            $sp.Open()
            Start-Sleep -Milliseconds 150
            $buf = $sp.ReadExisting()
            if (-not $buf -or $buf.Length -lt 2) { $buf = $sp.ReadLine() }
            $sp.Close()
            $buf
          } catch { try { $sp.Close() } catch {} ; "ERROR:" + $_.Exception.Message }
        `;
        const { stdout } = await execAsync(`powershell.exe -Command "${ps.replace(/\n/g, ' ')}"`);
        const raw = stdout.trim();
        if (raw.startsWith('ERROR:')) {
          return { success: false, error: raw.substring(6).trim() };
        }
        const parsed = this.parseWeight(raw);
        if (parsed !== null) return { success: true, weight: parsed, raw };
        return { success: false, raw, error: 'Não foi possível interpretar o peso' };
      }
      // Linux/macOS: tentativa simples usando stty/cat
      const cmd = `sh -lc "stty -F ${port} ${baudRate} cs8 -cstopb -parenb 2>/dev/null || true; timeout ${Math.ceil(timeoutMs/1000)} cat ${port} 2>/dev/null || true"`;
      const { stdout } = await execAsync(cmd);
      const raw = stdout.trim();
      const parsed = this.parseWeight(raw);
      if (parsed !== null) return { success: true, weight: parsed, raw };
      return { success: false, raw, error: 'Não foi possível interpretar o peso' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private parseWeight(raw: string): number | null {
    // Suporte a protocolos comuns: números com vírgula/ponto, linhas com "P"/"S", tramas tipo "ST,GS,  0.500 kg"
    const candidates: RegExp[] = [
      /(-?\d+[\.,]\d{2,3})\s?(kg|g)?/i,
      /(?:ST|US|GS)[,;\s]*(-?\d+[\.,]\d{2,3})/i,
      /\b(-?\d{1,3}[\.,]\d{2,3})\b/,
    ];
    for (const re of candidates) {
      const m = raw.match(re);
      if (m) {
        const v = m[1].replace(',', '.');
        const num = parseFloat(v);
        if (!Number.isNaN(num)) return num;
      }
    }
    return null;
  }
}



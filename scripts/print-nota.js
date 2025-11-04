/**
 * Função para imprimir nota fiscal/cupom não fiscal no desktop
 * Recebe os dados da nota do backend, formata e imprime na impressora padrão ou selecionada
 * Requer Node.js e permissões de impressão
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

async function getDefaultPrinter() {
  const platform = os.platform();
  if (platform === 'win32') {
    const { stdout } = await execAsync('powershell.exe -Command "Get-Printer | Where-Object {$_.Default -eq $true} | Select Name | ConvertTo-Json"');
    const printer = JSON.parse(stdout);
    return printer?.Name || null;
  }
  // Linux/Mac: lpstat -d
  try {
    const { stdout } = await execAsync('lpstat -d');
    const match = stdout.match(/system default destination: (.+)/);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

function formatNotaToEscPos(nota) {
  // Exemplo de formatação simples, pode ser expandido conforme layout desejado
  const ESC = '\x1B';
  const GS = '\x1D';
  let content = '';
  content += ESC + '@';
  content += ESC + 'a' + '\x01'; // Centraliza
  content += ESC + 'E' + '\x01'; // Negrito ON
  content += GS + '!' + '\x11'; // Altura dupla
  content += 'CUPOM NÃO FISCAL\n';
  content += GS + '!' + '\x00';
  content += ESC + 'E' + '\x00';
  content += ESC + 'a' + '\x00';
  content += '================================\n';
  content += `Cliente: ${nota.cliente || ''}\n`;
  content += `Data: ${nota.data || ''}\n`;
  content += `Valor: R$ ${nota.valor || ''}\n`;
  content += '================================\n';
  if (nota.itens && Array.isArray(nota.itens)) {
    nota.itens.forEach(item => {
      content += `${item.qtd}x ${item.nome} - R$ ${item.preco}\n`;
    });
  }
  content += '\n================================\n';
  content += ESC + 'a' + '\x01';
  content += ESC + 'E' + '\x01';
  content += 'OBRIGADO!\n';
  content += ESC + 'E' + '\x00';
  content += ESC + 'a' + '\x00';
  content += '\n\n\n';
  content += GS + 'V' + '\x41' + '\x03'; // Corte parcial
  return content;
}

async function printNota(nota, printerName = null) {
  if (!printerName) {
    printerName = await getDefaultPrinter();
    if (!printerName) throw new Error('Nenhuma impressora padrão encontrada');
  }
  const content = formatNotaToEscPos(nota);
  const tempFile = path.join(os.tmpdir(), `nota_print_${Date.now()}.txt`);
  await fs.writeFile(tempFile, content, { encoding: 'binary' });
  const platform = os.platform();
  try {
    if (platform === 'win32') {
      try {
        await execAsync(`print /D:"${printerName}" "${tempFile}"`);
      } catch {
        await execAsync(`powershell.exe -Command "Get-Content '${tempFile}' -Raw | Out-Printer -Name '${printerName}'"`);
      }
    } else {
      await execAsync(`lp -d ${printerName} -o raw ${tempFile}`);
    }
    console.log('✅ Impressão enviada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao imprimir:', error.message);
    throw error;
  } finally {
    await fs.unlink(tempFile).catch(() => {});
  }
}

// Exemplo de uso:
// const nota = {
//   cliente: 'João da Silva',
//   data: '04/11/2025',
//   valor: '123,45',
//   itens: [
//     { qtd: 2, nome: 'Produto A', preco: '10,00' },
//     { qtd: 1, nome: 'Produto B', preco: '103,45' }
//   ]
// };
// printNota(nota).catch(console.error);

module.exports = { printNota, getDefaultPrinter };

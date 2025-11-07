/**
 * Script de Teste de Impressoras Térmicas
 * 
 * Este script testa a impressão em impressoras térmicas reais
 * Uso: node scripts/test-printer.js [nome-da-impressora]
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// Comandos ESC/POS
const ESC = '\x1B';
const GS = '\x1D';

async function getPrinters() {
  const platform = os.platform();
  
  console.log(`🖥️  Plataforma detectada: ${platform}\n`);
  
  try {
    switch (platform) {
      case 'win32':
  const { stdout } = await execAsync('powershell.exe -Command "Get-Printer | Select Name, PrinterStatus, WorkOffline, PortName | ConvertTo-Json"');
  const printers = JSON.parse(stdout);
  // Retorna array de objetos com status
  return Array.isArray(printers) ? printers : [printers];
      
      case 'linux':
      case 'darwin':
        const { stdout: lpstatOutput } = await execAsync('lpstat -p | awk \'{print $2}\'');
        return lpstatOutput.split('\n').filter(name => name.trim());
      
      default:
        console.error('❌ Plataforma não suportada');
        return [];
    }
  } catch (error) {
    console.error('❌ Erro ao listar impressoras:', error.message);
    return [];
  }
}

async function testPrint(printerName) {
  console.log(`\n🖨️  Testando impressora: ${printerName}\n`);
  
  // Gera conteúdo de teste com comandos ESC/POS
  let content = '';
  
  // Inicializa impressora
  content += ESC + '@';
  
  // Cabeçalho centralizado em negrito
  content += ESC + 'a' + '\x01'; // Centraliza
  content += ESC + 'E' + '\x01'; // Negrito ON
  content += GS + '!' + '\x11'; // Altura dupla
  content += 'TESTE DE IMPRESSÃO\n';
  content += GS + '!' + '\x00'; // Altura normal
  content += ESC + 'E' + '\x00'; // Negrito OFF
  content += ESC + 'a' + '\x00'; // Alinhamento esquerda
  
  content += '================================\n\n';
  
  // Informações do sistema
  content += `Sistema: ${os.platform()}\n`;
  content += `Data/Hora: ${new Date().toLocaleString('pt-BR')}\n`;
  content += `Impressora: ${printerName}\n\n`;
  
  content += '================================\n';
  content += '         TESTES DE FORMATO      \n';
  content += '================================\n\n';
  
  // Teste de texto normal
  content += 'Texto Normal\n';
  
  // Teste de negrito
  content += ESC + 'E' + '\x01';
  content += 'Texto em Negrito\n';
  content += ESC + 'E' + '\x00';
  
  // Teste de texto grande
  content += GS + '!' + '\x11';
  content += 'Texto Grande\n';
  content += GS + '!' + '\x00';
  
  // Teste de sublinhado
  content += ESC + '-' + '\x01';
  content += 'Texto Sublinhado\n';
  content += ESC + '-' + '\x00';
  
  content += '\n================================\n';
  content += '    TESTE DE CARACTERES         \n';
  content += '================================\n\n';
  
  // Caracteres especiais portugueses
  content += 'Acentos: áéíóú ÁÉÍÓÚ\n';
  content += 'Cedilha: ç Ç\n';
  content += 'Til: ãõ ÃÕ\n';
  content += 'Circunflexo: âêô ÂÊÔ\n\n';
  
  // Números e símbolos
  content += 'Números: 0123456789\n';
  content += 'Moeda: R$ 1.234,56\n';
  content += 'Símbolos: @#$%&*()_+-=\n\n';
  
  content += '================================\n';
  content += '      TESTE DE ALINHAMENTO      \n';
  content += '================================\n\n';
  
  // Esquerda
  content += ESC + 'a' + '\x00';
  content += 'Alinhado à Esquerda\n';
  
  // Centro
  content += ESC + 'a' + '\x01';
  content += 'Alinhado ao Centro\n';
  
  // Direita
  content += ESC + 'a' + '\x02';
  content += 'Alinhado à Direita\n';
  
  // Volta para esquerda
  content += ESC + 'a' + '\x00';
  
  content += '\n================================\n';
  content += '        TESTE DE LINHAS         \n';
  content += '================================\n\n';
  
  // Linha de 40 caracteres (comum em impressoras 58mm)
  content += '1234567890123456789012345678901234567890\n';
  
  // Linha de 32 caracteres (comum em impressoras 58mm com margens)
  content += '12345678901234567890123456789012\n\n';
  
  content += '================================\n';
  content += ESC + 'a' + '\x01'; // Centraliza
  content += ESC + 'E' + '\x01'; // Negrito
  content += 'TESTE CONCLUÍDO COM SUCESSO!\n';
  content += ESC + 'E' + '\x00';
  content += ESC + 'a' + '\x00';
  content += '================================\n\n';
  
  // Informação de tempo
  content += `Teste executado em: ${new Date().toISOString()}\n\n`;
  
  // Feed e corte parcial
  content += '\n\n\n';
  content += GS + 'V' + '\x41' + '\x03'; // Corte parcial
  
  // Salva em arquivo temporário
  const tempFile = path.join(os.tmpdir(), `test_print_${Date.now()}.txt`);
  await fs.writeFile(tempFile, content, { encoding: 'binary' });
  
  // Envia para impressora
  const platform = os.platform();
  
  try {
    switch (platform) {
      case 'win32':
        // Tenta método direto primeiro
        try {
          await execAsync(`print /D:"${printerName}" "${tempFile}"`);
          console.log('✅ Impressão enviada com sucesso (método direto)');
        } catch {
          // Fallback para PowerShell
          await execAsync(`powershell.exe -Command "Get-Content '${tempFile}' -Raw | Out-Printer -Name '${printerName}'"`);
          console.log('✅ Impressão enviada com sucesso (PowerShell)');
        }
        break;
      
      case 'linux':
      case 'darwin':
        await execAsync(`lp -d ${printerName} -o raw ${tempFile}`);
        console.log('✅ Impressão enviada com sucesso');
        break;
    }
    
    console.log('\n📄 Verifique se a impressão saiu corretamente');
    console.log('   Se não saiu, pode ser necessário:');
    console.log('   - Instalar drivers específicos da impressora');
    console.log('   - Configurar a impressora como "Generic / Text Only"');
    console.log('   - Verificar se a impressora está online e com papel\n');
    
  } catch (error) {
    console.error('❌ Erro ao imprimir:', error.message);
    throw error;
  } finally {
    // Remove arquivo temporário
    await fs.unlink(tempFile).catch(() => {});
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   TESTE DE IMPRESSORAS TÉRMICAS          ║');
  console.log('║   Sistema MontShop                        ║');
  console.log('╚═══════════════════════════════════════════╝\n');
  
  // Nome da impressora via argumento
  let printerName = process.argv[2];
  
  if (!printerName) {
    console.log('📋 Listando impressoras disponíveis...\n');
    const printers = await getPrinters();
    if (printers.length === 0) {
      console.error('❌ Nenhuma impressora encontrada');
      console.log('\n💡 Dica: Conecte uma impressora e tente novamente\n');
      process.exit(1);
    }
    console.log('Impressoras encontradas:');
    printers.forEach((printer, index) => {
      // Mostra status detalhado
      const status = typeof printer === 'object'
        ? `Status: ${printer.PrinterStatus} | Offline: ${printer.WorkOffline} | Porta: ${printer.PortName}`
        : '';
      const name = typeof printer === 'object' ? printer.Name : printer;
      console.log(`  ${index + 1}. ${name} ${status}`);
    });
    console.log('\n🔧 Uso: node scripts/test-printer.js "Nome da Impressora"');
    console.log('   Exemplo: node scripts/test-printer.js "EPSON TM-T20"\n');
    process.exit(0);
  }
  
  // Remove aspas se houver
  printerName = printerName.replace(/^["'](.*)["']$/, '$1');
  
  try {
    await testPrint(printerName);
    
    console.log('═══════════════════════════════════════════');
    console.log('✅ Teste concluído!\n');
    
  } catch (error) {
    console.error('\n❌ Teste falhou:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Verifique se a impressora está ligada');
    console.log('   2. Verifique se tem papel');
    console.log('   3. Verifique se o nome está correto');
    console.log('   4. Tente executar como Administrador (Windows)');
    console.log('   5. Verifique se os drivers estão instalados\n');
    
    process.exit(1);
  }
}

main();






































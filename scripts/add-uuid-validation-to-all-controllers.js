/**
 * Script para adicionar validação UUID em todos os controllers
 * Este script adiciona automaticamente o UuidValidationPipe em todos os @Param('id')
 */

const fs = require('fs');
const path = require('path');

// Lista de controllers para processar
const controllers = [
  'seller/seller.controller.ts',
  'customer/customer.controller.ts',
  'bill-to-pay/bill-to-pay.controller.ts',
  'cash-closure/cash-closure.controller.ts',
  'fiscal/fiscal.controller.ts',
  'printer/printer.controller.ts',
  'admin/admin.controller.ts',
];

const basePath = path.join(__dirname, '../src/application');

controllers.forEach(controllerPath => {
  const fullPath = path.join(basePath, controllerPath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Arquivo não encontrado: ${fullPath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Adicionar import se não existir
  if (!content.includes("import { UuidValidationPipe }")) {
    // Encontrar a última linha de import do shared
    const importRegex = /import.*from '\.\.\/\.\.\/shared.*';/g;
    const matches = content.match(importRegex);
    
    if (matches && matches.length > 0) {
      const lastImport = matches[matches.length - 1];
      const importLine = "\nimport { UuidValidationPipe } from '../../shared/pipes/uuid-validation.pipe';";
      content = content.replace(lastImport, lastImport + importLine);
      modified = true;
    }
  }

  // Substituir @Param('id') id: string por @Param('id', UuidValidationPipe) id: string
  const paramRegex = /@Param\('id'\)(?!\,.*UuidValidationPipe) (id: string)/g;
  const newContent = content.replace(paramRegex, "@Param('id', UuidValidationPipe) $1");
  
  if (newContent !== content) {
    content = newContent;
    modified = true;
  }

  // Adicionar @ApiResponse para ID inválido onde não existe
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Atualizado: ${controllerPath}`);
  } else {
    console.log(`ℹ️  Sem mudanças: ${controllerPath}`);
  }
});

console.log('\n🎉 Script concluído!');


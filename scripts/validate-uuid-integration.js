/**
 * Script de Validação Completa UUID v4
 * 
 * Este script valida:
 * 1. Schema Prisma está correto
 * 2. Controllers têm validação UUID
 * 3. DTOs têm IsUUID onde necessário
 * 4. Tipos TypeScript estão corretos
 * 5. Pipe de validação está configurado
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Iniciando validação de integração UUID v4...\n');

let errors = [];
let warnings = [];
let successes = [];

// =====================================================
// 1. Validar Schema Prisma
// =====================================================

console.log('📋 Validando Schema Prisma...');
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');

if (!fs.existsSync(schemaPath)) {
  errors.push('Schema Prisma não encontrado!');
} else {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Verificar se não há mais cuid()
  if (schema.includes('@default(cuid())')) {
    errors.push('Schema ainda contém @default(cuid()). Deve ser @default(uuid())');
  } else {
    successes.push('✅ Schema não contém cuid()');
  }
  
  // Verificar se tem uuid()
  if (!schema.includes('@default(uuid())')) {
    errors.push('Schema não contém @default(uuid())');
  } else {
    successes.push('✅ Schema usa uuid() corretamente');
  }
  
  // Contar modelos
  const modelMatches = schema.match(/model \w+/g);
  const modelCount = modelMatches ? modelMatches.length : 0;
  successes.push(`✅ ${modelCount} modelos encontrados no schema`);
}

// =====================================================
// 2. Validar Controllers
// =====================================================

console.log('\n🎮 Validando Controllers...');
const controllersPath = path.join(__dirname, '../src/application');
const controllers = [
  'product/product.controller.ts',
  'sale/sale.controller.ts',
  'company/company.controller.ts',
  'seller/seller.controller.ts',
  'customer/customer.controller.ts',
  'bill-to-pay/bill-to-pay.controller.ts',
  'cash-closure/cash-closure.controller.ts',
  'fiscal/fiscal.controller.ts',
  'printer/printer.controller.ts',
  'admin/admin.controller.ts',
];

controllers.forEach(controllerPath => {
  const fullPath = path.join(controllersPath, controllerPath);
  
  if (!fs.existsSync(fullPath)) {
    warnings.push(`⚠️  Controller não encontrado: ${controllerPath}`);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Verificar import do UuidValidationPipe
  if (!content.includes('UuidValidationPipe')) {
    warnings.push(`⚠️  ${controllerPath} não importa UuidValidationPipe`);
  } else {
    successes.push(`✅ ${controllerPath.split('/')[0]} usa UuidValidationPipe`);
  }
  
  // Verificar uso de @Param('id') sem validação
  const paramWithoutValidation = content.match(/@Param\('id'\)\s+id:\s+string/g);
  if (paramWithoutValidation && paramWithoutValidation.length > 0) {
    warnings.push(
      `⚠️  ${controllerPath} tem ${paramWithoutValidation.length} @Param('id') sem UuidValidationPipe`
    );
  }
});

// =====================================================
// 3. Validar DTOs
// =====================================================

console.log('\n📝 Validando DTOs...');
const dtosWithIds = [
  'sale/dto/create-sale.dto.ts',
  'fiscal/dto/generate-nfce.dto.ts',
  'sale/dto/process-exchange.dto.ts',
];

dtosWithIds.forEach(dtoPath => {
  const fullPath = path.join(controllersPath, dtoPath);
  
  if (!fs.existsSync(fullPath)) {
    warnings.push(`⚠️  DTO não encontrado: ${dtoPath}`);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Verificar se tem IsUUID
  if (content.includes('Id:') && !content.includes('IsUUID')) {
    warnings.push(`⚠️  ${dtoPath} tem campo ID mas não usa @IsUUID()`);
  } else if (content.includes('IsUUID')) {
    successes.push(`✅ ${dtoPath.split('/')[0]} DTO usa @IsUUID()`);
  }
});

// =====================================================
// 4. Validar Pipe
// =====================================================

console.log('\n🔧 Validando Pipe de Validação...');
const pipePath = path.join(__dirname, '../src/shared/pipes/uuid-validation.pipe.ts');

if (!fs.existsSync(pipePath)) {
  errors.push('UuidValidationPipe não encontrado!');
} else {
  const pipeContent = fs.readFileSync(pipePath, 'utf8');
  
  // Verificar se aceita UUID v4
  if (!pipeContent.includes('4[0-9a-f]{3}')) {
    errors.push('UuidValidationPipe não valida UUID v4 corretamente');
  } else {
    successes.push('✅ UuidValidationPipe valida UUID v4 corretamente');
  }
  
  // Verificar se não aceita mais CUID
  if (pipeContent.toLowerCase().includes('cuid')) {
    warnings.push('⚠️  UuidValidationPipe ainda menciona CUID no código');
  } else {
    successes.push('✅ UuidValidationPipe não aceita mais CUID');
  }
}

// =====================================================
// 5. Verificar Migration
// =====================================================

console.log('\n🗄️  Verificando Migration...');
const migrationPath = path.join(__dirname, '../prisma/migrations/production_uuid_migration.sql');

if (!fs.existsSync(migrationPath)) {
  warnings.push('⚠️  Migration SQL para produção não encontrada');
} else {
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  const migrationSize = (migrationContent.length / 1024).toFixed(2);
  successes.push(`✅ Migration SQL encontrada (${migrationSize} KB)`);
  
  // Verificar se tem uuid_generate_v4()
  if (!migrationContent.includes('uuid_generate_v4()')) {
    warnings.push('⚠️  Migration não usa uuid_generate_v4()');
  } else {
    successes.push('✅ Migration usa uuid_generate_v4()');
  }
}

// =====================================================
// 6. Verificar Validador Customizado
// =====================================================

console.log('\n✨ Verificando Validador Customizado...');
const validatorPath = path.join(__dirname, '../src/shared/validators/uuid.validator.ts');

if (!fs.existsSync(validatorPath)) {
  warnings.push('⚠️  Validador UUID customizado não encontrado');
} else {
  successes.push('✅ Validador UUID customizado encontrado');
}

// =====================================================
// 7. Verificar Documentação
// =====================================================

console.log('\n📚 Verificando Documentação...');
const docs = [
  'MIGRACAO_UUID_GUIA.md',
  'INTEGRACAO_COMPLETA.md',
];

docs.forEach(doc => {
  const docPath = path.join(__dirname, '..', doc);
  if (!fs.existsSync(docPath)) {
    warnings.push(`⚠️  Documentação não encontrada: ${doc}`);
  } else {
    const docSize = (fs.statSync(docPath).size / 1024).toFixed(2);
    successes.push(`✅ ${doc} encontrado (${docSize} KB)`);
  }
});

// =====================================================
// RESULTADO FINAL
// =====================================================

console.log('\n' + '='.repeat(60));
console.log('📊 RESULTADO DA VALIDAÇÃO');
console.log('='.repeat(60) + '\n');

if (successes.length > 0) {
  console.log('✅ SUCESSOS:\n');
  successes.forEach(success => console.log(`   ${success}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  AVISOS:\n');
  warnings.forEach(warning => console.log(`   ${warning}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ ERROS:\n');
  errors.forEach(error => console.log(`   ${error}`));
  console.log('');
}

console.log('='.repeat(60));
console.log(`Total: ${successes.length} sucessos | ${warnings.length} avisos | ${errors.length} erros`);
console.log('='.repeat(60) + '\n');

// Status final
if (errors.length > 0) {
  console.log('❌ Validação FALHOU! Corrija os erros acima.');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('⚠️  Validação passou com avisos. Recomenda-se revisar.');
  process.exit(0);
} else {
  console.log('✅ Validação passou com SUCESSO! Sistema pronto para produção.');
  process.exit(0);
}


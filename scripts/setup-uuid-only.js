#!/usr/bin/env node

/**
 * Script para configurar e validar UUID v4 como único tipo de ID
 * 
 * Este script:
 * 1. Verifica o schema Prisma
 * 2. Valida a configuração do banco
 * 3. Fornece instruções claras de correção
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 CONFIGURAÇÃO UUID v4 ÚNICO');
console.log('='.repeat(70));
console.log();

// 1. Verificar schema Prisma
console.log('1️⃣  Verificando schema Prisma...');
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

if (!fs.existsSync(schemaPath)) {
  console.error('❌ schema.prisma não encontrado!');
  process.exit(1);
}

const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

// Verificar se há referências a CUID
const hasCuid = schemaContent.includes('@default(cuid())');
const hasUuid = schemaContent.includes('@default(uuid())');

console.log('   Schema Prisma:');
if (hasCuid) {
  console.log('   ❌ PROBLEMA: Schema usa @default(cuid())');
  console.log('   📝 Ação necessária: Substituir todos os @default(cuid()) por @default(uuid())');
} else if (hasUuid) {
  console.log('   ✅ Schema configurado corretamente com @default(uuid())');
} else {
  console.log('   ⚠️  AVISO: Nenhum default encontrado');
}

console.log();

// 2. Verificar migrations
console.log('2️⃣  Verificando migrations...');
const migrationsPath = path.join(__dirname, '..', 'prisma', 'migrations');

if (!fs.existsSync(migrationsPath)) {
  console.log('   ⚠️  Pasta migrations não existe - será criada');
} else {
  const migrations = fs.readdirSync(migrationsPath).filter(f => 
    fs.statSync(path.join(migrationsPath, f)).isDirectory()
  );
  
  if (migrations.length === 0) {
    console.log('   ⚠️  Nenhuma migration encontrada');
  } else {
    console.log(`   📁 ${migrations.length} migration(s) encontrada(s)`);
    migrations.forEach(m => console.log(`      - ${m}`));
  }
}

console.log();

// 3. Verificar validações
console.log('3️⃣  Verificando validações UUID...');
const validatorPath = path.join(__dirname, '..', 'src', 'shared', 'validators', 'uuid.validator.ts');
const pipePath = path.join(__dirname, '..', 'src', 'shared', 'pipes', 'uuid-validation.pipe.ts');

let validationsOk = true;

if (fs.existsSync(validatorPath)) {
  const validatorContent = fs.readFileSync(validatorPath, 'utf-8');
  if (validatorContent.includes('UUID v4') || validatorContent.includes('uuid')) {
    console.log('   ✅ uuid.validator.ts configurado');
  } else {
    console.log('   ⚠️  uuid.validator.ts pode precisar de revisão');
    validationsOk = false;
  }
} else {
  console.log('   ❌ uuid.validator.ts não encontrado');
  validationsOk = false;
}

if (fs.existsSync(pipePath)) {
  const pipeContent = fs.readFileSync(pipePath, 'utf-8');
  if (pipeContent.includes('UUID') || pipeContent.includes('uuid')) {
    console.log('   ✅ uuid-validation.pipe.ts configurado');
  } else {
    console.log('   ⚠️  uuid-validation.pipe.ts pode precisar de revisão');
    validationsOk = false;
  }
} else {
  console.log('   ❌ uuid-validation.pipe.ts não encontrado');
  validationsOk = false;
}

console.log();

// 4. Instruções
console.log('='.repeat(70));
console.log('📋 RESUMO E PRÓXIMOS PASSOS');
console.log('='.repeat(70));
console.log();

if (hasCuid) {
  console.log('❌ AÇÃO NECESSÁRIA: Corrigir Schema Prisma');
  console.log();
  console.log('Execute o seguinte comando para corrigir automaticamente:');
  console.log();
  console.log('   node scripts/fix-schema-uuid.js');
  console.log();
} else if (hasUuid && validationsOk) {
  console.log('✅ CONFIGURAÇÃO CORRETA!');
  console.log();
  console.log('Sua API está configurada para usar APENAS UUID v4.');
  console.log();
  console.log('Para aplicar ao banco de dados:');
  console.log();
  console.log('🔹 Banco NOVO (desenvolvimento):');
  console.log('   npm run prisma:migrate:dev');
  console.log();
  console.log('🔹 Banco EXISTENTE com dados (produção):');
  console.log('   1. Faça backup: pg_dump seu_banco > backup.sql');
  console.log('   2. Execute: psql -d seu_banco < prisma/migrations/production_uuid_migration.sql');
  console.log('   3. Verifique: node scripts/test-uuid-consistency.js');
  console.log();
} else {
  console.log('⚠️  VERIFICAÇÃO NECESSÁRIA');
  console.log();
  console.log('Alguns componentes podem precisar de revisão.');
  console.log('Verifique os arquivos marcados acima.');
  console.log();
}

console.log('='.repeat(70));
console.log();

// 5. Documentação adicional
console.log('📚 DOCUMENTAÇÃO:');
console.log();
console.log('   - Guia completo: MIGRACAO_UUID_GUIA.md');
console.log('   - Script de teste: node scripts/test-uuid-consistency.js');
console.log('   - Verificação do banco: node scripts/check-current-ids.js');
console.log();
console.log('💡 DICA: Para garantir IDs válidos, sempre use @default(uuid()) no schema');
console.log('   e valide os IDs recebidos usando UuidValidationPipe nos controllers.');
console.log();


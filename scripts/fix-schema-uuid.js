#!/usr/bin/env node

/**
 * Script para corrigir automaticamente o schema Prisma
 * Substitui @default(cuid()) por @default(uuid())
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 CORREÇÃO AUTOMÁTICA DO SCHEMA PRISMA');
console.log('='.repeat(70));
console.log();

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

if (!fs.existsSync(schemaPath)) {
  console.error('❌ Arquivo schema.prisma não encontrado!');
  process.exit(1);
}

// Ler o schema
let schemaContent = fs.readFileSync(schemaPath, 'utf-8');

// Verificar se há CUIDs
if (!schemaContent.includes('@default(cuid())')) {
  console.log('✅ Schema já está correto! Nenhuma alteração necessária.');
  console.log('   Todos os IDs já usam @default(uuid())');
  process.exit(0);
}

// Fazer backup
const backupPath = schemaPath + '.backup.' + Date.now();
fs.writeFileSync(backupPath, schemaContent);
console.log(`📦 Backup criado: ${path.basename(backupPath)}`);
console.log();

// Contar substituições
const cuidCount = (schemaContent.match(/@default\(cuid\(\)\)/g) || []).length;

// Substituir cuid() por uuid()
schemaContent = schemaContent.replace(/@default\(cuid\(\)\)/g, '@default(uuid())');

// Salvar
fs.writeFileSync(schemaPath, schemaContent);

console.log('✅ Schema corrigido com sucesso!');
console.log(`   ${cuidCount} ocorrência(s) de @default(cuid()) substituída(s) por @default(uuid())`);
console.log();

console.log('='.repeat(70));
console.log('📋 PRÓXIMOS PASSOS');
console.log('='.repeat(70));
console.log();
console.log('1️⃣  Gerar novo Prisma Client:');
console.log('   npm run prisma:generate');
console.log();
console.log('2️⃣  Criar migration (desenvolvimento):');
console.log('   npm run prisma:migrate:dev --name use_uuid_v4');
console.log();
console.log('3️⃣  OU aplicar em produção:');
console.log('   psql -d seu_banco < prisma/migrations/production_uuid_migration.sql');
console.log();
console.log('4️⃣  Verificar:');
console.log('   node scripts/test-uuid-consistency.js');
console.log();


#!/usr/bin/env node

/**
 * Script para corrigir o erro de exchangedQuantity em produção
 * 
 * Este script:
 * 1. Verifica se o campo exchangedQuantity existe no banco
 * 2. Remove o campo se existir
 * 3. Funciona independente do sistema de migrações do Prisma
 * 
 * Uso:
 *   node scripts/fix-exchanged-quantity.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkColumnExists(columnName) {
  try {
    // Usar Prisma.Prisma.sql para segurança contra SQL injection
    const result = await prisma.$queryRawUnsafe(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'product_exchanges'
         AND column_name = '${columnName.replace(/'/g, "''")}'`
    );
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    console.error(`Erro ao verificar coluna ${columnName}:`, error.message);
    return false;
  }
}

async function removeColumn(columnName) {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "product_exchanges" DROP COLUMN IF EXISTS "${columnName}"`
    );
    console.log(`✅ Coluna ${columnName} removida com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao remover coluna ${columnName}:`, error.message);
    return false;
  }
}

async function getAllColumns() {
  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'product_exchanges'
      ORDER BY ordinal_position`
    );
    return result;
  } catch (error) {
    console.error('Erro ao listar colunas:', error.message);
    return [];
  }
}

async function main() {
  console.log('🔍 Verificando campos problemáticos na tabela product_exchanges...\n');

  const problematicColumns = [
    'originalQuantity',
    'original_quantity',
    'exchangedQuantity',
    'exchanged_quantity',
    'product_id',
    'productId'
  ];

  let foundColumns = [];
  
  // Verificar quais colunas existem
  for (const column of problematicColumns) {
    const exists = await checkColumnExists(column);
    if (exists) {
      foundColumns.push(column);
      console.log(`⚠️  Campo problemático encontrado: ${column}`);
    }
  }

  if (foundColumns.length === 0) {
    console.log('✅ Nenhum campo problemático encontrado. Tudo está correto!');
    console.log('\n📋 Colunas atuais da tabela product_exchanges:');
    const columns = await getAllColumns();
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    return;
  }

  console.log(`\n📊 Total de campos problemáticos encontrados: ${foundColumns.length}`);
  console.log('\n🔧 Iniciando remoção dos campos...\n');

  // Remover colunas encontradas
  let successCount = 0;
  for (const column of foundColumns) {
    const removed = await removeColumn(column);
    if (removed) {
      successCount++;
    }
  }

  console.log(`\n✅ ${successCount} de ${foundColumns.length} campos removidos com sucesso`);

  // Verificar novamente
  console.log('\n🔍 Verificando novamente...');
  let remainingColumns = [];
  for (const column of problematicColumns) {
    const exists = await checkColumnExists(column);
    if (exists) {
      remainingColumns.push(column);
    }
  }

  if (remainingColumns.length === 0) {
    console.log('✅ SUCESSO: Todos os campos problemáticos foram removidos!');
    console.log('\n📋 Colunas finais da tabela product_exchanges:');
    const columns = await getAllColumns();
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    console.log('\n🔄 IMPORTANTE: Reinicie a aplicação para que as mudanças tenham efeito!');
  } else {
    console.log(`⚠️  ATENÇÃO: Ainda existem ${remainingColumns.length} campos problemáticos: ${remainingColumns.join(', ')}`);
    console.log('   Execute o script SQL manualmente: prisma/fix_exchange_fields_standalone.sql');
  }
}

main()
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


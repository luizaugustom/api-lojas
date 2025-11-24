#!/usr/bin/env node

/**
 * Script para registrar migrations no banco de dados
 * 
 * Este script verifica quais migrations estão faltando na tabela _prisma_migrations
 * e as registra automaticamente.
 * 
 * Uso:
 *   node scripts/register-migrations.js
 *   node scripts/register-migrations.js --dry-run  (apenas verifica, não registra)
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Lista de migrations que devem estar registradas
// Adicione aqui as migrations que foram aplicadas manualmente
const MIGRATIONS_TO_REGISTER = [
  '20251124190000_remove_original_quantity_from_exchanges',
  '20251124220000_fix_exchanged_quantity_constraint',
];

async function getRegisteredMigrations() {
  try {
    // Constrói a query com os nomes das migrations
    const placeholders = MIGRATIONS_TO_REGISTER.map((_, i) => `$${i + 1}`).join(', ');
    const query = `
      SELECT "migration_name", "finished_at", "started_at"
      FROM "_prisma_migrations"
      WHERE "migration_name" IN (${placeholders})
      ORDER BY "finished_at" DESC
    `;
    
    const migrations = await prisma.$queryRawUnsafe(query, ...MIGRATIONS_TO_REGISTER);
    return migrations;
  } catch (error) {
    console.error('❌ Erro ao buscar migrations registradas:', error.message);
    return [];
  }
}

async function registerMigration(migrationName) {
  try {
    // Verifica se já está registrada
    const existing = await prisma.$queryRawUnsafe(
      `SELECT "migration_name" FROM "_prisma_migrations" WHERE "migration_name" = $1`,
      migrationName
    );

    if (existing && existing.length > 0) {
      console.log(`ℹ️  Migração ${migrationName} já está registrada`);
      return false;
    }

    // Registra a migration
    await prisma.$executeRawUnsafe(
      `INSERT INTO "_prisma_migrations" (
        "id",
        "checksum",
        "finished_at",
        "migration_name",
        "logs",
        "rolled_back_at",
        "started_at",
        "applied_steps_count"
      ) VALUES (
        gen_random_uuid(),
        '',
        NOW(),
        $1,
        NULL,
        NULL,
        NOW(),
        1
      )`,
      migrationName
    );

    console.log(`✅ Migração ${migrationName} registrada com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao registrar migration ${migrationName}:`, error.message);
    return false;
  }
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('🔍 Verificando migrations...\n');

  try {
    // Verifica migrations registradas
    const registered = await getRegisteredMigrations();
    const registeredNames = registered.map(m => m.migration_name);

    console.log('📋 Migrations registradas:');
    if (registered.length === 0) {
      console.log('   (nenhuma encontrada)\n');
    } else {
      registered.forEach(m => {
        console.log(`   ✅ ${m.migration_name} (${m.finished_at})`);
      });
      console.log();
    }

    // Verifica quais estão faltando
    const missing = MIGRATIONS_TO_REGISTER.filter(
      name => !registeredNames.includes(name)
    );

    if (missing.length === 0) {
      console.log('✅ Todas as migrations já estão registradas!');
      return;
    }

    console.log('📋 Migrations que precisam ser registradas:');
    missing.forEach(name => {
      console.log(`   ⚠️  ${name}`);
    });
    console.log();

    if (isDryRun) {
      console.log('🔍 Modo dry-run: nenhuma alteração será feita');
      return;
    }

    // Registra as migrations faltantes
    console.log('📝 Registrando migrations...\n');
    let successCount = 0;
    let failCount = 0;

    for (const migrationName of missing) {
      const success = await registerMigration(migrationName);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log();
    console.log('='.repeat(70));
    console.log('📊 Resumo:');
    console.log(`   ✅ Registradas: ${successCount}`);
    console.log(`   ❌ Falhas: ${failCount}`);
    console.log(`   ℹ️  Já existentes: ${MIGRATIONS_TO_REGISTER.length - missing.length}`);
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Erro ao processar migrations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});


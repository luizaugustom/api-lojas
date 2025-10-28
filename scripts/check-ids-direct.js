#!/usr/bin/env node

/**
 * Script para verificar IDs diretamente no banco de dados
 * Usa conexão SQL direta, não depende do Prisma Client
 */

const { Client } = require('pg');
require('dotenv').config();

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CUID_REGEX = /^c[a-z0-9]{24}$/i;

function detectIdType(id) {
  if (!id) return 'NULL';
  if (UUID_V4_REGEX.test(id)) return 'UUID v4';
  if (CUID_REGEX.test(id)) return 'CUID';
  if (/^\d+$/.test(id)) return 'INTEGER';
  return 'UNKNOWN';
}

async function main() {
  console.log('🔍 VERIFICAÇÃO DIRETA DE IDs NO BANCO DE DADOS');
  console.log('='.repeat(70));
  console.log();

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    const tables = [
      'admins',
      'companies',
      'sellers',
      'products',
      'customers',
      'sales',
      'sale_items',
      'sale_payment_methods',
      'product_exchanges',
      'bills_to_pay',
      'cash_closures',
      'fiscal_documents',
      'printers',
      'refresh_tokens'
    ];

    const results = [];
    let totalCuid = 0;
    let totalUuid = 0;
    let totalOther = 0;

    for (const table of tables) {
      console.log(`📋 Verificando tabela: ${table}`);
      
      try {
        // Verificar se a tabela existe
        const tableExists = await client.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )`,
          [table]
        );

        if (!tableExists.rows[0].exists) {
          console.log(`   ⚠️  Tabela não existe\n`);
          continue;
        }

        // Contar total de registros
        const countResult = await client.query(`SELECT COUNT(*) as total FROM "${table}"`);
        const total = parseInt(countResult.rows[0].total);

        if (total === 0) {
          console.log(`   ℹ️  Tabela vazia (0 registros)\n`);
          continue;
        }

        // Buscar alguns IDs de exemplo
        const sampleResult = await client.query(
          `SELECT id FROM "${table}" ORDER BY "createdAt" DESC LIMIT 5`
        );

        const types = {};
        const examples = [];

        sampleResult.rows.forEach(row => {
          const idType = detectIdType(row.id);
          types[idType] = (types[idType] || 0) + 1;
          
          if (examples.length < 3) {
            examples.push({ id: row.id, type: idType });
          }
        });

        console.log(`   📊 Total de registros: ${total}`);
        console.log(`   📝 Tipos encontrados:`, types);
        
        if (examples.length > 0) {
          console.log(`   📌 Exemplos:`);
          examples.forEach(ex => {
            const icon = ex.type === 'UUID v4' ? '✅' : '❌';
            console.log(`      ${icon} ${ex.id} (${ex.type})`);
          });
        }

        // Contar por tipo
        if (types['CUID']) totalCuid += types['CUID'];
        if (types['UUID v4']) totalUuid += types['UUID v4'];
        if (types['INTEGER'] || types['UNKNOWN']) totalOther += (types['INTEGER'] || 0) + (types['UNKNOWN'] || 0);

        results.push({
          table,
          total,
          types,
          examples
        });

      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
      }

      console.log();
    }

    // Resumo
    console.log('='.repeat(70));
    console.log('📊 RESUMO GERAL');
    console.log('='.repeat(70));
    console.log();

    if (totalUuid > 0 && totalCuid === 0 && totalOther === 0) {
      console.log('✅ PERFEITO! Todos os IDs são UUID v4');
      console.log(`   Total: ${totalUuid} registros verificados`);
      console.log();
      console.log('🎯 Próximo passo: API já está pronta para usar!');
    } else if (totalCuid > 0) {
      console.log('⚠️  PROBLEMA DETECTADO: IDs CUID encontrados!');
      console.log();
      console.log(`   ❌ CUID: ${totalCuid} registros`);
      console.log(`   ${totalUuid > 0 ? '✅' : '⚠️'} UUID v4: ${totalUuid} registros`);
      if (totalOther > 0) console.log(`   ❌ Outros: ${totalOther} registros`);
      console.log();
      console.log('🔧 SOLUÇÃO: Converter IDs para UUID v4');
      console.log();
      console.log('   Opção 1 - LIMPAR E COMEÇAR DO ZERO (se puder perder os dados):');
      console.log('   ---------------------------------------------------------------');
      console.log('   npm run prisma:reset');
      console.log('   npx prisma migrate dev');
      console.log('   npx prisma generate');
      console.log();
      console.log('   Opção 2 - MANTER DADOS (converter IDs existentes):');
      console.log('   ---------------------------------------------------');
      console.log('   1. BACKUP: pg_dump -U postgres api_lojas > backup.sql');
      console.log('   2. CONVERTER: psql -U postgres -d api_lojas -f prisma/migrations/production_uuid_migration.sql');
      console.log('   3. VERIFICAR: node scripts/check-ids-direct.js');
      console.log();
    } else {
      console.log('⚠️  Formato de IDs desconhecido');
      console.log(`   UUID v4: ${totalUuid}`);
      console.log(`   Outros: ${totalOther}`);
    }

    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Erro ao conectar ao banco:', error.message);
    console.error();
    console.error('Verifique:');
    console.error('  1. PostgreSQL está rodando?');
    console.error('  2. DATABASE_URL no .env está correto?');
    console.error('  3. Banco de dados "api_lojas" existe?');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Erro:', error);
    process.exit(1);
  });


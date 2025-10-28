/**
 * Script para verificar o formato atual dos IDs no banco de dados
 * Este script identifica se os IDs são CUID, UUID ou outro formato
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CUID_REGEX = /^c[a-z0-9]{24}$/i;

function detectIdType(id) {
  if (!id) return 'NULL';
  if (UUID_V4_REGEX.test(id)) return 'UUID v4';
  if (CUID_REGEX.test(id)) return 'CUID';
  if (/^\d+$/.test(id)) return 'INTEGER';
  return 'UNKNOWN';
}

async function checkTable(tableName, model) {
  try {
    console.log(`\n📋 Tabela: ${tableName}`);
    
    const records = await model.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    if (records.length === 0) {
      console.log(`  ⚠️  Nenhum registro encontrado`);
      return { table: tableName, count: 0, types: {} };
    }
    
    const types = {};
    
    records.forEach((record, index) => {
      const idType = detectIdType(record.id);
      types[idType] = (types[idType] || 0) + 1;
      
      if (index === 0) {
        console.log(`  📌 Exemplo de ID: ${record.id}`);
        console.log(`  🔍 Tipo detectado: ${idType}`);
      }
    });
    
    console.log(`  📊 Total de registros verificados: ${records.length}`);
    console.log(`  📈 Tipos encontrados:`, types);
    
    return { table: tableName, count: records.length, types };
  } catch (error) {
    console.log(`  ❌ Erro ao verificar: ${error.message}`);
    return { table: tableName, count: 0, types: {}, error: error.message };
  }
}

async function main() {
  console.log('🔍 VERIFICAÇÃO DE FORMATO DE IDs NO BANCO DE DADOS');
  console.log('='.repeat(70));
  
  const results = [];
  
  // Verificar cada tabela
  results.push(await checkTable('admins', prisma.admin));
  results.push(await checkTable('companies', prisma.company));
  results.push(await checkTable('sellers', prisma.seller));
  results.push(await checkTable('products', prisma.product));
  results.push(await checkTable('sales', prisma.sale));
  results.push(await checkTable('customers', prisma.customer));
  results.push(await checkTable('bills_to_pay', prisma.billToPay));
  results.push(await checkTable('cash_closures', prisma.cashClosure));
  results.push(await checkTable('fiscal_documents', prisma.fiscalDocument));
  results.push(await checkTable('printers', prisma.printer));
  results.push(await checkTable('refresh_tokens', prisma.refreshToken));
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMO GERAL');
  console.log('='.repeat(70));
  
  const summary = {
    'UUID v4': 0,
    'CUID': 0,
    'INTEGER': 0,
    'UNKNOWN': 0,
    'NULL': 0
  };
  
  let hasInconsistency = false;
  
  results.forEach(result => {
    if (result.types) {
      Object.entries(result.types).forEach(([type, count]) => {
        summary[type] = (summary[type] || 0) + count;
      });
    }
    
    // Verificar se há mais de um tipo na mesma tabela
    if (result.types && Object.keys(result.types).length > 1) {
      hasInconsistency = true;
      console.log(`\n⚠️  INCONSISTÊNCIA em ${result.table}:`);
      console.log(`    Múltiplos tipos de ID encontrados:`, result.types);
    }
  });
  
  console.log('\n📈 Total por tipo:');
  Object.entries(summary).forEach(([type, count]) => {
    if (count > 0) {
      const icon = type === 'UUID v4' ? '✅' : '⚠️';
      console.log(`  ${icon} ${type}: ${count} registros`);
    }
  });
  
  console.log('\n' + '='.repeat(70));
  
  if (summary['UUID v4'] > 0 && Object.keys(summary).filter(k => k !== 'UUID v4' && summary[k] > 0).length === 0) {
    console.log('✅ PERFEITO! Todos os IDs são UUID v4');
    console.log('✅ Nenhuma migração necessária');
  } else if (summary['CUID'] > 0) {
    console.log('⚠️  ATENÇÃO: IDs em formato CUID encontrados');
    console.log('📝 Recomendação: Executar migração para UUID v4');
  } else if (hasInconsistency) {
    console.log('❌ PROBLEMA: Formatos inconsistentes de IDs');
    console.log('📝 Recomendação: Padronizar todos os IDs para UUID v4');
  } else if (summary['UNKNOWN'] > 0) {
    console.log('❌ PROBLEMA: IDs em formato desconhecido');
    console.log('📝 Recomendação: Investigar formato e migrar para UUID v4');
  }
  
  console.log('='.repeat(70));
}

main()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


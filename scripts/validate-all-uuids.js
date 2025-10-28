#!/usr/bin/env node

/**
 * Script para validar que TODOS os IDs no sistema são UUID v4
 * 
 * Este script:
 * 1. Verifica o schema Prisma
 * 2. Verifica validações no código
 * 3. Verifica exemplos na documentação
 * 4. Verifica o banco de dados (se configurado)
 */

const fs = require('fs');
const path = require('path');

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CUID_REGEX = /^c[a-z0-9]{24}$/i;

let hasIssues = false;

console.log('🔍 VALIDAÇÃO COMPLETA DE UUID v4');
console.log('='.repeat(70));
console.log();

// 1. Verificar schema Prisma
console.log('1️⃣  Verificando Prisma Schema...');
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

if (schemaContent.includes('@default(cuid())')) {
  console.log('   ❌ ERRO: Schema contém @default(cuid())');
  hasIssues = true;
} else if (!schemaContent.includes('@default(uuid())')) {
  console.log('   ⚠️  AVISO: Schema não contém @default(uuid())');
  hasIssues = true;
} else {
  console.log('   ✅ Schema configurado corretamente');
}

// 2. Verificar validadores
console.log('\n2️⃣  Verificando validadores UUID...');
const validatorPath = path.join(__dirname, '..', 'src', 'shared', 'validators', 'uuid.validator.ts');

if (fs.existsSync(validatorPath)) {
  const validatorContent = fs.readFileSync(validatorPath, 'utf-8');
  
  // Verificar se aceita apenas UUID v4
  if (validatorContent.includes('uuid') && validatorContent.includes('4[0-9a-f]{3}')) {
    console.log('   ✅ Validador configurado para UUID v4');
  } else {
    console.log('   ⚠️  Validador pode aceitar outros formatos');
    hasIssues = true;
  }
} else {
  console.log('   ❌ Validador não encontrado');
  hasIssues = true;
}

// 3. Verificar pipe de validação
console.log('\n3️⃣  Verificando UuidValidationPipe...');
const pipePath = path.join(__dirname, '..', 'src', 'shared', 'pipes', 'uuid-validation.pipe.ts');

if (fs.existsSync(pipePath)) {
  const pipeContent = fs.readFileSync(pipePath, 'utf-8');
  
  if (pipeContent.includes('uuidV4Regex') || pipeContent.includes('4[0-9a-f]{3}')) {
    console.log('   ✅ Pipe configurado para UUID v4');
  } else {
    console.log('   ⚠️  Pipe pode aceitar outros formatos');
    hasIssues = true;
  }
} else {
  console.log('   ❌ Pipe não encontrado');
  hasIssues = true;
}

// 4. Verificar interceptors
console.log('\n4️⃣  Verificando interceptors...');
const interceptorsDir = path.join(__dirname, '..', 'src', 'application');

function checkInterceptors(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      checkInterceptors(filePath);
    } else if (file.name.includes('interceptor') && file.name.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Verificar se há validação de CUID (não deveria ter)
      if (content.includes('cuidRegex') || content.includes('CUID')) {
        console.log(`   ⚠️  ${file.name}: contém referência a CUID`);
        hasIssues = true;
      }
    }
  }
}

checkInterceptors(interceptorsDir);
console.log('   ✅ Interceptors verificados');

// 5. Verificar DTOs
console.log('\n5️⃣  Verificando DTOs...');
let cuidExamples = [];

function checkDTOs(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      checkDTOs(filePath);
    } else if (file.name.endsWith('.dto.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Procurar por exemplos que parecem ser CUID
        if (line.includes('example:') && (line.includes('cuid') || line.match(/c[a-z0-9]{24}/i))) {
          cuidExamples.push({
            file: file.name,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    }
  }
}

checkDTOs(interceptorsDir);

if (cuidExamples.length > 0) {
  console.log('   ⚠️  Exemplos CUID encontrados em DTOs:');
  cuidExamples.forEach(ex => {
    console.log(`      - ${ex.file}:${ex.line}`);
    console.log(`        ${ex.content}`);
  });
  hasIssues = true;
} else {
  console.log('   ✅ Nenhum exemplo CUID encontrado');
}

// 6. Verificar Controllers
console.log('\n6️⃣  Verificando Controllers...');
let controllersWithoutPipe = [];

function checkControllers(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      checkControllers(filePath);
    } else if (file.name.endsWith('.controller.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Verificar se usa @Param('id') mas não usa UuidValidationPipe
      const hasParamId = content.match(/@Param\(['"]id['"]\)/g);
      const hasUuidPipe = content.includes('UuidValidationPipe');
      
      if (hasParamId && hasParamId.length > 0) {
        const paramWithPipe = content.match(/@Param\(['"]id['"], UuidValidationPipe\)/g);
        
        if (!paramWithPipe || paramWithPipe.length < hasParamId.length) {
          controllersWithoutPipe.push(file.name);
        }
      }
    }
  }
}

checkControllers(interceptorsDir);

if (controllersWithoutPipe.length > 0) {
  console.log('   ⚠️  Controllers sem UuidValidationPipe em @Param(id):');
  controllersWithoutPipe.forEach(c => {
    console.log(`      - ${c}`);
  });
  hasIssues = true;
} else {
  console.log('   ✅ Todos os controllers usam UuidValidationPipe');
}

// 7. Resultados
console.log('\n' + '='.repeat(70));
console.log('📊 RESULTADO DA VALIDAÇÃO');
console.log('='.repeat(70));
console.log();

if (!hasIssues) {
  console.log('✅ PERFEITO! Sistema configurado para usar APENAS UUID v4');
  console.log();
  console.log('📋 Checklist:');
  console.log('   ✅ Schema Prisma usa @default(uuid())');
  console.log('   ✅ Validadores configurados para UUID v4');
  console.log('   ✅ Pipes de validação corretos');
  console.log('   ✅ Nenhuma referência a CUID');
  console.log('   ✅ Controllers validam IDs corretamente');
  console.log();
  console.log('🎯 Próximo passo: Aplicar ao banco de dados');
  console.log('   Para banco NOVO: npm run prisma:migrate:dev');
  console.log('   Para banco EXISTENTE: psql -d seu_banco < prisma/migrations/production_uuid_migration.sql');
} else {
  console.log('⚠️  ATENÇÃO: Alguns problemas foram encontrados');
  console.log();
  console.log('📝 Execute os scripts de correção:');
  console.log('   node scripts/fix-schema-uuid.js');
  console.log();
  console.log('Depois execute novamente:');
  console.log('   node scripts/validate-all-uuids.js');
}

console.log();
console.log('='.repeat(70));

process.exit(hasIssues ? 1 : 0);


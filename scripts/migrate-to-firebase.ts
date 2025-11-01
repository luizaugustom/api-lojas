/**
 * Script de migração de arquivos locais para Firebase Storage
 * 
 * Este script migra todos os arquivos da pasta uploads/ para o Firebase Storage
 * e atualiza as referências no banco de dados.
 * 
 * Uso:
 *   npx ts-node scripts/migrate-to-firebase.ts
 * 
 * Opções:
 *   --dry-run    Simula a migração sem fazer alterações
 *   --folder     Migra apenas uma pasta específica (ex: products, logos)
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const prisma = new PrismaClient();

interface MigrationStats {
  totalFiles: number;
  migratedFiles: number;
  failedFiles: number;
  totalSize: number;
  migratedSize: number;
  errors: Array<{ file: string; error: string }>;
}

async function initializeFirebase() {
  if (admin.apps.length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (!projectId || !clientEmail || !privateKey || !storageBucket) {
      throw new Error('Firebase credentials not configured in .env file');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket,
    });

    console.log('✅ Firebase initialized');
  }

  return admin.storage();
}

async function getLocalFiles(uploadsPath: string, folder?: string): Promise<string[]> {
  const targetPath = folder ? path.join(uploadsPath, folder) : uploadsPath;
  
  if (!fs.existsSync(targetPath)) {
    console.log(`⚠️  Directory not found: ${targetPath}`);
    return [];
  }

  const files: string[] = [];

  function scanDirectory(dir: string) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (stat.isFile()) {
        // Adicionar apenas arquivos de imagem
        const ext = path.extname(item).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.pfx', '.p12'].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  scanDirectory(targetPath);
  return files;
}

async function uploadToFirebase(
  storage: admin.storage.Storage,
  localPath: string,
  uploadsPath: string,
): Promise<string> {
  // Obter caminho relativo
  const relativePath = path.relative(uploadsPath, localPath);
  const firebasePath = relativePath.replace(/\\/g, '/'); // Windows para Unix path

  const bucket = storage.bucket();
  const file = bucket.file(firebasePath);

  // Ler arquivo local
  const fileBuffer = fs.readFileSync(localPath);

  // Determinar content type
  const ext = path.extname(localPath).toLowerCase();
  const contentTypeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.pfx': 'application/x-pkcs12',
    '.p12': 'application/x-pkcs12',
  };
  const contentType = contentTypeMap[ext] || 'application/octet-stream';

  // Upload para Firebase
  await file.save(fileBuffer, {
    metadata: {
      contentType,
      metadata: {
        originalPath: localPath,
        migratedAt: new Date().toISOString(),
      },
    },
    public: true,
  });

  // Retornar URL pública
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${firebasePath}`;
  return publicUrl;
}

async function updateDatabaseReferences(oldUrl: string, newUrl: string, dryRun: boolean): Promise<number> {
  let updatedCount = 0;

  // Atualizar produtos
  const productsToUpdate = await prisma.product.findMany({
    where: {
      photos: {
        equals: oldUrl as any,
      },
    },
  });

  if (!dryRun) {
    for (const product of productsToUpdate) {
      const photosArray = Array.isArray((product as any).photos) ? (product as any).photos : []
      const updatedPhotos = photosArray.map((photo: string) => 
        photo === oldUrl ? newUrl : photo
      );

      await prisma.product.update({
        where: { id: product.id },
        data: { photos: JSON.stringify(updatedPhotos) as any },
      });

      updatedCount++;
    }
  } else {
    updatedCount = productsToUpdate.length;
  }

  return updatedCount;
}

async function migrateFiles(options: { dryRun: boolean; folder?: string }) {
  console.log('🚀 Iniciando migração para Firebase Storage\n');

  const uploadsPath = process.env.UPLOAD_PATH || './uploads';
  const stats: MigrationStats = {
    totalFiles: 0,
    migratedFiles: 0,
    failedFiles: 0,
    totalSize: 0,
    migratedSize: 0,
    errors: [],
  };

  try {
    // Inicializar Firebase
    const storage = await initializeFirebase();

    // Obter lista de arquivos
    console.log(`📂 Escaneando pasta: ${uploadsPath}${options.folder ? `/${options.folder}` : ''}`);
    const files = await getLocalFiles(uploadsPath, options.folder);
    stats.totalFiles = files.length;

    console.log(`📊 Encontrados ${files.length} arquivos para migrar\n`);

    if (options.dryRun) {
      console.log('🔍 Modo DRY RUN - Nenhuma alteração será feita\n');
    }

    // Migrar cada arquivo
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileSize = fs.statSync(file).size;
      stats.totalSize += fileSize;

      try {
        console.log(`[${i + 1}/${files.length}] Processando: ${path.basename(file)}`);

        // Construir URL antiga
        const relativePath = path.relative(uploadsPath, file);
        const oldUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;

        if (!options.dryRun) {
          // Upload para Firebase
          const newUrl = await uploadToFirebase(storage, file, uploadsPath);
          console.log(`  ✅ Uploaded: ${newUrl}`);

          // Atualizar referências no banco
          const updatedRecords = await updateDatabaseReferences(oldUrl, newUrl, options.dryRun);
          if (updatedRecords > 0) {
            console.log(`  📝 Atualizados ${updatedRecords} registro(s) no banco`);
          }

          stats.migratedFiles++;
          stats.migratedSize += fileSize;
        } else {
          console.log(`  🔍 Seria migrado: ${oldUrl}`);
          stats.migratedFiles++;
          stats.migratedSize += fileSize;
        }
      } catch (error) {
        stats.failedFiles++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        stats.errors.push({ file, error: errorMsg });
        console.log(`  ❌ Erro: ${errorMsg}`);
      }

      console.log('');
    }

    // Relatório final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO DE MIGRAÇÃO');
    console.log('='.repeat(60));
    console.log(`Total de arquivos:     ${stats.totalFiles}`);
    console.log(`Migrados com sucesso:  ${stats.migratedFiles}`);
    console.log(`Falhas:                ${stats.failedFiles}`);
    console.log(`Tamanho total:         ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Tamanho migrado:       ${(stats.migratedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('='.repeat(60));

    if (stats.errors.length > 0) {
      console.log('\n❌ ERROS:');
      stats.errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.file}`);
        console.log(`   ${err.error}\n`);
      });
    }

    if (options.dryRun) {
      console.log('\n🔍 Modo DRY RUN - Execute sem --dry-run para aplicar as alterações');
    } else if (stats.migratedFiles > 0) {
      console.log('\n✅ Migração concluída com sucesso!');
      console.log('💡 Dica: Faça backup da pasta uploads/ antes de deletá-la');
    }

  } catch (error) {
    console.error('\n❌ Erro durante migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse argumentos da linha de comando
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  folder: args.find(arg => arg.startsWith('--folder='))?.split('=')[1],
};

// Executar migração
migrateFiles(options)
  .then(() => {
    console.log('\n✨ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });


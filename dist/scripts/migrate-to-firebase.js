"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const client_1 = require("@prisma/client");
const admin = require("firebase-admin");
const dotenv = require("dotenv");
dotenv.config();
const prisma = new client_1.PrismaClient();
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
async function getLocalFiles(uploadsPath, folder) {
    const targetPath = folder ? path.join(uploadsPath, folder) : uploadsPath;
    if (!fs.existsSync(targetPath)) {
        console.log(`⚠️  Directory not found: ${targetPath}`);
        return [];
    }
    const files = [];
    function scanDirectory(dir) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                scanDirectory(fullPath);
            }
            else if (stat.isFile()) {
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
async function uploadToFirebase(storage, localPath, uploadsPath) {
    const relativePath = path.relative(uploadsPath, localPath);
    const firebasePath = relativePath.replace(/\\/g, '/');
    const bucket = storage.bucket();
    const file = bucket.file(firebasePath);
    const fileBuffer = fs.readFileSync(localPath);
    const ext = path.extname(localPath).toLowerCase();
    const contentTypeMap = {
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
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${firebasePath}`;
    return publicUrl;
}
async function updateDatabaseReferences(oldUrl, newUrl, dryRun) {
    let updatedCount = 0;
    const productsToUpdate = await prisma.product.findMany({
        where: {
            photos: {
                has: oldUrl,
            },
        },
    });
    if (!dryRun) {
        for (const product of productsToUpdate) {
            const updatedPhotos = product.photos.map(photo => photo === oldUrl ? newUrl : photo);
            await prisma.product.update({
                where: { id: product.id },
                data: { photos: updatedPhotos },
            });
            updatedCount++;
        }
    }
    else {
        updatedCount = productsToUpdate.length;
    }
    return updatedCount;
}
async function migrateFiles(options) {
    console.log('🚀 Iniciando migração para Firebase Storage\n');
    const uploadsPath = process.env.UPLOAD_PATH || './uploads';
    const stats = {
        totalFiles: 0,
        migratedFiles: 0,
        failedFiles: 0,
        totalSize: 0,
        migratedSize: 0,
        errors: [],
    };
    try {
        const storage = await initializeFirebase();
        console.log(`📂 Escaneando pasta: ${uploadsPath}${options.folder ? `/${options.folder}` : ''}`);
        const files = await getLocalFiles(uploadsPath, options.folder);
        stats.totalFiles = files.length;
        console.log(`📊 Encontrados ${files.length} arquivos para migrar\n`);
        if (options.dryRun) {
            console.log('🔍 Modo DRY RUN - Nenhuma alteração será feita\n');
        }
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileSize = fs.statSync(file).size;
            stats.totalSize += fileSize;
            try {
                console.log(`[${i + 1}/${files.length}] Processando: ${path.basename(file)}`);
                const relativePath = path.relative(uploadsPath, file);
                const oldUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;
                if (!options.dryRun) {
                    const newUrl = await uploadToFirebase(storage, file, uploadsPath);
                    console.log(`  ✅ Uploaded: ${newUrl}`);
                    const updatedRecords = await updateDatabaseReferences(oldUrl, newUrl, options.dryRun);
                    if (updatedRecords > 0) {
                        console.log(`  📝 Atualizados ${updatedRecords} registro(s) no banco`);
                    }
                    stats.migratedFiles++;
                    stats.migratedSize += fileSize;
                }
                else {
                    console.log(`  🔍 Seria migrado: ${oldUrl}`);
                    stats.migratedFiles++;
                    stats.migratedSize += fileSize;
                }
            }
            catch (error) {
                stats.failedFiles++;
                const errorMsg = error instanceof Error ? error.message : String(error);
                stats.errors.push({ file, error: errorMsg });
                console.log(`  ❌ Erro: ${errorMsg}`);
            }
            console.log('');
        }
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
        }
        else if (stats.migratedFiles > 0) {
            console.log('\n✅ Migração concluída com sucesso!');
            console.log('💡 Dica: Faça backup da pasta uploads/ antes de deletá-la');
        }
    }
    catch (error) {
        console.error('\n❌ Erro durante migração:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
const args = process.argv.slice(2);
const options = {
    dryRun: args.includes('--dry-run'),
    folder: args.find(arg => arg.startsWith('--folder='))?.split('=')[1],
};
migrateFiles(options)
    .then(() => {
    console.log('\n✨ Script finalizado');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
});
//# sourceMappingURL=migrate-to-firebase.js.map
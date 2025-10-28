/**
 * Script para resetar preferências de notificação existentes para valores padrão (desativado)
 * Execute: node scripts/reset-notification-preferences.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Resetando preferências de notificação para padrões desativados...\n');

  try {
    // Atualizar todas as preferências existentes para false
    const result = await prisma.notificationPreference.updateMany({
      data: {
        stockAlerts: false,
        billReminders: false,
        weeklyReports: false,
        salesAlerts: false,
        systemUpdates: false,
        emailEnabled: false,
        inAppEnabled: false,
      },
    });

    console.log(`✅ ${result.count} preferências de notificação foram resetadas.\n`);
    
    // Mostrar estatísticas
    const total = await prisma.notificationPreference.count();
    console.log(`📊 Total de preferências no banco: ${total}`);
    
  } catch (error) {
    console.error('❌ Erro ao resetar preferências:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n✨ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });


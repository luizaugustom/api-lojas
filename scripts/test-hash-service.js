const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function testHashService() {
  try {
    console.log('🧪 Testando HashService...');
    
    // Testar bcrypt diretamente
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('✅ Hash gerado:', hashedPassword);
    
    // Testar verificação
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log('✅ Verificação:', isValid);
    
    // Testar conexão com banco
    const prisma = new PrismaClient();
    const admin = await prisma.admin.findFirst();
    console.log('✅ Conexão com banco OK, admin encontrado:', admin?.login);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testHashService();



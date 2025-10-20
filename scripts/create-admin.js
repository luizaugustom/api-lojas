const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔍 Verificando se já existe um admin...');
    
    // Verificar se já existe um admin
    const existingAdmin = await prisma.admin.findFirst();
    
    if (existingAdmin) {
      console.log('✅ Admin já existe:', existingAdmin.login);
      return;
    }
    
    console.log('📝 Criando admin inicial...');
    
    // Criar admin inicial
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.admin.create({
      data: {
        login: 'admin@admin.com',
        password: hashedPassword,
      },
    });
    
    console.log('✅ Admin criado com sucesso!');
    console.log('📧 Login:', admin.login);
    console.log('🔑 Senha: admin123');
    console.log('🆔 ID:', admin.id);
    
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();



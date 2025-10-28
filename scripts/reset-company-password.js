const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    // Buscar a empresa pelo email/login
    const companyLogin = 'empresa@montshop.com';
    const newPassword = '123456'; // Senha padrão
    
    console.log(`Procurando empresa com login: ${companyLogin}`);
    
    const company = await prisma.company.findUnique({
      where: { login: companyLogin }
    });
    
    if (!company) {
      console.error('❌ Empresa não encontrada!');
      console.log('\nEmpresas disponíveis:');
      const companies = await prisma.company.findMany({
        select: { id: true, login: true, name: true }
      });
      companies.forEach(c => {
        console.log(`  - ${c.name} (${c.login})`);
      });
      return;
    }
    
    console.log(`✓ Empresa encontrada: ${company.name}`);
    console.log(`  ID: ${company.id}`);
    console.log(`  Login: ${company.login}`);
    
    // Gerar hash da nova senha
    console.log(`\nGerando hash para nova senha: ${newPassword}`);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualizar senha
    await prisma.company.update({
      where: { id: company.id },
      data: { password: hashedPassword }
    });
    
    console.log('\n✅ Senha resetada com sucesso!');
    console.log(`\nCredenciais de login:`);
    console.log(`  Login: ${company.login}`);
    console.log(`  Senha: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();


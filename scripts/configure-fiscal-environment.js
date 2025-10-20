const fs = require('fs');
const path = require('path');

async function configureFiscalEnvironment() {
  try {
    console.log('🔧 Configurando ambiente fiscal para teste...\n');

    // 1. Verificar se arquivo .env existe
    const envPath = path.join(process.cwd(), '.env');
    const envExists = fs.existsSync(envPath);

    if (!envExists) {
      console.log('❌ Arquivo .env não encontrado');
      console.log('   Copie o arquivo env.example para .env primeiro');
      return;
    }

    // 2. Ler arquivo .env atual
    let envContent = fs.readFileSync(envPath, 'utf8');

    // 3. Adicionar configurações fiscais se não existirem
    const fiscalConfigs = [
      '# Configuração da API Fiscal',
      'FISCAL_PROVIDER=mock',
      'FISCAL_ENVIRONMENT=sandbox',
      '',
      '# NFE.io (descomente para usar)',
      '# NFEIO_BASE_URL=https://api.nfe.io/v1',
      '# NFEIO_API_KEY=sua_chave_api_aqui',
      '',
      '# TecnoSpeed (descomente para usar)',
      '# TECNOSPEED_BASE_URL=https://api.tecnospeed.com.br',
      '# TECNOSPEED_API_KEY=sua_chave_api_aqui',
      '',
      '# Focus NFE (descomente para usar)',
      '# FOCUSNFE_BASE_URL=https://homologacao.focusnfe.com.br',
      '# FOCUSNFE_API_KEY=sua_chave_api_aqui',
      '',
      '# Enotas (descomente para usar)',
      '# ENOTAS_BASE_URL=https://app.enotas.com.br/api',
      '# ENOTAS_API_KEY=sua_chave_api_aqui',
      '',
      '# Certificado Digital',
      'FISCAL_CERTIFICATE_PATH=./certificates/cert.p12',
      'FISCAL_CERTIFICATE_PASSWORD=senha123',
      '',
      '# Configurações Avançadas',
      'FISCAL_TIMEOUT=30000',
      'FISCAL_MAX_RETRIES=3',
      'FISCAL_RETRY_INTERVAL=1000',
    ];

    // Verificar se configurações já existem
    const hasFiscalConfig = envContent.includes('FISCAL_PROVIDER');
    
    if (!hasFiscalConfig) {
      console.log('📝 Adicionando configurações fiscais ao .env...');
      envContent += '\n' + fiscalConfigs.join('\n');
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Configurações fiscais adicionadas!');
    } else {
      console.log('✅ Configurações fiscais já existem no .env');
    }

    // 4. Criar diretório de certificados se não existir
    const certDir = path.join(process.cwd(), 'certificates');
    if (!fs.existsSync(certDir)) {
      console.log('\n📁 Criando diretório de certificados...');
      fs.mkdirSync(certDir, { recursive: true });
      console.log('✅ Diretório certificates criado!');
    } else {
      console.log('✅ Diretório certificates já existe');
    }

    // 5. Criar certificado de teste (mock)
    const certPath = path.join(certDir, 'cert.p12');
    if (!fs.existsSync(certPath)) {
      console.log('\n🔐 Criando certificado de teste...');
      const mockCertContent = 'Mock Certificate for Testing';
      fs.writeFileSync(certPath, mockCertContent);
      console.log('✅ Certificado de teste criado!');
    } else {
      console.log('✅ Certificado já existe');
    }

    // 6. Mostrar configuração atual
    console.log('\n📋 Configuração atual:');
    console.log('   FISCAL_PROVIDER: mock');
    console.log('   FISCAL_ENVIRONMENT: sandbox');
    console.log('   FISCAL_CERTIFICATE_PATH: ./certificates/cert.p12');
    console.log('   FISCAL_CERTIFICATE_PASSWORD: senha123');

    console.log('\n🎉 Configuração concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Para usar API real, descomente as linhas do provedor desejado');
    console.log('   2. Configure sua chave de API real');
    console.log('   3. Substitua o certificado de teste pelo certificado real');
    console.log('   4. Teste a integração: node scripts/test-fiscal-api-integration.js');

    console.log('\n🔗 Provedores disponíveis:');
    console.log('   - NFE.io: https://nfe.io');
    console.log('   - TecnoSpeed: https://tecnospeed.com.br');
    console.log('   - Focus NFE: https://focusnfe.com.br');
    console.log('   - Enotas: https://enotas.com.br');

  } catch (error) {
    console.error('❌ Erro durante configuração:', error);
  }
}

// Executar configuração
configureFiscalEnvironment();

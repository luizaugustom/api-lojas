# 🚀 Guia de Configuração da API - MontShop

Este guia explica como configurar corretamente as variáveis de ambiente da API.

## 📋 Pré-requisitos

Antes de começar, você precisará ter:

1. **PostgreSQL** instalado e rodando
2. **Node.js** (v18 ou superior)
3. Conta no **Focus NFe** para emissão de notas fiscais
4. Conta no **Firebase** para armazenamento de imagens
5. (Opcional) Servidor SMTP para envio de e-mails

## 🔧 Configuração Inicial

### 1. Copiar o arquivo de exemplo

```bash
cp env.example .env
```

### 2. Configurar o Banco de Dados

Edite o arquivo `.env` e configure a URL do PostgreSQL:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/montshop?schema=public
```

**Exemplo prático:**
```env
DATABASE_URL=postgresql://postgres:minhasenha@localhost:5432/montshop?schema=public
```

### 3. Configurar Segurança

#### JWT Secret
Gere uma chave secreta forte. Use o comando no terminal:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copie o resultado e cole no `.env`:
```env
JWT_SECRET=sua-chave-gerada-aqui
```

### 4. Configurar Focus NFe (Emissão de Notas Fiscais)

⚠️ **IMPORTANTE**: A API Key do Focus NFe é compartilhada entre TODAS as empresas do sistema.

#### Passos:

1. Acesse [https://focusnfe.com.br](https://focusnfe.com.br)
2. Crie uma conta ou faça login
3. No painel, copie sua **API Key**
4. Configure no `.env`:

```env
FISCAL_PROVIDER=focusnfe
FOCUSNFE_API_KEY=sua-api-key-aqui
```

#### Ambiente de Homologação (Testes):
```env
FOCUSNFE_BASE_URL=https://homologacao.focusnfe.com.br
FISCAL_ENVIRONMENT=sandbox
```

#### Ambiente de Produção (Emissão Real):
```env
FOCUSNFE_BASE_URL=https://api.focusnfe.com.br
FISCAL_ENVIRONMENT=production
```

#### Configuração por Empresa

Os seguintes dados são configurados **individualmente para cada empresa** através da interface web:

- CNPJ da empresa
- Regime tributário (Simples Nacional, Lucro Presumido, etc.)
- CSC (Código de Segurança do Contribuinte)
- Série da NFC-e
- Certificado Digital A1 (se necessário)
- Código IBGE do município

### 5. Configurar Firebase Storage

O Firebase é usado para armazenar as imagens dos produtos.

#### Passos:

1. Acesse [https://console.firebase.google.com](https://console.firebase.google.com)
2. Crie um novo projeto ou selecione um existente
3. Vá em **Configurações do Projeto** → **Contas de Serviço**
4. Clique em **Gerar nova chave privada**
5. Um arquivo JSON será baixado

#### Configure no `.env`:

```env
FIREBASE_PROJECT_ID=seu-projeto-123456
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
```

⚠️ **Atenção**: Mantenha as quebras de linha (`\n`) na chave privada!

#### Configurar Regras de Segurança no Firebase:

No console do Firebase, vá em **Storage** → **Rules** e configure:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 6. Configurar Email (SMTP)

#### Para Gmail:

1. Ative a **Verificação em 2 etapas** na sua conta Google
2. Gere uma **Senha de App**:
   - Acesse [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Gere uma senha para "Email"
   - Use essa senha no `.env`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app-aqui
```

#### Para outros provedores:

Consulte a documentação do seu provedor de email para obter as configurações SMTP.

### 7. Configurações Opcionais

#### WhatsApp Business API
Se você tem integração com WhatsApp:

```env
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_TOKEN=seu-token
```

#### N8N (Automações)
Para webhooks e automações:

```env
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/seu-id
```

#### IBPT (Impostos Aproximados)
Para cálculo automático de impostos:

```env
IBPT_TOKEN=seu-token-ibpt
```

## 🎯 Executar a Aplicação

### 1. Instalar dependências:

```bash
npm install
```

### 2. Gerar o Prisma Client:

```bash
npm run db:generate
```

### 3. Executar as migrations:

```bash
npm run db:migrate
```

### 4. (Opcional) Popular o banco com dados iniciais:

```bash
npm run db:seed
```

### 5. Iniciar o servidor:

**Desenvolvimento:**
```bash
npm run start:dev
```

**Produção:**
```bash
npm run build
npm run start:prod
```

## 🔍 Verificar Configuração

Após iniciar o servidor, acesse:

- **API**: http://localhost:3000
- **Documentação (Swagger)**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health

## ⚠️ Avisos Importantes

### Segurança:

1. **NUNCA** commite o arquivo `.env` no Git
2. Use senhas fortes e únicas
3. Em produção, configure HTTPS
4. Mantenha as dependências atualizadas

### Focus NFe:

1. Um único plano do Focus NFe serve para todas as empresas
2. Cada empresa deve ter seus dados fiscais configurados individualmente
3. Certifique-se de ter um plano adequado para o volume de notas
4. Use o ambiente de homologação para testes

### Firebase:

1. Configure limites de uso no console do Firebase
2. Monitore o armazenamento usado
3. Configure regras de segurança adequadas

### Banco de Dados:

1. Faça backups regulares em produção
2. Use conexão SSL/TLS em produção
3. Configure limites de conexão adequados

## 🆘 Problemas Comuns

### Erro de conexão com o banco:
- Verifique se o PostgreSQL está rodando
- Confirme usuário e senha
- Verifique se o banco existe

### Erro na autenticação JWT:
- Gere uma nova JWT_SECRET
- Limpe os tokens antigos

### Erro no Firebase:
- Verifique se a chave privada está correta (com `\n`)
- Confirme as permissões da conta de serviço
- Verifique as regras de segurança do Storage

### Erro no Focus NFe:
- Confirme a API Key
- Verifique o ambiente (sandbox/production)
- Confirme os dados fiscais da empresa

## 📞 Suporte

Para mais informações sobre cada serviço:

- **Focus NFe**: [https://focusnfe.com.br/doc](https://focusnfe.com.br/doc)
- **Firebase**: [https://firebase.google.com/docs](https://firebase.google.com/docs)
- **Prisma**: [https://www.prisma.io/docs](https://www.prisma.io/docs)
- **NestJS**: [https://docs.nestjs.com](https://docs.nestjs.com)

---

Desenvolvido por **MONT Tecnologia da Informação**


# 🚀 Guia Completo de Deploy em Produção - API MontShop

Este guia contém instruções detalhadas para fazer o deploy da API MontShop em produção, incluindo recomendações de serviços e passo a passo detalhado para o Render.com e DigitalOcean.

---

## 📋 Índice

1. [Serviços Recomendados para Produção](#serviços-recomendados)
2. [Deploy no Render.com](#deploy-no-render)
3. [Deploy na DigitalOcean](#deploy-na-digitalocean)
4. [Alternativas de Hospedagem](#alternativas-de-hospedagem)
5. [Checklist Final](#checklist-final)

---

## 🔧 Serviços Recomendados para Produção

### 🗄️ Banco de Dados PostgreSQL

A API MontShop requer PostgreSQL. Seguem opções recomendadas:

#### Opção 1: Render PostgreSQL (Recomendado para começar)
- **Custo**: Free (testes) ou US$ 7/mês (Starter)
- **Vantagens**: Integração fácil com Render, backup automático, SSL incluído
- **Limitações**: Free expira após 90 dias inativos
- **Link**: [render.com](https://render.com)

#### Opção 2: Supabase (Recomendado para produção)
- **Custo**: Free (500MB, 2GB bandwidth) ou US$ 25/mês (Pro)
- **Vantagens**: PostgreSQL gerenciado, dashboard excelente, row-level security, APIs auto-geradas
- **Recursos**: Realtime subscriptions, storage integrado, auth built-in
- **Link**: [supabase.com](https://supabase.com)

#### Opção 3: Neon (Serverless PostgreSQL)
- **Custo**: Free (3GB storage, 5GB transfer) ou US$ 19/mês (Launch)
- **Vantagens**: Serverless, scale-to-zero, branching (copiar banco instantaneamente)
- **Bom para**: Ambientes que precisam escalar automaticamente
- **Link**: [neon.tech](https://neon.tech)

#### Opção 4: DigitalOcean Managed Database
- **Custo**: US$ 15/mês (starter)
- **Vantagens**: SSD, backups diários, alta disponibilidade opcional
- **Bom para**: Aplicações com muitos dados e necessidade de performance
- **Link**: [digitalocean.com](https://digitalocean.com)

#### Opção 5: AWS RDS PostgreSQL
- **Custo**: ~US$ 25/mês (db.t3.micro)
- **Vantagens**: AWS ecosystem, alta disponibilidade, multi-região
- **Bom para**: Grandes empresas já usando AWS
- **Link**: [aws.amazon.com](https://aws.amazon.com)

### 🖥️ Hospedagem da API

#### Opção 1: Render (Recomendado para começar)
- **Custo**: Free (testes) ou US$ 7/mês (Starter)
- **Vantagens**: Deploy automático do GitHub, SSL grátis, fácil configuração
- **Link**: [render.com](https://render.com)

#### Opção 2: Railway
- **Custo**: Free (US$ 5 créditos/mês) ou US$ 20/mês (Pro)
- **Vantagens**: Deploy rápido, PostgreSQL incluído, preview deploys
- **Link**: [railway.app](https://railway.app)

#### Opção 3: DigitalOcean App Platform
- **Custo**: US$ 5/mês (basic)
- **Vantagens**: Escalável, integração com DigitalOcean databases
- **Link**: [digitalocean.com](https://digitalocean.com)

#### Opção 4: Fly.io
- **Custo**: Generous free tier
- **Vantagens**: Multi-região, edge computing, global distribution
- **Link**: [fly.io](https://fly.io)

---

## 🚀 Deploy no Render.com

### Passo 1: Preparar o Repositório

#### 1.1 Verificar Arquivos Essenciais

Certifique-se de que os seguintes arquivos estão na pasta `api-lojas/`:

```
api-lojas/
├── package.json          ✅ Scripts de produção
├── render.yaml           ✅ Configuração do Render
├── Dockerfile            ✅ Container (opcional)
├── healthcheck.js        ✅ Health check
├── prisma/
│   └── schema.prisma     ✅ Schema do banco
├── .gitignore            ✅ Exclusões corretas
└── src/                  ✅ Código fonte
```

#### 1.2 Commit e Push

```bash
# Certifique-se de estar no diretório raiz do projeto
cd MontShop

# Adicione todos os arquivos
git add .

# Commit
git commit -m "feat: prepara API para produção"

# Push para o GitHub
git push origin main
```

---

### Passo 2: Criar Conta no Render

1. Acesse [render.com](https://render.com)
2. Clique em **"Get Started"**
3. Faça login com sua conta GitHub
4. Autorize o Render a acessar seus repositórios

---

### Passo 3: Criar Banco de Dados PostgreSQL

1. No Dashboard do Render, clique em **"New +"** no canto superior direito
2. Selecione **"PostgreSQL"**
3. Preencha os campos:
   
   **Configurações Básicas:**
   - **Name**: `montshop-db` (identificador único no Render)
   - **Database**: `montshop` (nome do banco)
   - **User**: `montshop_user` (usuário do banco)
   - **Region**: Escolha a região mais próxima:
     - **Oregon** (EUA Oeste) - Melhor latência para Brasil
     - **Frankfurt** (Europa)
     - **Singapore** (Ásia)
   
   **Configurações Avançadas:**
   - **PostgreSQL Version**: `15` (recomendado) ou `16`
   - **Plan**: 
     - **Free**: Para testes (⚠️ expira após 90 dias de inatividade)
     - **Starter**: US$ 7/mês (recomendado para produção)
       - 1GB RAM, 10GB disco, backup diário

4. Clique em **"Create Database"**

5. **⚠️ IMPORTANTE**: Anote as credenciais que aparecem:
   - **Internal Database URL**: `postgresql://montshop_user:***@dpg-xxx/montshop`
   - **External Database URL**: Similar, para conexão externa
   
   💡 **Dica**: Copie essas URLs - você precisará delas depois!

---

### Passo 4: Criar Serviço Web (API)

#### Opção A: Usar Blueprint (render.yaml) - RECOMENDADO

1. No Dashboard, clique em **"New +"** → **"Blueprint"**
2. Conecte seu repositório GitHub:
   - Clique em **"Connect GitHub"** (se ainda não conectou)
   - Autorize o Render
   - Selecione o repositório **MontShop**
3. O Render detectará automaticamente o arquivo `api-lojas/render.yaml`
4. Review das configurações:
   - **Resource Group**: Deixe vazio ou crie um novo
   - **Services**: Render criará automaticamente:
     - ✅ `montshop-api` (Web Service)
     - ✅ `montshop-db` (PostgreSQL)
5. Clique em **"Apply"** para criar os serviços

O Render criará automaticamente:
- ✅ Serviço Web da API
- ✅ Banco de Dados PostgreSQL (se não existir)
- ✅ Variáveis de ambiente conectadas ao banco
- ✅ SSL automático
- ✅ Deploy automático do GitHub

#### Opção B: Criar Manualmente

Se preferir criar manualmente:

1. Clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub (se ainda não conectou)
3. Selecione o repositório **MontShop**
4. Configure o serviço:
   
   **Configurações Básicas:**
   - **Name**: `montshop-api`
   - **Region**: **Mesma região do banco de dados**
   - **Branch**: `main` (ou sua branch principal)
   - **Root Directory**: `api-lojas` ⚠️ IMPORTANTE!
   
   **Build & Deploy:**
   - **Runtime**: `Node`
   - **Build Command**: 
     ```bash
     npm ci && npm run db:generate && npm run build
     ```
   - **Start Command**: 
     ```bash
     npm run start:prod
     ```
   
   **Plan:**
   - **Free**: Para testes (pode dormir após 15 min de inatividade)
   - **Starter**: US$ 7/mês (recomendado para produção)
     - 512MB RAM, 1GB SSD
   
   **Health Check** (em Advanced):
   - **Health Check Path**: `/health`
   - **Health Check Grace Period**: `60` segundos

5. Clique em **"Create Web Service"**

---

### Passo 5: Configurar Variáveis de Ambiente

Acesse o serviço `montshop-api` criado e vá em **"Environment"**.

#### 5.1 Variáveis Obrigatórias

##### Banco de Dados (Link com o Render)
Se você criou via Blueprint, o `DATABASE_URL` já está configurado automaticamente!

Se criou manualmente, adicione:
```
Key: DATABASE_URL
Value: [cole o Internal Database URL do banco criado no Passo 3]
```

##### Autenticação JWT
```
Key: JWT_SECRET
Value: [gere uma chave segura]
```

Para gerar uma chave segura, execute:
```bash
# No terminal local
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copie o resultado e cole no valor da variável.

##### CORS (Origens Permitidas)
```
Key: CORS_ORIGIN
Value: https://seu-frontend.com,https://www.seu-frontend.com
```

⚠️ **IMPORTANTE**: 
- Substitua pela URL real do seu frontend
- Para desenvolvimento, pode usar `*` (não recomendado em produção)
- Para múltiplos domínios, separe por vírgula

##### Servidor
```
Key: NODE_ENV
Value: production
```

A variável `PORT` é definida automaticamente pelo Render - não precisa configurar!

#### 5.2 Focus NFe (Notas Fiscais)

```
Key: FOCUSNFE_API_KEY
Value: [sua API key do Focus NFe]
```

```
Key: FOCUSNFE_BASE_URL
Value: https://api.focusnfe.com.br
```

```
Key: FISCAL_ENVIRONMENT
Value: production
```

```
Key: FISCAL_PROVIDER
Value: focusnfe
```

📝 **Como obter API Key do Focus NFe**:
1. Acesse [focusnfe.com.br](https://focusnfe.com.br)
2. Crie uma conta
3. No painel, vá em **"Integração"** → **"API Keys"**
4. Clique em **"Nova API Key"**
5. Copie a chave gerada

⚠️ **Nota**: Escolha um plano adequado ao seu volume de emissões.

#### 5.3 Firebase Storage (Imagens)

```
Key: FIREBASE_PROJECT_ID
Value: uploadsmontshop-f3f7f
```

```
Key: FIREBASE_CLIENT_EMAIL
Value: firebase-adminsdk-fbsvc@uploadsmontshop-f3f7f.iam.gserviceaccount.com
```

```
Key: FIREBASE_PRIVATE_KEY
Value: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDPv98S2PUCZzfn\n...\n-----END PRIVATE KEY-----\n"
```

⚠️ **IMPORTANTE**: A chave privada deve manter as quebras de linha `\n`. Cole toda a chave entre aspas duplas.

```
Key: FIREBASE_STORAGE_BUCKET
Value: gs://uploadsmontshop-f3f7f.firebasestorage.app
```

📝 **Como obter credenciais do Firebase**:
1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto (ou crie um novo)
3. Vá em **⚙️ Project Settings** → **Service Accounts**
4. Clique em **"Generate New Private Key"**
5. Baixe o JSON
6. Extraia os valores necessários:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - Storage bucket → `FIREBASE_STORAGE_BUCKET`

#### 5.4 Variáveis Opcionais

##### Rate Limiting
```
Key: THROTTLE_TTL
Value: 60
```

```
Key: THROTTLE_LIMIT
Value: 100
```

Estas definem: máximo de 100 requisições a cada 60 segundos por IP.

##### Email (SMTP) - Opcional
```
Key: SMTP_HOST
Value: smtp.gmail.com
```

```
Key: SMTP_PORT
Value: 587
```

```
Key: SMTP_SECURE
Value: false
```

```
Key: SMTP_USER
Value: seu-email@gmail.com
```

```
Key: SMTP_PASS
Value: [senha de app do Gmail]
```

📝 **Para Gmail**:
1. Ative a verificação em 2 etapas: [myaccount.google.com](https://myaccount.google.com)
2. Gere uma "Senha de App": [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use a senha gerada no `SMTP_PASS`

---

### Passo 6: Executar Migrações do Banco de Dados

Após configurar todas as variáveis, execute as migrações:

#### 6.1 Conectar ao Shell do Render

1. No serviço `montshop-api`, clique na aba **"Shell"**
2. Aguarde o shell carregar

#### 6.2 Gerar Cliente Prisma

```bash
npm run db:generate
```

Esperado:
```
✔ Generated Prisma Client
```

#### 6.3 Executar Migrações

```bash
npm run db:migrate:deploy
```

Esperado:
```
✔ Migrations applied successfully
```

⚠️ **IMPORTANTE**: Use `db:migrate:deploy` em produção. NUNCA use `db:push` ou `db:migrate dev`.

#### 6.4 (Opcional) Popular Dados Iniciais

Se você tem um seed:
```bash
npm run db:seed
```

---

### Passo 7: Verificar o Deploy

#### 7.1 Verificar Logs

1. Na aba **"Logs"** do serviço
2. Procure pela mensagem:
   ```
   🚀 Application is running on: http://localhost:10000
   📚 Swagger documentation: http://localhost:10000/api/docs
   ```

Se houver erros, verifique:
- Variáveis de ambiente configuradas corretamente
- Migrações executadas
- Build bem-sucedido

#### 7.2 Testar Endpoints

O Render fornece uma URL automática, por exemplo:
`https://montshop-api.onrender.com`

Teste os seguintes endpoints:

**Health Check:**
```bash
curl https://montshop-api.onrender.com/health
```

Esperado:
```json
{
  "status": "ok",
  "timestamp": "2025-01-XX...",
  "uptime": 123.45,
  "environment": "production"
}
```

**Documentação Swagger:**
Acesse no navegador:
```
https://montshop-api.onrender.com/api/docs
```

#### 7.3 Verificar Banco de Dados

Use o **Shell** do Render:

```bash
npx prisma studio
```

⚠️ **Nota**: Prisma Studio não funciona no Render Shell. Use alternativas:

**Alternativa 1: DBeaver (Grátis, Cross-platform)**
- Download: [dbeaver.io](https://dbeaver.io)
- Conecte usando a **External Database URL**

**Alternativa 2: TablePlus (Mac/Windows, Grátis)**
- Download: [tableplus.com](https://tableplus.com)
- Conecte usando a **External Database URL**

**Alternativa 3: pgAdmin (Grátis, Open source)**
- Download: [pgadmin.org](https://pgadmin.org)

---

### Passo 8: Configurar Domínio Customizado (Opcional)

#### 8.1 Adicionar Domínio

1. No serviço `montshop-api`, vá em **"Settings"**
2. Role até **"Custom Domains"**
3. Clique em **"Add Custom Domain"**
4. Digite seu domínio: `api.seudominio.com`

#### 8.2 Configurar DNS

O Render fornecerá instruções específicas:

**Opção 1: CNAME (Recomendado)**
```
Type: CNAME
Name: api
Value: montshop-api.onrender.com
TTL: 3600
```

**Opção 2: A Record**
```
Type: A
Name: api
Value: [IP fornecido pelo Render]
TTL: 3600
```

#### 8.3 SSL Automático

Após configurar o DNS, o Render ativa SSL via Let's Encrypt automaticamente em alguns minutos.

---

## 🚀 Deploy na DigitalOcean

Este guia detalha como fazer deploy completo da API MontShop e do banco de dados PostgreSQL na DigitalOcean, aproveitando o App Platform e o Managed Database.

### Passo 1: Preparar o Repositório

#### 1.1 Verificar Arquivos Essenciais

Certifique-se de que os seguintes arquivos estão na pasta `api-lojas/`:

```
api-lojas/
├── package.json          ✅ Scripts de produção
├── Dockerfile            ✅ Container (opcional)
├── healthcheck.js        ✅ Health check
├── prisma/
│   └── schema.prisma     ✅ Schema do banco
├── .gitignore            ✅ Exclusões corretas
└── src/                  ✅ Código fonte
```

#### 1.2 Commit e Push

```bash
# Certifique-se de estar no diretório raiz do projeto
cd MontShop

# Adicione todos os arquivos
git add .

# Commit
git commit -m "feat: prepara API para produção na DigitalOcean"

# Push para o GitHub
git push origin main
```

⚠️ **IMPORTANTE**: O DigitalOcean App Platform faz deploy automático do GitHub, então cada push na branch configurada gerará um novo deploy.

---

### Passo 2: Criar Conta na DigitalOcean

1. Acesse [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Clique em **"Sign Up"** para criar uma conta nova
3. Ou faça login se já tiver uma conta
4. Complete a verificação de email (se necessário)
5. Adicione um método de pagamento (necessário mesmo para usar créditos grátis)

💡 **Dica**: Novos usuários recebem US$ 200 em créditos válidos por 60 dias!

---

### Passo 3: Criar Banco de Dados PostgreSQL (Managed Database)

#### 3.1 Iniciar Criação do Banco

1. No Dashboard da DigitalOcean, clique em **"Create"** no canto superior direito
2. Selecione **"Databases"**
3. Escolha **"PostgreSQL"** como tipo de banco

#### 3.2 Configurar Região e Cluster

**Datacenter Region:**
- **São Paulo (nyc1)** ou **San Francisco (sfo3)** - Boas opções para Brasil
- **Amsterdam (ams3)** - Boa latência para Europa
- **Bangalore (blr1)** - Boa para Ásia

⚠️ **IMPORTANTE**: Anote a região escolhida - você usará a mesma para a API!

**Database Configuration:**
- **Choose a name**: `montshop-db` (ou outro nome de sua escolha)
- **Database name**: `montshop` (nome do banco dentro do cluster)
- **User name**: `montshop_user` (ou deixe o padrão)

#### 3.3 Escolher Plano

**Opções Recomendadas:**

- **Basic - Regular Intel (US$ 15/mês)** - Recomendado para produção
  - 1 vCPU, 1GB RAM, 10GB SSD
  - Backups diários automáticos
  - Suporta até 25 conexões simultâneas

- **Basic - Regular Intel (US$ 25/mês)** - Para maior carga
  - 1 vCPU, 2GB RAM, 25GB SSD
  - Suporta até 50 conexões simultâneas

- **Basic - Premium Intel (US$ 30/mês)** - Melhor performance
  - 1 vCPU, 2GB RAM, 25GB SSD
  - SSD NVMe (mais rápido)
  - Suporta até 50 conexões simultâneas

⚠️ **Nota**: Para testes, você pode começar com o plano de US$ 15/mês e fazer upgrade depois.

#### 3.4 Configurações Adicionais

**PostgreSQL Version:**
- Selecione **PostgreSQL 15** (recomendado) ou **PostgreSQL 16**

**VPC Network:**
- Deixe como **Default** (será configurado depois para conectar com o App Platform)

**Additional Options:**
- ✅ **Enable connection pooling**: Marque esta opção (melhora performance)
- ✅ **Enable automated backups**: Já está habilitado por padrão (diários)

#### 3.5 Finalizar Criação

1. Revise todas as configurações
2. Clique em **"Create a Database Cluster"**
3. Aguarde 3-5 minutos enquanto o banco é criado

#### 3.6 Anotar Credenciais

Após a criação, você verá as seguintes informações importantes:

**Connection Details:**
- **Host**: `db-postgresql-xxx-do-user-xxx-0.db.ondigitalocean.com`
- **Port**: `25060` (porta SSL padrão)
- **User**: O usuário que você definiu
- **Database**: `montshop`
- **Password**: Clique em **"Show password"** para ver a senha gerada automaticamente

**Connection String:**
O DigitalOcean fornece uma Connection String pronta para usar:
```
postgresql://montshop_user:senha@host:25060/montshop?sslmode=require
```

⚠️ **CRÍTICO**: 
- Copie e salve essas credenciais em um local seguro
- Você precisará delas para configurar o App Platform
- A senha é mostrada apenas uma vez - certifique-se de anotá-la!

#### 3.7 Configurar Firewall (Trusted Sources)

1. No painel do banco de dados, vá em **"Settings"** → **"Trusted Sources"**
2. Adicione as seguintes fontes:
   - **0.0.0.0/0** (temporariamente, para testes)
   - OU configure para aceitar apenas conexões do App Platform (recomendado em produção)

💡 **Dica**: Em produção, configure para aceitar apenas conexões do App Platform usando o VPC.

---

### Passo 4: Conectar Conta do GitHub

Antes de criar o App Platform, você precisa conectar sua conta do GitHub:

1. No Dashboard, vá em **"Settings"** → **"API"** (ou **"Integrations"**)
2. Clique em **"Connect GitHub"** ou **"GitHub"**
3. Autorize o DigitalOcean a acessar seus repositórios
4. Escolha quais repositórios permitir acesso:
   - **All repositories** (acesso completo)
   - OU **Only select repositories** (selecione apenas o repositório MontShop)
5. Clique em **"Install & Authorize"**

---

### Passo 5: Criar App Platform (API)

#### 5.1 Iniciar Criação do App

1. No Dashboard, clique em **"Create"** → **"Apps"**
2. Clique em **"GitHub"** para conectar (se ainda não conectou)
3. Selecione o repositório **MontShop**

#### 5.2 Configurar Branch e Diretório

O DigitalOcean detectará automaticamente o repositório. Configure:

**Source:**
- **Branch**: `main` (ou sua branch principal)
- **Autodeploy**: ✅ **Enable** (faz deploy automático em cada push)
- **Root Directory**: `api-lojas` ⚠️ **IMPORTANTE!**

#### 5.3 Configurar Build e Run

O DigitalOcean tentará detectar automaticamente, mas você pode editar manualmente:

**Build Command:**
```bash
npm ci && npm run db:generate && npm run build
```

**Run Command:**
```bash
npm run start:prod
```

**HTTP Port:**
- Deixe vazio (o DigitalOcean detecta automaticamente) OU
- Configure `PORT` como variável de ambiente (o App Platform define automaticamente)

#### 5.4 Selecionar Plano

**Plano Basic (US$ 5/mês)** - Recomendado para começar:
- 512 MB RAM
- 1 vCPU
- 1 GB SSD
- 100 GB transfer

**Plano Professional (US$ 12/mês)** - Para produção:
- 1 GB RAM
- 1 vCPU
- 1 GB SSD
- 100 GB transfer

⚠️ **Nota**: Você pode começar com Basic e fazer upgrade depois.

#### 5.5 Adicionar Banco de Dados ao App

1. Na seção **"Resources"**, clique em **"Add Resource"** → **"Database"**
2. Selecione **"Use an existing database"**
3. Escolha o banco `montshop-db` criado no Passo 3
4. O DigitalOcean configurará automaticamente a variável `DATABASE_URL`

💡 **Importante**: Isso cria automaticamente uma variável de ambiente `DATABASE_URL` com a connection string correta.

#### 5.6 Configurar Variáveis de Ambiente

Antes de fazer o deploy, adicione as variáveis de ambiente necessárias:

**Variáveis Obrigatórias:**

1. **JWT_SECRET**
   ```
   Value: [gere uma chave segura]
   ```
   Para gerar:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **NODE_ENV**
   ```
   Value: production
   ```

3. **CORS_ORIGIN**
   ```
   Value: https://seu-frontend.com,https://www.seu-frontend.com
   ```
   ⚠️ Substitua pelos domínios reais do seu frontend.

**Variáveis do Focus NFe:**

4. **FOCUSNFE_API_KEY**
   ```
   Value: [sua API key do Focus NFe]
   ```

5. **FOCUSNFE_BASE_URL**
   ```
   Value: https://api.focusnfe.com.br
   ```

6. **FISCAL_ENVIRONMENT**
   ```
   Value: production
   ```

7. **FISCAL_PROVIDER**
   ```
   Value: focusnfe
   ```

**Variáveis do Firebase:**

8. **FIREBASE_PROJECT_ID**
   ```
   Value: uploadsmontshop-f3f7f
   ```

9. **FIREBASE_CLIENT_EMAIL**
   ```
   Value: firebase-adminsdk-fbsvc@uploadsmontshop-f3f7f.iam.gserviceaccount.com
   ```

10. **FIREBASE_PRIVATE_KEY**
    ```
    Value: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDPv98S2PUCZzfn\n...\n-----END PRIVATE KEY-----\n"
    ```
    ⚠️ Mantenha as quebras de linha `\n` e coloque entre aspas duplas.

11. **FIREBASE_STORAGE_BUCKET**
    ```
    Value: gs://uploadsmontshop-f3f7f.firebasestorage.app
    ```

**Variáveis Opcionais:**

12. **THROTTLE_TTL**
    ```
    Value: 60
    ```

13. **THROTTLE_LIMIT**
    ```
    Value: 100
    ```

⚠️ **IMPORTANTE**: A variável `DATABASE_URL` será configurada automaticamente quando você adicionar o banco de dados ao App. Não configure manualmente!

#### 5.7 Health Check (Avançado)

Na seção **"App-Level Settings"**, configure:

**Health Check:**
- **HTTP Path**: `/health`
- **Initial Delay**: `60` segundos (tempo para a aplicação iniciar)

#### 5.8 Revisar e Criar

1. Revise todas as configurações
2. Verifique se o banco de dados está conectado
3. Verifique se todas as variáveis de ambiente estão configuradas
4. Clique em **"Create Resources"** ou **"Launch App"**

O DigitalOcean iniciará o deploy automaticamente!

---

### Passo 6: Monitorar o Primeiro Deploy

#### 6.1 Acompanhar Logs

1. Após criar o App, você será redirecionado para a página do App
2. Clique na aba **"Runtime Logs"** para ver o progresso do build e deploy
3. Aguarde o build completar (geralmente 3-5 minutos na primeira vez)

#### 6.2 Verificar Status

O status do deploy aparecerá como:
- 🟡 **Building** - Em construção
- 🟡 **Deploying** - Fazendo deploy
- 🟢 **Live** - Deploy concluído e rodando

⚠️ **Primeiro deploy pode falhar**: Isso é normal se as migrações não foram executadas ainda. Vamos corrigir isso no próximo passo.

---

### Passo 7: Executar Migrações do Banco de Dados

Após o primeiro deploy (mesmo que tenha falhado), você precisa executar as migrações:

#### 7.1 Opção A: Executar via Console do App Platform (Recomendado)

1. No painel do App, vá em **"Settings"** → **"Console"**
2. Ou clique na aba **"Console"** no topo
3. Aguarde o console carregar

#### 7.2 Gerar Cliente Prisma

No console, execute:

```bash
npm run db:generate
```

Esperado:
```
✔ Generated Prisma Client
```

#### 7.3 Executar Migrações

```bash
npm run db:migrate:deploy
```

Esperado:
```
✔ Migrations applied successfully
```

⚠️ **IMPORTANTE**: 
- Use `db:migrate:deploy` em produção
- **NUNCA** use `db:push` ou `db:migrate dev` em produção

#### 7.4 (Opcional) Popular Dados Iniciais

Se você tem um seed:

```bash
npm run db:seed
```

#### 7.5 Reiniciar o App

Após executar as migrações:

1. Vá em **"Settings"** → **"App-Level Settings"**
2. Role até **"Actions"**
3. Clique em **"Restart App"**
4. Aguarde o app reiniciar

---

### Passo 8: Verificar o Deploy

#### 8.1 Verificar Logs de Execução

1. Na aba **"Runtime Logs"**, procure por:
   ```
   🚀 Application is running on: http://localhost:PORT
   📚 Swagger documentation: http://localhost:PORT/api/docs
   ```

2. Se houver erros, verifique:
   - Variáveis de ambiente configuradas corretamente
   - Migrações executadas
   - Build bem-sucedido

#### 8.2 Testar Endpoints

O DigitalOcean fornece uma URL automática, por exemplo:
`https://montshop-api-xxxxx.ondigitalocean.app`

**Health Check:**
```bash
curl https://montshop-api-xxxxx.ondigitalocean.app/health
```

Esperado:
```json
{
  "status": "ok",
  "timestamp": "2025-01-XX...",
  "uptime": 123.45,
  "environment": "production"
}
```

**Documentação Swagger:**
Acesse no navegador:
```
https://montshop-api-xxxxx.ondigitalocean.app/api/docs
```

#### 8.3 Verificar Banco de Dados

Para verificar o banco, use uma ferramenta externa:

**DBeaver (Grátis, Cross-platform)**
- Download: [dbeaver.io](https://dbeaver.io)
- Conecte usando a Connection String do painel do banco
- Use SSL mode: `require`

**TablePlus (Mac/Windows, Grátis)**
- Download: [tableplus.com](https://tableplus.com)
- Use a Connection String do painel do banco

**pgAdmin (Grátis, Open source)**
- Download: [pgadmin.org](https://pgadmin.org)

---

### Passo 9: Configurar Domínio Customizado (Opcional)

#### 9.1 Adicionar Domínio

1. No painel do App, vá em **"Settings"** → **"Domains"**
2. Clique em **"Add Domain"**
3. Digite seu domínio: `api.seudominio.com`
4. Clique em **"Add Domain"**

#### 9.2 Configurar DNS

O DigitalOcean fornecerá instruções específicas:

**Opção 1: CNAME (Recomendado)**
```
Type: CNAME
Name: api
Value: montshop-api-xxxxx.ondigitalocean.app
TTL: 3600
```

**Opção 2: A Record**
```
Type: A
Name: api
Value: [IP fornecido pelo DigitalOcean]
TTL: 3600
```

#### 9.3 SSL Automático

Após configurar o DNS:
1. Aguarde a propagação DNS (pode levar até 48 horas, geralmente 1-2 horas)
2. O DigitalOcean ativará SSL via Let's Encrypt automaticamente
3. O status mudará de "Pending" para "Active" quando estiver pronto

---

### Passo 10: Configurar Deploy Automático (CI/CD)

O deploy automático já está configurado por padrão, mas você pode ajustar:

#### 10.1 Configurações de Autodeploy

1. No painel do App, vá em **"Settings"** → **"App-Level Settings"**
2. Na seção **"Source"**, você verá:
   - ✅ **Autodeploy** - Habilita deploy automático
   - **Branch**: Branch monitorada (geralmente `main`)

#### 10.2 Deploy Manual (se necessário)

Se precisar fazer deploy manual:

1. Vá em **"Deployments"**
2. Clique em **"Create Deployment"**
3. Selecione a branch e commit desejados
4. Clique em **"Deploy"**

---

## 💰 Custos Estimados - DigitalOcean

### Configuração Básica (Produção)

- **App Platform Basic**: US$ 5/mês
  - 512 MB RAM, 1 vCPU, 1 GB SSD
- **Managed Database Basic**: US$ 15/mês
  - 1 vCPU, 1GB RAM, 10GB SSD
- **Total**: **~US$ 20/mês**

### Configuração Profissional (Alta Demanda)

- **App Platform Professional**: US$ 12/mês
  - 1 GB RAM, 1 vCPU, 1 GB SSD
- **Managed Database Premium**: US$ 30/mês
  - 1 vCPU, 2GB RAM, 25GB SSD (NVMe)
- **Total**: **~US$ 42/mês**

💡 **Dica**: Novos usuários recebem US$ 200 em créditos grátis (válido por 60 dias)!

---

## 🐛 Troubleshooting - DigitalOcean

### Build Falha

**Erro**: `npm ci` falha
**Solução**: 
- Verifique se o `package-lock.json` está commitado
- Verifique os logs em "Runtime Logs" → "Build Logs"

**Erro**: TypeScript compilation errors
**Solução**: 
- Teste build local: `cd api-lojas && npm run build`
- Verifique se há erros de sintaxe no código

**Erro**: Prisma generate falha
**Solução**: 
- Verifique se o `prisma/schema.prisma` está correto
- Verifique se o `DATABASE_URL` está configurado (mesmo que falhe, precisa estar)

### Aplicação Não Inicia

**Erro**: "Cannot connect to database"
**Solução**: 
- Verifique se o banco foi adicionado como resource no App
- Verifique se a `DATABASE_URL` está correta (deve ser configurada automaticamente)
- Verifique se o banco está na mesma região (VPC) que o App
- Verifique "Trusted Sources" no banco de dados

**Erro**: "JWT_SECRET is required"
**Solução**: 
- Configure a variável `JWT_SECRET` em "Settings" → "App-Level Settings" → "Environment Variables"

**Erro**: "Port already in use"
**Solução**: 
- O DigitalOcean gerencia a porta automaticamente via variável `PORT`
- Não configure `PORT` manualmente

### Health Check Falha

**Erro**: Health check retorna 502 ou timeout
**Solução**: 
- Aumente "Initial Delay" para 60-120 segundos
- Verifique se o endpoint `/health` está funcionando localmente
- Verifique logs em "Runtime Logs" para erros de startup

### Banco de Dados Não Conecta

**Erro**: "Connection refused" ou "timeout"
**Solução**: 
1. Verifique se o App e o banco estão na mesma região/VPC
2. No painel do banco, vá em "Settings" → "Trusted Sources"
3. Adicione `0.0.0.0/0` temporariamente para testes
4. OU configure VPC para conectar App e banco na mesma rede privada

**Como configurar VPC:**
1. Crie um VPC na mesma região do banco
2. No App Platform, em "Settings" → "Networking", selecione o VPC
3. No banco, em "Settings" → "VPC Network", selecione o mesmo VPC
4. Isso permite conexão privada (mais seguro)

### Deploy Automático Não Funciona

**Erro**: Push no GitHub não dispara deploy
**Solução**: 
- Verifique se "Autodeploy" está habilitado
- Verifique se está fazendo push na branch correta (geralmente `main`)
- Verifique se a conexão com GitHub ainda está ativa em "Settings" → "API"

### Erro de Memória (OOM)

**Erro**: "Out of memory" ou app reinicia constantemente
**Solução**: 
- Upgrade para um plano com mais RAM (Professional ou Higher)
- Otimize o código para usar menos memória
- Verifique se há memory leaks no código

---

## ✅ Checklist Final - DigitalOcean

Use este checklist para garantir que tudo está configurado corretamente:

### Conta e Configuração
- [ ] Conta DigitalOcean criada e verificada
- [ ] Método de pagamento adicionado
- [ ] Conta GitHub conectada ao DigitalOcean

### Banco de Dados
- [ ] Managed Database PostgreSQL criado
- [ ] Região anotada (para usar mesma no App)
- [ ] Credenciais salvas em local seguro
- [ ] Trusted Sources configurado
- [ ] Backup automático habilitado

### App Platform
- [ ] App criado no App Platform
- [ ] Repositório GitHub conectado
- [ ] Root Directory: `api-lojas`
- [ ] Branch: `main` (ou correta)
- [ ] Autodeploy habilitado
- [ ] Build Command configurado
- [ ] Run Command configurado
- [ ] Banco de dados adicionado como resource

### Variáveis de Ambiente
- [ ] `DATABASE_URL` configurada automaticamente (via resource)
- [ ] `JWT_SECRET` gerada e configurada
- [ ] `CORS_ORIGIN` com domínios corretos
- [ ] `NODE_ENV=production`
- [ ] `FOCUSNFE_API_KEY` configurada
- [ ] `FOCUSNFE_BASE_URL` configurada
- [ ] `FISCAL_ENVIRONMENT=production`
- [ ] `FIREBASE_PROJECT_ID` configurado
- [ ] `FIREBASE_CLIENT_EMAIL` configurado
- [ ] `FIREBASE_PRIVATE_KEY` configurada (com `\n`)
- [ ] `FIREBASE_STORAGE_BUCKET` configurado

### Banco de Dados
- [ ] Cliente Prisma gerado (`npm run db:generate`)
- [ ] Migrações aplicadas (`npm run db:migrate:deploy`)
- [ ] Seed executado (se necessário)

### Verificação
- [ ] Health check funcionando (`/health`)
- [ ] Swagger acessível (`/api/docs`)
- [ ] Logs sem erros
- [ ] SSL ativo (se domínio customizado)
- [ ] Variáveis sensíveis não expostas

### Deploy Automático
- [ ] Autodeploy habilitado
- [ ] Teste: Push no GitHub dispara deploy automaticamente
- [ ] Deploy bem-sucedido após push

---

## 📚 Recursos Adicionais - DigitalOcean

- [Documentação App Platform](https://docs.digitalocean.com/products/app-platform/)
- [Documentação Managed Databases](https://docs.digitalocean.com/products/databases/)
- [Guia de Deploy Node.js](https://docs.digitalocean.com/products/app-platform/how-to/deploy-nodejs-app/)
- [VPC Networking](https://docs.digitalocean.com/products/networking/vpc/)
- [Status DigitalOcean](https://status.digitalocean.com/)

---

## 🌐 Alternativas de Hospedagem

### Railway (Rápido Setup)

1. Acesse [railway.app](https://railway.app)
2. Login com GitHub
3. **"New Project"** → **"Deploy from GitHub repo"**
4. Selecione o repositório
5. Railway detecta automaticamente e inicia o deploy
6. Adicione banco PostgreSQL: **"+ New"** → **"Database"** → **"PostgreSQL"**
7. Configure variáveis de ambiente

**Vantagens**: Setup super rápido, preview deploys, logs excelentes

### Fly.io (Global Distribution)

1. Instale Fly CLI: `npm install -g flyctl`
2. Login: `flyctl auth login`
3. Deploy: `flyctl launch` (na pasta `api-lojas`)
4. Configure secrets: `flyctl secrets set KEY=value`

**Vantagens**: Edge computing, multi-região, generous free tier

---

## ✅ Checklist Final

Use este checklist para garantir que tudo está configurado corretamente:

### Configuração do Render
- [ ] Repositório conectado ao Render
- [ ] Serviço Web criado
- [ ] Banco de Dados PostgreSQL criado
- [ ] Root Directory: `api-lojas`

### Variáveis de Ambiente
- [ ] `DATABASE_URL` configurada (Internal URL)
- [ ] `JWT_SECRET` gerada e configurada
- [ ] `CORS_ORIGIN` com domínios corretos
- [ ] `NODE_ENV=production`
- [ ] `FOCUSNFE_API_KEY` configurada
- [ ] `FOCUSNFE_BASE_URL` configurada
- [ ] `FISCAL_ENVIRONMENT=production`
- [ ] `FIREBASE_PROJECT_ID` configurado
- [ ] `FIREBASE_CLIENT_EMAIL` configurado
- [ ] `FIREBASE_PRIVATE_KEY` configurada (com `\n`)
- [ ] `FIREBASE_STORAGE_BUCKET` configurado

### Banco de Dados
- [ ] Cliente Prisma gerado (`npm run db:generate`)
- [ ] Migrações aplicadas (`npm run db:migrate:deploy`)
- [ ] Seed executado (se necessário)

### Verificação
- [ ] Health check funcionando (`/health`)
- [ ] Swagger acessível (`/api/docs`)
- [ ] Logs sem erros
- [ ] SSL ativo (se domínio customizado)
- [ ] Variáveis sensíveis não expostas

### Frontend
- [ ] Frontend configurado para usar URL da API
- [ ] CORS permitindo o domínio do frontend
- [ ] Testes end-to-end passando

---

## 🐛 Troubleshooting

### Build Falha

**Erro**: `npm ci` falha
**Solução**: Verifique se o `package-lock.json` está commitado

**Erro**: TypeScript compilation errors
**Solução**: Teste build local: `cd api-lojas && npm run build`

**Erro**: Prisma generate falha
**Solução**: Verifique se o `prisma/schema.prisma` está correto

### Aplicação Não Inicia

**Erro**: "Cannot connect to database"
**Solução**: Verifique se `DATABASE_URL` usa a Internal URL

**Erro**: "JWT_SECRET is required"
**Solução**: Configure a variável `JWT_SECRET`

**Erro**: "Port already in use"
**Solução**: O Render gerencia a porta automaticamente - não configure `PORT`

### Health Check Falha

**Erro**: Health check retorna 502
**Solução**: 
- Aumente "Health Check Grace Period" para 60s
- Verifique se `/health` endpoint está funcionando
- Verifique logs para erros de startup

### Banco de Dados Não Conecta

**Erro**: "Connection refused"
**Solução**: 
- Use Internal Database URL para serviços no mesmo Render
- Verifique se o banco está na mesma região

---

## 💰 Custos Estimados

### Plano Starter Render

- **Web Service**: US$ 7/mês
- **PostgreSQL**: US$ 7/mês
- **Total**: **~US$ 14/mês**

### Plano Free (Testes)

- **Web Service**: Grátis (pode dormir após 15 min)
- **PostgreSQL**: Grátis (expira após 90 dias inativos)
- **Total**: **Grátis** (com limitações)

⚠️ **Recomendação**: Comece com Free para testes, depois migre para Starter quando precisar de produção.

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs** no Dashboard do Render
2. **Consulte a documentação**: [render.com/docs](https://render.com/docs)
3. **Suporte Render**: Dashboard → Support
4. **Issues no GitHub**: Abra uma issue no repositório

---

## 🎉 Próximos Passos

Após o deploy bem-sucedido:

1. ✅ Configure o frontend para usar a URL da API
2. ✅ Teste todas as funcionalidades principais
3. ✅ Configure monitoramento (opcional)
4. ✅ Configure backups automáticos do banco
5. ✅ Documente a URL da API para a equipe
6. ✅ Configure CI/CD para deploy automático (Render já faz isso!)

---

## 📚 Recursos Adicionais

- [Documentação Render](https://render.com/docs)
- [Blog Render](https://render.com/blog)
- [Status Render](https://status.render.com)
- [Best Practices NestJS](https://docs.nestjs.com)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)

---

**MONT Tecnologia da Informação** - MontShop SaaS

Última atualização: Janeiro 2025


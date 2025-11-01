# 🚀 Guia de Deploy no Render - API MontShop

Este guia completo explica como fazer o deploy da API MontShop no Render.com, incluindo configuração do banco de dados PostgreSQL, variáveis de ambiente e monitoramento.

## 📋 Pré-requisitos

1. Conta no [Render.com](https://render.com) (cadastro gratuito disponível)
2. Repositório GitHub com o código da API
3. Credenciais do Firebase (para armazenamento de imagens)
4. API Key do Focus NFe (para emissão de notas fiscais)
5. Conta de email SMTP (opcional, para envio de emails)

---

## 🎯 Passo 1: Preparar o Repositório

### 1.1 Verificar arquivos necessários

Certifique-se de que os seguintes arquivos estão no repositório:
- ✅ `render.yaml` (na pasta `api-lojas/`)
- ✅ `package.json` (com scripts de produção)
- ✅ `Dockerfile` (opcional, se preferir usar Docker)
- ✅ `prisma/schema.prisma` (schema do banco de dados)
- ✅ `.gitignore` (para não commitar `.env`)

### 1.2 Commit e Push

```bash
git add .
git commit -m "feat: adiciona configuração para deploy no Render"
git push origin main
```

---

## 🗄️ Passo 2: Criar Banco de Dados PostgreSQL

### 2.1 Criar novo banco de dados

1. Acesse o [Dashboard do Render](https://dashboard.render.com)
2. Clique em **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `montshop-db` (ou o nome que preferir)
   - **Database**: `montshop`
   - **User**: `montshop_user` (ou deixe o padrão)
   - **Region**: Escolha a região mais próxima dos seus usuários
   - **PostgreSQL Version**: `15` (recomendado) ou `16`
   - **Plan**: 
     - **Free**: Para testes (expira após 90 dias de inatividade)
     - **Starter**: US$ 7/mês (recomendado para produção)
4. Clique em **"Create Database"**

### 2.2 Anotar credenciais

Após criar o banco, anote:
- **Internal Database URL** (para uso no mesmo serviço Render)
- **External Database URL** (para conexão externa)
- **Database Host**
- **Database Port**
- **Database Name**
- **Database User**
- **Database Password**

⚠️ **IMPORTANTE**: O Render gera automaticamente as credenciais. Anote-as, pois a senha não será mostrada novamente!

---

## 🔧 Passo 3: Criar Serviço Web (API)

### 3.1 Opção A: Usar render.yaml (Recomendado)

1. No Dashboard do Render, clique em **"New +"** → **"Blueprint"**
2. Conecte seu repositório GitHub
3. Selecione o repositório com a API MontShop
4. Render detectará automaticamente o arquivo `render.yaml`
5. Clique em **"Apply"** para criar os serviços

O Render criará automaticamente:
- ✅ Serviço Web da API
- ✅ Banco de Dados PostgreSQL
- ✅ Variáveis de ambiente básicas

### 3.2 Opção B: Criar manualmente

1. No Dashboard do Render, clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub
3. Configure o serviço:
   - **Name**: `montshop-api`
   - **Region**: Mesma região do banco de dados
   - **Branch**: `main` (ou sua branch principal)
   - **Root Directory**: `api-lojas`
   - **Runtime**: `Node`
   - **Build Command**: 
     ```bash
     npm ci && npm run db:generate && npm run build
     ```
   - **Start Command**: 
     ```bash
     npm run start:prod
     ```
   - **Plan**: 
     - **Free**: Para testes (pode dormir após 15 min de inatividade)
     - **Starter**: US$ 7/mês (recomendado para produção)

4. Na seção **"Advanced"**:
   - **Health Check Path**: `/health`
   - **Health Check Grace Period**: `60` segundos

5. Clique em **"Create Web Service"**

---

## 🔐 Passo 4: Configurar Variáveis de Ambiente

No serviço criado, vá até **"Environment"** e adicione as seguintes variáveis:

### 4.1 Variáveis Obrigatórias

#### Banco de Dados
```env
DATABASE_URL=<valor_do_internal_database_url_do_render>
```
💡 **Dica**: Use a **Internal Database URL** para melhor performance (tráfego interno).

#### Autenticação
```env
JWT_SECRET=<gerar_uma_chave_forte>
```
🔐 Para gerar uma chave segura:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### CORS
```env
CORS_ORIGIN=https://seu-frontend.com,https://www.seu-frontend.com
```
⚠️ **IMPORTANTE**: Substitua pela URL real do seu frontend. Para desenvolvimento, pode usar `*`, mas em produção use URLs específicas.

#### Servidor
```env
NODE_ENV=production
PORT=10000
```
⚠️ **Nota**: O Render usa a porta `10000` por padrão, mas a variável `PORT` é automaticamente definida. Mantenha essa configuração.

### 4.2 Focus NFe (Notas Fiscais)

```env
FOCUSNFE_API_KEY=<sua_api_key_do_focus_nfe>
FOCUSNFE_BASE_URL=https://api.focusnfe.com.br
FISCAL_ENVIRONMENT=production
FISCAL_PROVIDER=focusnfe
```

📝 **Obter API Key**: 
1. Acesse [Focus NFe](https://focusnfe.com.br)
2. Crie uma conta
3. Gere uma API Key no painel
4. Escolha o plano adequado ao seu volume de emissões

### 4.3 Firebase Storage (Imagens)

```env
FIREBASE_PROJECT_ID=<seu_project_id>
FIREBASE_CLIENT_EMAIL=<firebase-adminsdk-xxx@xxx.iam.gserviceaccount.com>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=gs://seu-bucket.appspot.com
```

📝 **Obter credenciais do Firebase**:
1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto (ou crie um novo)
3. Vá em **Project Settings** → **Service Accounts**
4. Clique em **"Generate New Private Key"**
5. Baixe o JSON e extraia os valores necessários

⚠️ **IMPORTANTE**: A `FIREBASE_PRIVATE_KEY` deve manter as quebras de linha (`\n`). No Render, cole a chave completa entre aspas.

### 4.4 Variáveis Opcionais

#### Rate Limiting
```env
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

#### Email (SMTP) - Opcional
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=<senha_de_app_do_gmail>
```

📝 **Para Gmail**:
1. Ative a verificação em 2 etapas
2. Gere uma "Senha de App" em: https://myaccount.google.com/apppasswords
3. Use a senha de app no `SMTP_PASS`

#### WhatsApp - Opcional
```env
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_TOKEN=<seu_token>
```

#### N8N Webhooks - Opcional
```env
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/<id>
```

#### IBPT - Opcional
```env
IBPT_TOKEN=<seu_token_ibpt>
```

### 4.5 Verificar todas as variáveis

Certifique-se de que todas as variáveis estão configuradas. Você pode usar a lista taggeada com `sync: false` no `render.yaml` como referência.

---

## 🔄 Passo 5: Executar Migrações do Banco de Dados

### 5.1 Conectar ao banco via terminal

1. No serviço web criado, vá em **"Shell"** (no menu lateral)
2. Ou use o terminal local com a **External Database URL**

### 5.2 Executar migrações

No terminal do Render Shell:

```bash
# Gerar cliente Prisma
npm run db:generate

# Executar migrações
npm run db:migrate:deploy

# OU usando npx diretamente
# npx prisma migrate deploy

# ⚠️ NUNCA use db:push em produção - apenas para desenvolvimento
```

⚠️ **IMPORTANTE**: Em produção, sempre use `prisma migrate deploy` para aplicar migrações de forma segura.

### 5.3 (Opcional) Popular dados iniciais

```bash
npm run db:seed
```

---

## ✅ Passo 6: Verificar Deploy

### 6.1 Verificar logs

1. No Dashboard do Render, acesse o serviço web
2. Vá na aba **"Logs"**
3. Verifique se há erros durante o build e start
4. Procure pela mensagem: `🚀 Application is running on: http://localhost:10000`

### 6.2 Testar endpoints

Após o deploy, teste os seguintes endpoints:

```bash
# Health Check
curl https://seu-servico.onrender.com/health

# Swagger Documentation
# Acesse: https://seu-servico.onrender.com/api/docs
```

### 6.3 Verificar banco de dados

No terminal do Render Shell:

```bash
npx prisma studio
```

⚠️ **Nota**: Prisma Studio não funciona diretamente no Render Shell. Use uma ferramenta externa como:
- [pgAdmin](https://www.pgadmin.org/)
- [DBeaver](https://dbeaver.io/)
- [TablePlus](https://tableplus.com/)

Conecte usando a **External Database URL**.

---

## 🔒 Passo 7: Configurar SSL e Domínio Customizado (Opcional)

### 7.1 Adicionar domínio customizado

1. No serviço web, vá em **"Settings"** → **"Custom Domains"**
2. Clique em **"Add Custom Domain"**
3. Digite seu domínio (ex: `api.seudominio.com`)
4. Siga as instruções para configurar DNS:
   - Adicione um registro CNAME apontando para `<seu-servico>.onrender.com`
   - Ou adicione um registro A com o IP fornecido

### 7.2 SSL automático

O Render fornece SSL automático via Let's Encrypt. Após configurar o DNS corretamente, o SSL será ativado automaticamente em alguns minutos.

---

## 📊 Passo 8: Monitoramento e Manutenção

### 8.1 Health Checks

O Render monitora automaticamente o endpoint `/health`. Se falhar 3 vezes consecutivas, o serviço será reiniciado.

### 8.2 Logs

- **Runtime Logs**: Acesse a aba **"Logs"** no Dashboard
- **Build Logs**: Aparecem durante cada deploy
- **Metrics**: Acesse **"Metrics"** para ver CPU, Memória, etc.

### 8.3 Backup do Banco de Dados

O Render faz backup automático do banco de dados, mas recomenda-se:
1. Configurar backups manuais periódicos
2. Exportar dados regularmente usando `pg_dump`

Para exportar:
```bash
pg_dump <EXTERNAL_DATABASE_URL> > backup.sql
```

---

## 🐛 Troubleshooting (Solução de Problemas)

### Problema: Build falha

**Causa comum**: Dependências faltando ou erro no código TypeScript.

**Solução**:
1. Verifique os logs de build
2. Teste o build localmente: `npm run build`
3. Verifique se todas as dependências estão no `package.json`

### Problema: Aplicação não inicia

**Causa comum**: Variáveis de ambiente faltando ou banco de dados não acessível.

**Solução**:
1. Verifique se `DATABASE_URL` está configurada
2. Verifique se todas as variáveis obrigatórias estão definidas
3. Verifique os logs de runtime

### Problema: Health check falha

**Causa comum**: Aplicação não responde em `/health` ou porta incorreta.

**Solução**:
1. Verifique se o endpoint `/health` está funcionando
2. Verifique se a porta está configurada corretamente (deve ser `10000` ou usar `PORT` do Render)
3. Aumente o **Health Check Grace Period** nas configurações

### Problema: Banco de dados não conecta

**Causa comum**: URL de conexão incorreta ou firewall.

**Solução**:
1. Use a **Internal Database URL** se o serviço web e banco estão no mesmo serviço Render
2. Verifique se o banco está no mesmo plano/região
3. Verifique se não há bloqueio de conexões

### Problema: Migrações não executam

**Causa comum**: Cliente Prisma não gerado ou schema incorreto.

**Solução**:
1. Execute `npm run db:generate` antes das migrações
2. Verifique se o `DATABASE_URL` está correto
3. Execute `npx prisma migrate status` para verificar estado

---

## 💰 Custos Estimados

### Plano Básico (Starter)

- **Web Service**: US$ 7/mês
- **PostgreSQL**: US$ 7/mês
- **Total**: ~US$ 14/mês

### Plano Free (Desenvolvimento/Testes)

- **Web Service**: Grátis (pode dormir após 15 min)
- **PostgreSQL**: Grátis (expira após 90 dias de inatividade)
- **Total**: Grátis (com limitações)

⚠️ **Recomendação**: Use o plano Free para testes e Starter para produção.

---

## 📚 Recursos Adicionais

- [Documentação Render](https://render.com/docs)
- [Render Blog](https://render.com/blog)
- [Render Status](https://status.render.com)

---

## 🎉 Próximos Passos

Após o deploy bem-sucedido:

1. ✅ Configure o frontend para usar a URL da API
2. ✅ Teste todas as funcionalidades
3. ✅ Configure monitoramento adicional (opcional)
4. ✅ Configure CI/CD para deploy automático (Render já faz isso por padrão)
5. ✅ Documente a URL da API para a equipe

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs no Dashboard do Render
2. Consulte a [Documentação do Render](https://render.com/docs)
3. Entre em contato com o suporte do Render via Dashboard

---

**MONT Tecnologia da Informação** - MontShop SaaS

Última atualização: Janeiro 2025


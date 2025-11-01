# 🚀 API MontShop - Guia de Deploy

Este documento fornece links rápidos para todos os guias de deploy e configuração da API MontShop.

---

## 📚 Documentação de Deploy

### 🎯 Início Rápido (5 minutos)
👉 **[RENDER-QUICK-START.md](./RENDER-QUICK-START.md)**  
Guia rápido para fazer deploy no Render em 5 minutos.

### 📖 Guia Completo
👉 **[GUIA-DEPLOY-PRODUCAO.md](./GUIA-DEPLOY-PRODUCAO.md)**  
Guia passo a passo detalhado com todas as informações necessárias para deploy em produção.

### 🗄️ Serviços Recomendados
👉 **[SERVIÇOS-RECOMENDADOS.md](./SERVIÇOS-RECOMENDADOS.md)**  
Comparação de serviços de hospedagem, banco de dados e outras recomendações.

### 🔧 Configuração Detalhada
👉 **[DEPLOY-RENDER.md](./DEPLOY-RENDER.md)**  
Documentação técnica detalhada específica para Render.com.

---

## ⚡ Deploy Rápido

### Opção 1: Render (Recomendado)

#### Passo 1: Preparar Código
```bash
git add .
git commit -m "feat: prepara para produção"
git push origin main
```

#### Passo 2: Deploy no Render
1. Acesse [render.com](https://render.com)
2. **New +** → **Blueprint**
3. Conecte seu repositório GitHub
4. Render detectará `render.yaml` automaticamente
5. Clique em **Apply**

#### Passo 3: Configurar Variáveis
Adicione as variáveis obrigatórias no Render:
- `JWT_SECRET` (gere uma chave segura)
- `CORS_ORIGIN` (URL do seu frontend)
- `FOCUSNFE_API_KEY` (API key do Focus NFe)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET`

#### Passo 4: Executar Migrações
No Shell do Render:
```bash
npm run db:migrate:deploy
```

#### Passo 5: Verificar
- ✅ Health: `https://seu-servico.onrender.com/health`
- ✅ Swagger: `https://seu-servico.onrender.com/api/docs`

---

### Opção 2: Railway

#### Passo 1: Deploy
1. Acesse [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub**
3. Selecione o repositório

#### Passo 2: Adicionar Database
**+ New** → **Database** → **PostgreSQL**

#### Passo 3: Configurar Variáveis
Configure todas as variáveis de ambiente necessárias.

---

### Opção 3: Docker

#### Build
```bash
cd api-lojas
docker build -t montshop-api .
```

#### Run
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e FOCUSNFE_API_KEY="..." \
  -e FIREBASE_PROJECT_ID="..." \
  montshop-api
```

---

## 📋 Checklist de Deploy

### Pré-Deploy
- [ ] Código commitado e pushado para GitHub
- [ ] `render.yaml` configurado (ou equivalente)
- [ ] `.gitignore` configurado corretamente
- [ ] Variáveis de ambiente definidas

### Configuração
- [ ] Serviço web criado
- [ ] Banco de dados PostgreSQL criado
- [ ] `DATABASE_URL` configurada
- [ ] `JWT_SECRET` gerada e configurada
- [ ] `CORS_ORIGIN` configurado
- [ ] `NODE_ENV=production`
- [ ] Focus NFe configurado
- [ ] Firebase Storage configurado

### Migrações
- [ ] Cliente Prisma gerado
- [ ] Migrações aplicadas
- [ ] Seed executado (se necessário)

### Verificação
- [ ] Health check funcionando
- [ ] Swagger acessível
- [ ] Logs sem erros
- [ ] SSL configurado
- [ ] Frontend conectando à API

---

## 🔐 Variáveis de Ambiente Obrigatórias

### Básicas
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=<chave_secreta_forte>
CORS_ORIGIN=https://seu-frontend.com
NODE_ENV=production
```

### Focus NFe
```bash
FOCUSNFE_API_KEY=<sua_api_key>
FOCUSNFE_BASE_URL=https://api.focusnfe.com.br
FISCAL_ENVIRONMENT=production
FISCAL_PROVIDER=focusnfe
```

### Firebase Storage
```bash
FIREBASE_PROJECT_ID=<project_id>
FIREBASE_CLIENT_EMAIL=<service_account_email>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=gs://seu-bucket.appspot.com
```

### Opcionais
```bash
# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=<senha_app>
```

---

## 🗄️ Bancos de Dados Recomendados

1. **Supabase** (Recomendado) - [supabase.com](https://supabase.com)
   - Free: 500MB, 2GB transfer
   - Pro: US$ 25/mês
   
2. **Neon** - [neon.tech](https://neon.tech)
   - Free: 3GB storage, 5GB transfer
   - Launch: US$ 19/mês

3. **Render PostgreSQL** - Já incluído no Render
   - Free: Testes (expira após 90 dias)
   - Starter: US$ 7/mês

4. **DigitalOcean Managed Database** - [digitalocean.com](https://digitalocean.com)
   - Starter: US$ 15/mês

---

## 🖥️ Hospedagem Recomendada

1. **Render** - [render.com](https://render.com)
   - Free ou US$ 7/mês
   - Deploy automático, SSL grátis

2. **Railway** - [railway.app](https://railway.app)
   - Free (US$ 5 créditos/mês) ou US$ 20/mês
   - Preview deploys, PostgreSQL incluído

3. **Fly.io** - [fly.io](https://fly.io)
   - Free tier generoso
   - Global edge computing

4. **DigitalOcean App Platform** - [digitalocean.com](https://digitalocean.com)
   - US$ 5/mês
   - Escalável, integração com databases

---

## 💰 Custos Estimados

### Plano Gratuito (Testes)
- **API**: Render Free ou Railway Free
- **Banco**: Supabase Free ou Neon Free
- **Total**: **US$ 0/mês**
- **Limitações**: Pode dormir após inatividade

### Plano Básico (Produção Pequena)
- **API**: Render Starter (US$ 7/mês)
- **Banco**: Supabase Free ou Neon Free
- **Total**: **US$ 7/mês**

### Plano Médio (Produção)
- **API**: Render Starter (US$ 7/mês)
- **Banco**: Supabase Pro (US$ 25/mês)
- **Total**: **US$ 32/mês**

---

## 🐛 Troubleshooting

### Problema: Build Falha
**Solução**: Verifique logs, teste build local:
```bash
cd api-lojas
npm ci
npm run build
```

### Problema: Aplicação Não Inicia
**Solução**: Verifique variáveis de ambiente e logs

### Problema: Health Check Falha
**Solução**: Aumente grace period, verifique `/health` endpoint

### Problema: Banco Não Conecta
**Solução**: Use Internal Database URL, verifique região

---

## 📞 Suporte

- 📚 **Documentação**: Consulte os guias acima
- 🐛 **Issues**: Abra uma issue no GitHub
- 💬 **Render Support**: Dashboard do Render → Support
- 📖 **Docs Render**: [render.com/docs](https://render.com/docs)

---

## 🔗 Links Úteis

- [Documentação NestJS](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Render Docs](https://render.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Neon Docs](https://neon.tech/docs)

---

**MONT Tecnologia da Informação** - MontShop SaaS

**Última atualização**: Janeiro 2025


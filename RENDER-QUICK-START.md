# ⚡ Quick Start - Deploy no Render

Guia rápido para deploy da API MontShop no Render.com

## 🚀 Deploy em 5 Minutos

### 1. Preparar Repositório
```bash
# Certifique-se de que o render.yaml está commitado
git add api-lojas/render.yaml
git commit -m "chore: adiciona configuração Render"
git push origin main
```

### 2. Criar no Render

#### Opção A: Blueprint (Recomendado)
1. Acesse [render.com](https://render.com)
2. **New +** → **Blueprint**
3. Conecte seu repositório GitHub
4. Render detectará `render.yaml` automaticamente
5. Clique em **Apply**

#### Opção B: Manual
1. **New +** → **PostgreSQL** → Criar banco
2. **New +** → **Web Service** → Conectar repositório
3. Configurar:
   - Root Directory: `api-lojas`
   - Build Command: `npm ci && npm run db:generate && npm run build`
   - Start Command: `npm run start:prod`
   - Health Check Path: `/health`

### 3. Configurar Variáveis

No serviço web, adicione em **Environment**:

```env
# Obrigatórias
DATABASE_URL=<internal_database_url>
JWT_SECRET=<gerar_chave_forte>
CORS_ORIGIN=https://seu-frontend.com
NODE_ENV=production

# Focus NFe
FOCUSNFE_API_KEY=<sua_api_key>
FOCUSNFE_BASE_URL=https://api.focusnfe.com.br
FISCAL_ENVIRONMENT=production

# Firebase
FIREBASE_PROJECT_ID=<projeto_id>
FIREBASE_CLIENT_EMAIL=<service_account_email>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=gs://seu-bucket.appspot.com
```

### 4. Executar Migrações

No **Shell** do serviço web:

```bash
npm run db:migrate:deploy
```

### 5. Verificar

- ✅ Health: `https://seu-servico.onrender.com/health`
- ✅ Swagger: `https://seu-servico.onrender.com/api/docs`

---

## 📚 Documentação Completa

Para instruções detalhadas, consulte: **[DEPLOY-RENDER.md](./DEPLOY-RENDER.md)**

---

## ⚠️ Checklist Pré-Deploy

- [ ] `render.yaml` commitado
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados criado
- [ ] Migrações executadas
- [ ] Health check funcionando
- [ ] SSL configurado (automático no Render)

---

**Dúvidas?** Consulte o guia completo em `DEPLOY-RENDER.md`


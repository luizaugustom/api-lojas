# 📝 Variáveis de Ambiente - API MontShop

## 📁 Arquivos de Configuração

- `env.example` - Arquivo de exemplo com todas as variáveis disponíveis
- `CONFIGURACAO.md` - Guia completo e detalhado de configuração

## 🚀 Início Rápido

```bash
# 1. Copiar o arquivo de exemplo
cp env.example .env

# 2. Editar o arquivo .env com suas configurações
nano .env

# 3. Instalar dependências
npm install

# 4. Configurar o banco de dados
npm run db:generate
npm run db:migrate

# 5. Iniciar a aplicação
npm run start:dev
```

## ⚙️ Variáveis Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL de conexão com PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Chave secreta para tokens JWT | `sua-chave-secreta-forte` |
| `FOCUSNFE_API_KEY` | API Key do Focus NFe (todas empresas) | `sua-api-key` |
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase | `seu-projeto-123` |
| `FIREBASE_CLIENT_EMAIL` | Email da conta de serviço | `firebase-adminsdk@projeto.iam...` |
| `FIREBASE_PRIVATE_KEY` | Chave privada do Firebase | `-----BEGIN PRIVATE KEY-----\n...` |
| `FIREBASE_STORAGE_BUCKET` | Bucket do Firebase Storage | `projeto.appspot.com` |

## 🔧 Variáveis Opcionais

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | `3000` |
| `NODE_ENV` | Ambiente de execução | `production` |
| `CORS_ORIGIN` | Origens permitidas no CORS | `*` |
| `THROTTLE_TTL` | Tempo de janela do rate limit (seg) | `60` |
| `THROTTLE_LIMIT` | Limite de requisições por janela | `100` |
| `FISCAL_ENVIRONMENT` | Ambiente fiscal (sandbox/production) | `sandbox` |
| `SMTP_HOST` | Servidor SMTP | - |
| `SMTP_PORT` | Porta SMTP | `587` |
| `SMTP_USER` | Usuário SMTP | - |
| `SMTP_PASS` | Senha SMTP | - |
| `WHATSAPP_API_URL` | URL da API WhatsApp | - |
| `WHATSAPP_TOKEN` | Token WhatsApp | - |
| `N8N_WEBHOOK_URL` | URL do webhook N8N | - |
| `IBPT_TOKEN` | Token da API IBPT | - |

## 📌 Notas Importantes

### 🏢 Focus NFe - Configuração por Empresa vs Global

**Configuração Global (neste arquivo .env):**
- ✅ API Key do Focus NFe (uma para todas as empresas)
- ✅ Ambiente (sandbox ou production)
- ✅ URL base da API

**Configuração Individual (na interface de cada empresa):**
- 📝 CNPJ da empresa
- 📝 Regime tributário
- 📝 CSC (Código de Segurança do Contribuinte)
- 📝 Série da NFC-e
- 📝 Código IBGE do município
- 📝 Certificado Digital A1 (se necessário)

### 🔐 Segurança

- **NUNCA** commite o arquivo `.env` no Git
- Use sempre senhas fortes e únicas
- Gere a `JWT_SECRET` usando: 
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

### 🔥 Firebase

A chave privada deve manter as quebras de linha (`\n`). Exemplo:
```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n...key...\n-----END PRIVATE KEY-----\n"
```

### 📧 Email (Gmail)

Para usar Gmail:
1. Ative a verificação em 2 etapas
2. Gere uma "Senha de App" em: https://myaccount.google.com/apppasswords
3. Use a senha de app no campo `SMTP_PASS`

## 🔍 Verificar Instalação

Após configurar e iniciar, acesse:

- **API**: http://localhost:3000
- **Swagger**: http://localhost:3000/api/docs
- **Health**: http://localhost:3000/api/health

## 📚 Documentação Completa

Para um guia detalhado passo a passo, consulte o arquivo `CONFIGURACAO.md`.

---

**MONT Tecnologia da Informação** - MontShop SaaS


# 🎯 LEIA-ME PRIMEIRO - Configuração da API MontShop

## 📦 Arquivos Criados

✅ `env.example` - Template com todas as variáveis de ambiente  
✅ `README-ENV.md` - Guia rápido de referência  
✅ `CONFIGURACAO.md` - Guia completo passo a passo  

## 🚀 Começar Agora (5 minutos)

### 1️⃣ Copiar o arquivo de exemplo
```bash
cp env.example .env
```

### 2️⃣ Editar as variáveis OBRIGATÓRIAS no arquivo `.env`

```env
# Banco de dados PostgreSQL
DATABASE_URL=postgresql://usuario:senha@localhost:5432/montshop

# Segurança (gere uma chave forte)
JWT_SECRET=sua-chave-secreta-aqui

# Focus NFe (UMA API KEY PARA TODAS AS EMPRESAS)
FOCUSNFE_API_KEY=sua-api-key-do-focus-nfe
FISCAL_ENVIRONMENT=sandbox

# Firebase Storage (para imagens dos produtos)
FIREBASE_PROJECT_ID=seu-projeto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@seu-projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
```

### 3️⃣ Instalar e iniciar
```bash
npm install
npm run db:generate
npm run db:migrate
npm run start:dev
```

### 4️⃣ Testar
Acesse: http://localhost:3000/api/docs

---

## ⚡ Variáveis Mais Importantes

### 🔐 DATABASE_URL
Conexão com o banco PostgreSQL. 

**Formato:**
```
postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO
```

### 🔑 JWT_SECRET
Chave secreta para autenticação. **Gere uma forte:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 📄 FOCUSNFE_API_KEY
API Key do Focus NFe - **UMA SÓ PARA TODAS AS EMPRESAS**

**Como obter:**
1. Acesse https://focusnfe.com.br
2. Crie uma conta
3. No painel, copie sua API Key
4. Cole no `.env`

**⚠️ IMPORTANTE:** Os dados fiscais de cada empresa (CNPJ, CSC, regime tributário, etc.) são configurados **individualmente na interface web** de cada empresa, não aqui!

### 🔥 Firebase (Variáveis)
Usado para armazenar imagens dos produtos.

**Como obter:**
1. Acesse https://console.firebase.google.com
2. Crie um projeto
3. Vá em **Configurações** → **Contas de Serviço**
4. Clique em **Gerar nova chave privada**
5. Copie os dados do JSON baixado para o `.env`

---

## 🎨 Diagrama de Configuração

```
┌─────────────────────────────────────────────────┐
│           CONFIGURAÇÃO GLOBAL (.env)            │
├─────────────────────────────────────────────────┤
│  ✓ Focus NFe API Key (uma para todas)          │
│  ✓ Firebase (armazenamento de imagens)         │
│  ✓ JWT Secret (autenticação)                   │
│  ✓ Banco de dados                               │
│  ✓ Email SMTP                                   │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│      CONFIGURAÇÃO POR EMPRESA (Interface)       │
├─────────────────────────────────────────────────┤
│  📝 CNPJ da empresa                             │
│  📝 Regime tributário (Simples, Lucro Real...)  │
│  📝 CSC (Código de Segurança)                   │
│  📝 Série da NFC-e                              │
│  📝 Certificado Digital A1                      │
│  📝 Código IBGE do município                    │
└─────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Configuração

- [ ] PostgreSQL instalado e rodando
- [ ] Arquivo `.env` criado e editado
- [ ] `DATABASE_URL` configurada corretamente
- [ ] `JWT_SECRET` gerada (chave forte)
- [ ] Conta no Focus NFe criada
- [ ] `FOCUSNFE_API_KEY` configurada
- [ ] Projeto no Firebase criado
- [ ] Variáveis do Firebase configuradas
- [ ] Dependências instaladas (`npm install`)
- [ ] Migrations executadas (`npm run db:migrate`)
- [ ] Servidor iniciado com sucesso

---

## 🆘 Problemas Comuns

### ❌ Erro: "DATABASE_URL não configurada"
**Solução:** Verifique se o arquivo `.env` existe e tem a variável `DATABASE_URL`

### ❌ Erro: "Não foi possível conectar ao banco"
**Solução:** 
- Verifique se o PostgreSQL está rodando
- Confirme usuário, senha e nome do banco
- Teste a conexão manualmente

### ❌ Erro: "Firebase credentials not configured"
**Solução:** Verifique todas as variáveis `FIREBASE_*` no `.env`

### ❌ Erro: "Invalid JWT secret"
**Solução:** Gere uma nova `JWT_SECRET` usando o comando fornecido

---

## 📚 Documentação

| Arquivo | Conteúdo |
|---------|----------|
| `env.example` | 📝 Template completo de variáveis |
| `README-ENV.md` | ⚡ Referência rápida |
| `CONFIGURACAO.md` | 📖 Guia completo passo a passo |
| Este arquivo | 🎯 Início rápido |

---

## 🎓 Próximos Passos

Após configurar a API:

1. ✅ Testar no Swagger: http://localhost:3000/api/docs
2. 📱 Configurar o frontend (front-lojas)
3. 🏢 Criar a primeira empresa no sistema
4. 📄 Configurar dados fiscais da empresa
5. 🛍️ Começar a usar!

---

## 💡 Dicas

- Use `FISCAL_ENVIRONMENT=sandbox` para testes
- Troque para `production` só quando tiver certeza
- Faça backup do `.env` em local seguro
- **NUNCA** commite o `.env` no Git
- Configure HTTPS em produção

---

**🚀 Bom trabalho!**

*MONT Tecnologia da Informação*


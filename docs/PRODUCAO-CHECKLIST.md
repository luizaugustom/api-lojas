# ✅ Checklist de Produção - Digital Ocean

## 🔍 Verificações Antes de Subir para Produção

### 1. ✅ Envio Automático de Mensagens

**Status:** ✅ **IMPLEMENTADO E FUNCIONANDO**

- ✅ Serviço `InstallmentMessagingService` configurado
- ✅ Cron job executando diariamente às 7h (horário de Brasília)
- ✅ Verifica `autoMessageEnabled` no modelo Company
- ✅ Filtra apenas empresas com planos PLUS, PRO ou TRIAL_7_DAYS
- ✅ Envia mensagens para parcelas vencidas ou vencendo hoje
- ✅ Evita spam (envia a cada 3 dias para parcelas atrasadas)

**Como funciona:**
```typescript
// Executa diariamente às 7h (horário de Brasília)
@Cron('0 7 * * *', {
  timeZone: 'America/Sao_Paulo',
})
async checkInstallmentsAndSendMessages() {
  // Busca empresas com autoMessageEnabled: true
  // Processa parcelas não pagas
  // Envia mensagens via WhatsApp
}
```

### 2. ✅ Melhorias Implementadas para Produção

#### 2.1. ✅ Validação de Instância Conectada

**Status:** ✅ **IMPLEMENTADO**

- Verifica status da instância antes de iniciar o processamento diário
- Verifica status antes de cada envio (com cache para performance)
- Aborta processamento se instância não estiver conectada

#### 2.2. ✅ Rate Limiting para WhatsApp

**Status:** ✅ **IMPLEMENTADO**

- Rate limiting por empresa: máximo 50 mensagens por hora por empresa
- Contador automático que reseta a cada hora
- Sistema para automaticamente quando limite é atingido

#### 2.3. ✅ Retry Logic

**Status:** ✅ **IMPLEMENTADO**

- Sistema de retry com até 3 tentativas
- Backoff exponencial: 1s, 2s, 4s entre tentativas
- Retry apenas para erros recuperáveis (timeout, 5xx, 429)

#### 2.4. ✅ Monitoramento e Logging

**Status:** ✅ **IMPLEMENTADO**

- Logging estruturado com emojis para fácil identificação
- Métricas detalhadas: tempo de execução, contadores de sucesso/falha
- Estatísticas por empresa e global
- Stack traces para debugging

---

## 📋 Configurações de Ambiente (.env)

### Variáveis Obrigatórias para Produção

```env
# Ambiente
NODE_ENV=production
PORT=3000

# CORS - IMPORTANTE: Configure apenas seu domínio
CORS_ORIGIN=https://seudominio.com

# Banco de Dados
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# JWT - CRÍTICO: Use uma chave forte e única
JWT_SECRET=sua-chave-super-secreta-e-longa-aqui-minimo-32-caracteres

# Evolution API
EVOLUTION_API_URL=https://api.seudominio.com:8080
EVOLUTION_API_KEY=sua-api-key-segura
EVOLUTION_INSTANCE=nome-da-instancia

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### Variáveis Opcionais

```env
# Firebase (se usar)
FIREBASE_PROJECT_ID=seu-projeto
FIREBASE_CLIENT_EMAIL=seu-email
FIREBASE_PRIVATE_KEY="sua-chave"
FIREBASE_STORAGE_BUCKET=seu-bucket

# Focus NFe (se usar)
FOCUSNFE_API_KEY=sua-chave
FOCUSNFE_BASE_URL=https://api.focusnfe.com.br
FISCAL_ENVIRONMENT=production
```

---

## 🚀 Passos para Deploy na Digital Ocean

### 1. Preparar Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Instalar Git (para clonar Evolution API)
sudo apt install git -y

# Instalar PM2 globalmente
sudo npm install -g pm2
```

### 2. Configurar Banco de Dados

```bash
# Criar banco de dados
sudo -u postgres psql
CREATE DATABASE api_lojas;
CREATE USER api_user WITH PASSWORD 'senha-segura';
GRANT ALL PRIVILEGES ON DATABASE api_lojas TO api_user;
\q
```

### 3. Configurar Evolution API (Sem Docker - PM2)

```bash
# Na pasta do projeto api-lojas
cd /caminho/para/api-lojas

# Dar permissão de execução ao script
chmod +x scripts/install-evolution-api.sh

# Executar instalação
./scripts/install-evolution-api.sh

# Configurar API Key no arquivo .env da Evolution API
nano ~/evolution-api/.env
# Altere AUTHENTICATION_API_KEY para uma chave forte e segura

# A Evolution API será iniciada junto com a API via PM2 (veja Passo 5)
```

### 4. Configurar Aplicação

```bash
# Clonar repositório
git clone seu-repositorio.git
cd api-lojas

# Instalar dependências
npm install

# Configurar .env
cp env.example .env
nano .env  # Editar com suas configurações

# Executar migrações
npm run db:migrate:deploy

# ⚠️ IMPORTANTE: Após o deploy, certifique-se de que a migration
# 20250130000000_add_focus_nfe_to_company foi aplicada com sucesso
# Esta migration adiciona os campos de configuração do Focus NFe por empresa

# Build
npm run build
```

### 5. Configurar PM2 (Process Manager)

```bash
# Instalar PM2
npm install -g pm2

# O arquivo ecosystem.config.js já está no repositório
# Ele configura tanto a API do MontShop quanto a Evolution API
# Verifique se o caminho da Evolution API está correto no arquivo
# Se necessário, ajuste a variável EVOLUTION_API_DIR no ecosystem.config.js

# Criar diretório de logs
mkdir -p logs

# Iniciar ambas as aplicações (API do MontShop + Evolution API)
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Ver logs
pm2 logs

# Salvar configuração
pm2 save
pm2 startup
```

### 6. Configurar Nginx (Reverso Proxy)

```bash
# Instalar Nginx
sudo apt install nginx -y

# Configurar
sudo nano /etc/nginx/sites-available/api-lojas
```

```nginx
server {
    listen 80;
    server_name api.seudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/api-lojas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Configurar SSL (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado
sudo certbot --nginx -d api.seudominio.com
```

---

## ⚠️ Melhorias Recomendadas ANTES de Produção

### 1. Adicionar Verificação de Instância Conectada

**Arquivo:** `api-lojas/src/application/whatsapp/whatsapp.service.ts`

Adicionar método para verificar status da instância antes de enviar.

### 2. Implementar Retry Logic

**Arquivo:** `api-lojas/src/application/whatsapp/whatsapp.service.ts`

Adicionar retry com backoff exponencial para falhas temporárias.

### 3. Adicionar Rate Limiting Específico

**Arquivo:** `api-lojas/src/application/installment/installment-messaging.service.ts`

Limitar número de mensagens por empresa/hora.

### 4. Melhorar Logging

Adicionar logging estruturado com níveis apropriados.

---

## 🔒 Segurança

### Checklist de Segurança

- [ ] JWT_SECRET é forte e único
- [ ] CORS_ORIGIN está configurado apenas para seu domínio
- [ ] Banco de dados usa SSL/TLS
- [ ] Evolution API está em rede privada ou com autenticação
- [ ] Firewall configurado (apenas portas necessárias)
- [ ] SSL/TLS configurado (HTTPS)
- [ ] Rate limiting ativado
- [ ] Logs não contêm informações sensíveis

---

## 📊 Monitoramento

### Logs

```bash
# Ver logs da aplicação
pm2 logs api-lojas

# Ver logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Ver logs da Evolution API
docker-compose -f ~/evolution-api/docker-compose.yml logs -f
```

### Métricas

- Monitorar uso de CPU e memória
- Monitorar conexões do banco de dados
- Monitorar taxa de erro nas requisições
- Monitorar tempo de resposta

---

## ✅ Status Final

### ✅ Pronto para Produção

- ✅ Envio automático implementado
- ✅ Toggle `autoMessageEnabled` funcionando
- ✅ Cron job configurado
- ✅ Tratamento básico de erros
- ✅ Validações de segurança

### ⚠️ Melhorias Recomendadas (Opcional)

- ⚠️ Verificação de instância conectada
- ⚠️ Retry logic
- ⚠️ Rate limiting específico
- ⚠️ Métricas e alertas

**Conclusão:** O sistema está **FUNCIONAL** para produção, mas as melhorias recomendadas aumentariam a robustez.


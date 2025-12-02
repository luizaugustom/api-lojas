# 🚀 Instalação da Evolution API em Produção (Digital Ocean - Sem Docker)

Este guia mostra como instalar e configurar a Evolution API para rodar junto com a API MontShop em produção na Digital Ocean, **sem usar Docker**.

## 📋 Pré-requisitos

- Servidor Ubuntu/Debian na Digital Ocean
- Node.js 18+ instalado
- Acesso SSH ao servidor
- Usuário não-root (recomendado)

## 🚀 Instalação Automática (Recomendado)

### Passo 1: Preparar o Servidor

```bash
# Conectar ao servidor via SSH
ssh usuario@seu-servidor

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20 (se não estiver instalado)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar Git (se não estiver instalado)
sudo apt install git -y
```

### Passo 2: Clonar/Atualizar o Repositório

```bash
# Navegar para o diretório onde está a API
cd ~/api-lojas  # ou onde você clonou o repositório

# Garantir que está na branch correta
git pull origin main  # ou sua branch de produção
```

### Passo 3: Executar Script de Setup

```bash
# Dar permissão de execução
chmod +x scripts/setup-production.sh

# Executar script de setup
./scripts/setup-production.sh
```

O script irá:
- ✅ Instalar/atualizar Node.js e PM2
- ✅ Instalar a Evolution API
- ✅ Configurar variáveis de ambiente
- ✅ Instalar dependências da API
- ✅ Executar migrações do banco
- ✅ Fazer build da aplicação
- ✅ Configurar PM2 para gerenciar ambas as aplicações
- ✅ Configurar PM2 para iniciar no boot

## 📝 Instalação Manual (Passo a Passo)

Se preferir fazer manualmente ou se o script automático falhar:

### 1. Instalar Evolution API

```bash
# Criar diretório
mkdir -p ~/evolution-api
cd ~/evolution-api

# Clonar repositório
git clone https://github.com/EvolutionAPI/evolution-api.git .

# Instalar dependências
npm install

# Criar arquivo .env
cat > .env << EOF
SERVER_URL=http://localhost:8080
PORT=8080

DATABASE_ENABLED=true
DATABASE_PROVIDER=sqlite
DATABASE_NAME=evolution

AUTHENTICATION_API_KEY=sua-chave-secreta-forte-aqui
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true

QRCODE_LIMIT=30
QRCODE_COLOR=#198754

LOG_LEVEL=ERROR
LOG_COLOR=true
LOG_BAILEYS=error

WEBHOOK_GLOBAL_URL=
WEBHOOK_GLOBAL_ENABLED=false

REDIS_ENABLED=false
EOF

# Criar diretórios necessários
mkdir -p instances store logs
```

**⚠️ IMPORTANTE:** Anote a `AUTHENTICATION_API_KEY` que você definiu acima!

### 2. Configurar .env da API MontShop

```bash
cd ~/api-lojas  # ou onde está sua API

# Editar .env
nano .env
```

Adicione/atualize as seguintes variáveis:

```env
# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua-chave-secreta-forte-aqui
EVOLUTION_INSTANCE=montshop
```

**⚠️ IMPORTANTE:** 
- `EVOLUTION_API_KEY` deve ser **exatamente igual** ao `AUTHENTICATION_API_KEY` do .env da Evolution API
- `EVOLUTION_INSTANCE` será o nome da instância que você criará depois

### 3. Instalar Dependências e Build

```bash
# Instalar dependências
npm install

# Executar migrações
npm run db:migrate:deploy

# Build da aplicação
npm run build
```

### 4. Configurar PM2

```bash
# Criar diretório de logs
mkdir -p logs

# Definir variável de ambiente (opcional, se quiser usar caminho customizado)
export EVOLUTION_API_DIR="$HOME/evolution-api"

# Iniciar aplicações
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup
# Execute o comando que aparecer (geralmente algo como: sudo env PATH=... pm2 startup systemd -u usuario --hp /home/usuario)
```

## 🔧 Configuração da Instância WhatsApp

Após instalar, você precisa criar uma instância do WhatsApp:

### Opção 1: Via Interface Web

1. Acesse `http://seu-servidor:8080` (ou configure um proxy reverso)
2. Crie uma nova instância
3. Escaneie o QR Code com seu WhatsApp

### Opção 2: Via API

```bash
# Criar instância
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: sua-chave-secreta-forte-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "montshop",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'

# Obter QR Code
curl -X GET http://localhost:8080/instance/connect/montshop \
  -H "apikey: sua-chave-secreta-forte-aqui"
```

### Atualizar EVOLUTION_INSTANCE no .env

Após criar a instância, atualize o `.env` da API:

```env
EVOLUTION_INSTANCE=montshop  # ou o nome que você escolheu
```

Reinicie a API:

```bash
pm2 restart api-lojas
```

## 📊 Gerenciamento com PM2

### Comandos Úteis

```bash
# Ver status de todas as aplicações
pm2 status

# Ver logs
pm2 logs                    # Todas as aplicações
pm2 logs api-lojas          # Apenas API MontShop
pm2 logs evolution-api      # Apenas Evolution API

# Reiniciar aplicações
pm2 restart all             # Todas
pm2 restart api-lojas       # Apenas API
pm2 restart evolution-api   # Apenas Evolution API

# Parar aplicações
pm2 stop all
pm2 stop api-lojas
pm2 stop evolution-api

# Monitoramento em tempo real
pm2 monit

# Ver informações detalhadas
pm2 describe api-lojas
pm2 describe evolution-api
```

### Verificar se Está Funcionando

```bash
# Verificar status da instância WhatsApp
curl -X GET http://localhost:3000/whatsapp/status \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

Resposta esperada:
```json
{
  "connected": true,
  "status": "open",
  "message": "Instância WhatsApp conectada e pronta para enviar mensagens"
}
```

## 🔒 Configurar Proxy Reverso (Nginx)

Para acessar a Evolution API externamente (opcional):

```nginx
# Adicionar ao arquivo de configuração do Nginx
server {
    listen 80;
    server_name evolution.seudominio.com;

    location / {
        proxy_pass http://localhost:8080;
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

**⚠️ IMPORTANTE:** Se expor a Evolution API externamente, use autenticação adicional ou firewall!

## 🔄 Atualização

### Atualizar Evolution API

```bash
cd ~/evolution-api
git pull origin main
npm install
pm2 restart evolution-api
```

### Atualizar API MontShop

```bash
cd ~/api-lojas
git pull origin main
npm install
npm run build
pm2 restart api-lojas
```

## 🐛 Troubleshooting

### Problema: Evolution API não inicia

```bash
# Verificar logs
pm2 logs evolution-api --lines 50

# Verificar se a porta 8080 está em uso
sudo netstat -tulpn | grep 8080

# Verificar permissões
ls -la ~/evolution-api
```

### Problema: API não consegue conectar à Evolution API

1. Verificar se a Evolution API está rodando:
   ```bash
   pm2 status evolution-api
   ```

2. Testar conexão:
   ```bash
   curl http://localhost:8080
   ```

3. Verificar variáveis de ambiente:
   ```bash
   cat ~/api-lojas/.env | grep EVOLUTION
   ```

### Problema: PM2 não inicia no boot

```bash
# Reconfigurar startup
pm2 unstartup
pm2 startup
# Execute o comando que aparecer
```

### Problema: Instância WhatsApp desconectada

1. Verificar status:
   ```bash
   curl -X GET http://localhost:8080/instance/fetchInstances \
     -H "apikey: sua-api-key"
   ```

2. Gerar novo QR Code:
   ```bash
   curl -X GET http://localhost:8080/instance/connect/montshop \
     -H "apikey: sua-api-key"
   ```

## ✅ Checklist de Produção

- [ ] Evolution API instalada e rodando
- [ ] PM2 configurado e salvando configuração
- [ ] PM2 configurado para iniciar no boot
- [ ] Variáveis de ambiente configuradas no .env da API
- [ ] Instância do WhatsApp criada e conectada
- [ ] Teste de conexão funcionando: `GET /whatsapp/status`
- [ ] Logs sendo monitorados
- [ ] Backup do diretório `~/evolution-api/instances` configurado (opcional)

## 🎉 Pronto!

Agora você tem:
- ✅ Evolution API rodando sem Docker
- ✅ API MontShop rodando
- ✅ Ambas gerenciadas pelo PM2
- ✅ Iniciando automaticamente no boot
- ✅ Sistema de mensagens automáticas funcionando

O sistema enviará mensagens automáticas de cobrança diariamente às 7h (horário de Brasília)! 🚀


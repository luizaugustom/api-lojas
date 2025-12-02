# 🚀 Evolution API com PM2 - Produção Digital Ocean (Sem Docker)

## 📋 Visão Geral

Este guia explica como instalar e configurar a Evolution API para rodar junto com a API do MontShop usando **PM2** (sem Docker) na Digital Ocean.

## ✅ Pré-requisitos

- Node.js 18+ instalado
- PM2 instalado globalmente
- Git instalado
- Servidor Ubuntu/Debian na Digital Ocean

## 🔧 Instalação

### ⚡ Opção Rápida: Setup Automático Completo

Para configurar tudo automaticamente (recomendado):

```bash
# No servidor, na pasta do projeto
cd /caminho/para/api-lojas

# Dar permissão e executar
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh
```

Este script faz tudo automaticamente:
- ✅ Instala PM2
- ✅ Instala Evolution API
- ✅ Configura tudo
- ✅ Inicia serviços
- ✅ Configura para iniciar no boot

**📖 Para mais detalhes, consulte: [SETUP-AUTOMATICO-PRODUCAO.md](./SETUP-AUTOMATICO-PRODUCAO.md)**

---

### 📝 Opção Manual: Passo a Passo

### Passo 0: Instalar PM2 (Se ainda não tiver)

Se você receber o erro "pm2 command not found", instale o PM2 primeiro:

#### Opção A: Via Script (Recomendado)

```bash
# Na pasta do projeto api-lojas
cd /caminho/para/api-lojas

# Dar permissão de execução
chmod +x scripts/install-pm2.sh

# Executar instalação
./scripts/install-pm2.sh
```

#### Opção B: Manualmente

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Verificar instalação
pm2 --version

# Configurar para iniciar no boot
sudo pm2 startup
```

### Passo 1: Instalar Evolution API

Execute o script de instalação:

```bash
# No servidor, na pasta do projeto api-lojas
cd /caminho/para/api-lojas

# Dar permissão de execução
chmod +x scripts/install-evolution-api.sh

# Executar instalação
./scripts/install-evolution-api.sh
```

O script irá:
- ✅ Clonar o repositório da Evolution API em `~/evolution-api`
- ✅ Instalar todas as dependências
- ✅ Criar arquivo `.env` com configurações padrão

### Passo 2: Configurar API Key

**⚠️ IMPORTANTE:** Você precisa definir uma API Key forte e segura.

```bash
# Editar arquivo .env da Evolution API
nano ~/evolution-api/.env
```

Altere a linha:
```env
AUTHENTICATION_API_KEY=evolution-api-key-change-me
```

Para uma chave forte (mínimo 32 caracteres):
```env
AUTHENTICATION_API_KEY=EvoAPI-2024-ABC123-XYZ789-SECRET-KEY-123456
```

**💡 Dica:** Você pode gerar uma chave aleatória:
```bash
openssl rand -hex 32
```

### Passo 3: Configurar no Projeto MontShop

No arquivo `.env` do projeto `api-lojas`, configure:

```env
# Evolution API - URL local (mesmo servidor)
EVOLUTION_API_URL=http://localhost:8080

# Evolution API - API Key (DEVE ser igual ao AUTHENTICATION_API_KEY)
EVOLUTION_API_KEY=EvoAPI-2024-ABC123-XYZ789-SECRET-KEY-123456

# Evolution API - Nome da instância
EVOLUTION_INSTANCE=montshop
```

**⚠️ CRÍTICO:** A `EVOLUTION_API_KEY` no `.env` do MontShop **DEVE ser exatamente igual** ao `AUTHENTICATION_API_KEY` no `.env` da Evolution API!

### Passo 4: Configurar PM2

O arquivo `ecosystem.config.js` já está configurado para rodar ambos os serviços.

#### Opção A: Rodar ambos juntos (Recomendado)

```bash
# Iniciar ambos os serviços
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup
```

#### Opção B: Rodar separadamente

```bash
# Iniciar apenas a API do MontShop
pm2 start ecosystem.config.js --only api-lojas

# Iniciar apenas a Evolution API
pm2 start ecosystem.config.js --only evolution-api

# Salvar configuração
pm2 save
```

### Passo 5: Verificar Status

```bash
# Ver status de todos os processos
pm2 status

# Ver logs da Evolution API
pm2 logs evolution-api

# Ver logs da API do MontShop
pm2 logs api-lojas

# Ver logs de ambos
pm2 logs
```

## 📱 Configurar Instância do WhatsApp

### Passo 1: Verificar se Evolution API está rodando

```bash
# Verificar se está respondendo
curl http://localhost:8080

# Verificar status via PM2
pm2 status evolution-api
```

### Passo 2: Criar Instância

```bash
# Substitua pela sua API Key
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: EvoAPI-2024-ABC123-XYZ789-SECRET-KEY-123456" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "montshop",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

**Resposta:**
```json
{
  "instance": {
    "instanceName": "montshop",
    "status": "created"
  },
  "qrcode": {
    "code": "data:image/png;base64,..."
  }
}
```

### Passo 3: Escanear QR Code

1. Abra o WhatsApp no celular
2. Vá em **Configurações > Aparelhos conectados > Conectar um aparelho**
3. Escaneie o QR Code retornado na resposta da API

**💡 Dica:** Se precisar ver o QR Code novamente:
```bash
curl -X GET http://localhost:8080/instance/connect/montshop \
  -H "apikey: sua-api-key"
```

### Passo 4: Verificar Status da Instância

```bash
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: sua-api-key"
```

A instância deve aparecer com `status: "open"` quando conectada.

## 🔄 Gerenciamento com PM2

### Comandos Úteis

```bash
# Ver status de todos os processos
pm2 status

# Reiniciar Evolution API
pm2 restart evolution-api

# Reiniciar API do MontShop
pm2 restart api-lojas

# Reiniciar ambos
pm2 restart all

# Parar Evolution API
pm2 stop evolution-api

# Parar API do MontShop
pm2 stop api-lojas

# Ver logs em tempo real
pm2 logs

# Ver logs apenas da Evolution API
pm2 logs evolution-api --lines 100

# Verificar uso de memória/CPU
pm2 monit

# Deletar processo do PM2
pm2 delete evolution-api
```

### Atualizar Evolution API

```bash
# Parar o serviço
pm2 stop evolution-api

# Atualizar código
cd ~/evolution-api
git pull

# Atualizar dependências (se necessário)
npm install

# Reiniciar
pm2 restart evolution-api
```

## 🔒 Segurança

### 1. Firewall

Configure o firewall da Digital Ocean para:
- ✅ Permitir porta 80 (HTTP)
- ✅ Permitir porta 443 (HTTPS)
- ✅ Permitir porta 22 (SSH)
- ❌ **NÃO** expor porta 8080 publicamente (apenas localhost)

### 2. Acesso à Evolution API

A Evolution API estará disponível apenas em `localhost:8080`. Para acessar remotamente:

#### Opção A: SSH Tunnel (Recomendado)

```bash
# No seu computador local
ssh -L 8080:localhost:8080 usuario@ip-do-servidor

# Agora acesse http://localhost:8080 no seu navegador
```

#### Opção B: Via API (Mais Seguro)

Use curl para criar e gerenciar instâncias sem interface web.

### 3. API Key Forte

Use uma chave forte e única:
- Mínimo 32 caracteres
- Misture letras, números e caracteres especiais
- Não compartilhe a chave

## 📊 Monitoramento

### Verificar Saúde dos Serviços

```bash
# Status geral
pm2 status

# Uso de recursos
pm2 monit

# Verificar se Evolution API está respondendo
curl http://localhost:8080

# Verificar status da instância WhatsApp
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: sua-api-key"
```

### Logs

Os logs são salvos em:
- API do MontShop: `./logs/api-out.log` e `./logs/api-err.log`
- Evolution API: `./logs/evolution-out.log` e `./logs/evolution-err.log`

Ou via PM2:
```bash
pm2 logs --lines 100
```

## 🐛 Troubleshooting

### Problema: "Evolution API não inicia"

**Soluções:**
1. Verificar se Node.js está instalado: `node --version`
2. Verificar se as dependências foram instaladas: `cd ~/evolution-api && npm install`
3. Verificar logs: `pm2 logs evolution-api --lines 50`
4. Verificar se a porta 8080 está livre: `sudo lsof -i :8080`

### Problema: "Cannot connect to evolution-api"

**Soluções:**
1. Verificar se está rodando: `pm2 status evolution-api`
2. Verificar se está escutando na porta 8080: `curl http://localhost:8080`
3. Verificar variável `EVOLUTION_API_URL` no `.env` do MontShop (deve ser `http://localhost:8080`)

### Problema: "401 Unauthorized"

**Soluções:**
1. Verificar se `EVOLUTION_API_KEY` no `.env` do MontShop é igual ao `AUTHENTICATION_API_KEY` no `.env` da Evolution API
2. Verificar se não há espaços extras nas chaves
3. Reiniciar ambos os serviços: `pm2 restart all`

### Problema: "Instância não encontrada"

**Soluções:**
1. Listar instâncias: `curl -X GET http://localhost:8080/instance/fetchInstances -H "apikey: sua-key"`
2. Verificar se o nome em `EVOLUTION_INSTANCE` corresponde exatamente
3. Certifique-se de que a instância foi criada

### Problema: "Porta 8080 já em uso"

**Soluções:**
1. Verificar o que está usando a porta: `sudo lsof -i :8080`
2. Parar o processo que está usando a porta
3. Ou alterar a porta no `.env` da Evolution API (e atualizar `EVOLUTION_API_URL` no MontShop)

## 📝 Checklist de Produção

Antes de colocar em produção:

- [ ] Evolution API instalada em `~/evolution-api`
- [ ] Dependências instaladas (`npm install` na pasta da Evolution API)
- [ ] API Key forte configurada no `.env` da Evolution API
- [ ] `EVOLUTION_API_KEY` no `.env` do MontShop igual ao `AUTHENTICATION_API_KEY`
- [ ] `EVOLUTION_INSTANCE` configurado com o nome correto
- [ ] PM2 configurado e ambos os serviços rodando
- [ ] Instância do WhatsApp criada e conectada (status: `open`)
- [ ] Firewall configurado (porta 8080 não exposta publicamente)
- [ ] Logs sendo monitorados
- [ ] PM2 configurado para iniciar no boot (`pm2 startup`)

## 🎉 Pronto!

Agora a Evolution API está rodando junto com a API do MontShop usando PM2!

O sistema enviará mensagens automáticas de cobrança diariamente às 7h (horário de Brasília) para todas as empresas configuradas.

## 📚 Comandos Rápidos

```bash
# Iniciar tudo
pm2 start ecosystem.config.js

# Ver status
pm2 status

# Ver logs
pm2 logs

# Reiniciar tudo
pm2 restart all

# Parar tudo
pm2 stop all

# Salvar configuração
pm2 save
```


# 🚀 Instalação Automática para Produção - Digital Ocean

## 📋 Visão Geral

Este guia mostra como instalar automaticamente a API do MontShop junto com a Evolution API na Digital Ocean, **sem usar Docker**. Tudo será gerenciado pelo PM2 e iniciará automaticamente junto com o sistema.

## ✅ O Que Será Instalado

- ✅ Node.js 20
- ✅ PM2 (Process Manager)
- ✅ API do MontShop
- ✅ Evolution API (sem Docker)
- ✅ Configuração automática de variáveis de ambiente
- ✅ Inicialização automática no boot do sistema

## 🚀 Instalação Rápida (1 Comando)

```bash
sudo bash scripts/setup-production.sh
```

**Pronto!** O script fará tudo automaticamente.

---

## 📝 Instalação Passo a Passo

### Passo 1: Conectar ao Servidor

```bash
ssh root@seu-servidor-digital-ocean
```

### Passo 2: Clonar ou Fazer Upload do Repositório

Se ainda não tiver o código no servidor:

```bash
# Clonar repositório
git clone seu-repositorio.git
cd api-lojas

# OU fazer upload via SCP/FTP
```

### Passo 3: Executar Script de Setup

```bash
# Dar permissão de execução
chmod +x scripts/setup-production.sh
chmod +x scripts/install-evolution-api.sh

# Executar setup
sudo bash scripts/setup-production.sh
```

O script irá:
1. ✅ Atualizar o sistema
2. ✅ Instalar Node.js 20
3. ✅ Instalar PM2
4. ✅ Instalar dependências da API
5. ✅ Fazer build da API
6. ✅ Instalar Evolution API
7. ✅ Configurar arquivo .env
8. ✅ Executar migrações do banco
9. ✅ Iniciar tudo com PM2
10. ✅ Configurar para iniciar no boot

### Passo 4: Configurar Variáveis de Ambiente

O script já configura automaticamente as variáveis da Evolution API. Você só precisa ajustar outras variáveis importantes:

```bash
nano .env
```

**Variáveis importantes a configurar:**

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

# Evolution API (já configurado automaticamente)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=<gerado automaticamente>
EVOLUTION_INSTANCE=montshop
```

**A chave da Evolution API foi salva em:** `/opt/evolution-api/api-key.txt`

### Passo 5: Criar Instância do WhatsApp

1. Acesse: `http://seu-servidor:8080` (ou configure um proxy reverso)
2. Crie uma nova instância (ex: `montshop`)
3. Escaneie o QR Code com seu WhatsApp
4. Atualize `EVOLUTION_INSTANCE` no `.env` com o nome da instância criada

### Passo 6: Reiniciar API

```bash
pm2 restart api-lojas
```

---

## 🔧 Gerenciamento com PM2

### Ver Status

```bash
pm2 status
```

### Ver Logs

```bash
# Todos os logs
pm2 logs

# Apenas API
pm2 logs api-lojas

# Apenas Evolution API
pm2 logs evolution-api

# Logs em tempo real
pm2 logs --lines 100
```

### Reiniciar

```bash
# Reiniciar tudo
pm2 restart all

# Reiniciar apenas API
pm2 restart api-lojas

# Reiniciar apenas Evolution API
pm2 restart evolution-api
```

### Parar

```bash
# Parar tudo
pm2 stop all

# Parar apenas API
pm2 stop api-lojas
```

### Monitoramento

```bash
# Dashboard interativo
pm2 monit

# Informações detalhadas
pm2 info api-lojas
pm2 info evolution-api
```

---

## 🔍 Verificação

### Verificar se Está Funcionando

```bash
# Verificar status
pm2 status

# Verificar se API está respondendo
curl http://localhost:3000/health

# Verificar se Evolution API está respondendo
curl http://localhost:8080
```

### Verificar Logs

```bash
# Ver últimos logs
pm2 logs --lines 50

# Ver logs de erro
pm2 logs --err
```

---

## 🛠️ Troubleshooting

### Problema: PM2 não inicia no boot

**Solução:**
```bash
pm2 startup
# Execute o comando que aparecer
pm2 save
```

### Problema: Evolution API não inicia

**Solução:**
```bash
# Ver logs
pm2 logs evolution-api

# Verificar se diretório existe
ls -la /opt/evolution-api/evolution-api

# Reinstalar Evolution API
sudo bash scripts/install-evolution-api.sh
```

### Problema: Porta 8080 já em uso

**Solução:**
```bash
# Ver o que está usando a porta
sudo lsof -i :8080

# Parar processo ou mudar porta no .env da Evolution API
```

### Problema: API não conecta na Evolution API

**Solução:**
1. Verificar se Evolution API está rodando: `pm2 status`
2. Verificar se a chave API está correta no `.env`
3. Verificar se a instância está conectada: `GET /whatsapp/status`

---

## 📊 Estrutura de Arquivos

```
/opt/evolution-api/
├── evolution-api/          # Código da Evolution API
│   ├── .env               # Configurações
│   ├── instances/         # Instâncias do WhatsApp
│   └── store/             # Dados armazenados
└── api-key.txt            # Chave API gerada

/api-lojas/
├── dist/                  # Build da API
├── logs/                  # Logs do PM2
├── .env                   # Variáveis de ambiente
└── ecosystem.config.js    # Configuração do PM2
```

---

## 🔄 Atualização

### Atualizar API

```bash
cd api-lojas
git pull
npm install --production
npm run build
pm2 restart api-lojas
```

### Atualizar Evolution API

```bash
cd /opt/evolution-api/evolution-api
git pull
npm install --production
pm2 restart evolution-api
```

---

## 🔐 Segurança

### Firewall

```bash
# Permitir apenas portas necessárias
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Nginx como Proxy Reverso

Configure o Nginx para:
- Expor apenas a API na porta 443 (HTTPS)
- Manter Evolution API apenas em localhost:8080
- Não expor Evolution API publicamente

---

## ✅ Checklist Pós-Instalação

- [ ] API está rodando: `pm2 status`
- [ ] Evolution API está rodando: `pm2 status`
- [ ] API responde: `curl http://localhost:3000/health`
- [ ] Evolution API responde: `curl http://localhost:8080`
- [ ] Instância WhatsApp criada e conectada
- [ ] Variáveis de ambiente configuradas
- [ ] PM2 configurado para iniciar no boot
- [ ] Firewall configurado
- [ ] Nginx configurado (se usar)
- [ ] SSL configurado (se usar)

---

## 🎉 Pronto!

Agora você tem:
- ✅ API do MontShop rodando automaticamente
- ✅ Evolution API rodando automaticamente
- ✅ Tudo iniciando junto com o sistema
- ✅ Gerenciamento fácil com PM2

**As mensagens automáticas de cobrança funcionarão diariamente às 7h (horário de Brasília)!** 🚀


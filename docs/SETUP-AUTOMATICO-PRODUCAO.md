# 🚀 Setup Automático para Produção

## 📋 Visão Geral

Este guia explica como configurar tudo automaticamente para que a Evolution API e a API do MontShop iniciem automaticamente ao entrar em produção.

## ✅ Setup Completo Automático

### Opção 1: Script Completo (Recomendado)

Execute o script de setup completo que faz tudo automaticamente:

```bash
# No servidor Digital Ocean, na pasta do projeto
cd /caminho/para/api-lojas

# Dar permissão de execução
chmod +x scripts/setup-production.sh

# Executar setup completo
./scripts/setup-production.sh
```

O script irá:
1. ✅ Instalar PM2 (se não estiver instalado)
2. ✅ Instalar Evolution API (se não estiver instalada)
3. ✅ Verificar e criar arquivos de configuração
4. ✅ Criar diretórios necessários
5. ✅ Iniciar ambos os serviços com PM2
6. ✅ Configurar PM2 para iniciar no boot do sistema
7. ✅ Salvar configuração

### Opção 2: Passo a Passo Manual

Se preferir fazer manualmente:

#### 1. Instalar PM2

```bash
chmod +x scripts/install-pm2.sh
./scripts/install-pm2.sh
```

#### 2. Instalar Evolution API

```bash
chmod +x scripts/install-evolution-api.sh
./scripts/install-evolution-api.sh
```

#### 3. Configurar Variáveis de Ambiente

```bash
# Editar .env do projeto
nano .env

# Editar .env da Evolution API
nano ~/evolution-api/.env
```

#### 4. Iniciar Serviços

```bash
# Iniciar ambos os serviços
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
sudo pm2 startup
# Execute o comando que aparecer
```

## 🔄 Iniciar Serviços Automaticamente

### Verificar se Está Configurado

```bash
# Verificar se PM2 está configurado para iniciar no boot
pm2 startup

# Se já estiver configurado, você verá uma mensagem
# Se não estiver, siga as instruções que aparecerem
```

### Script de Inicialização Rápida

Se os serviços pararem por algum motivo, você pode usar:

```bash
# Script para iniciar serviços
chmod +x scripts/start-production.sh
./scripts/start-production.sh
```

Este script:
- ✅ Verifica se PM2 está instalado
- ✅ Verifica se Evolution API está instalada
- ✅ Inicia os serviços se não estiverem rodando
- ✅ Salva a configuração

## 🔧 Configuração do PM2 Startup

O PM2 precisa ser configurado para iniciar no boot do sistema. Isso é feito com:

```bash
sudo pm2 startup
```

Este comando irá gerar um comando específico para seu sistema. Execute o comando que aparecer.

**Exemplo de saída:**
```
[PM2] Init System found: systemd
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u seu-usuario --hp /home/seu-usuario
```

Execute o comando mostrado.

## ✅ Verificar se Está Funcionando

### 1. Verificar Status dos Serviços

```bash
pm2 status
```

Você deve ver:
- `api-lojas` - status: online
- `evolution-api` - status: online

### 2. Testar Reinicialização

```bash
# Reiniciar o servidor
sudo reboot

# Após reiniciar, verificar se os serviços iniciaram automaticamente
pm2 status
```

### 3. Verificar Logs

```bash
# Ver logs de ambos os serviços
pm2 logs

# Ver logs apenas da Evolution API
pm2 logs evolution-api

# Ver logs apenas da API do MontShop
pm2 logs api-lojas
```

## 🐛 Troubleshooting

### Problema: Serviços não iniciam após reiniciar o servidor

**Solução:**
1. Verificar se PM2 startup está configurado:
   ```bash
   pm2 startup
   ```
2. Se não estiver, execute o comando mostrado
3. Verificar se a configuração foi salva:
   ```bash
   pm2 save
   ```

### Problema: "PM2 startup command not found"

**Solução:**
1. Reinstalar PM2:
   ```bash
   sudo npm install -g pm2
   ```
2. Executar setup novamente:
   ```bash
   ./scripts/setup-production.sh
   ```

### Problema: Evolution API não inicia

**Soluções:**
1. Verificar se está instalada:
   ```bash
   ls -la ~/evolution-api
   ```
2. Verificar se o caminho está correto no `ecosystem.config.js`
3. Verificar logs:
   ```bash
   pm2 logs evolution-api --lines 50
   ```

### Problema: Porta 8080 já em uso

**Solução:**
1. Verificar o que está usando a porta:
   ```bash
   sudo lsof -i :8080
   ```
2. Parar o processo ou alterar a porta no `.env` da Evolution API

## 📝 Checklist de Produção

Antes de considerar tudo configurado:

- [ ] PM2 instalado e configurado
- [ ] Evolution API instalada
- [ ] Ambos os serviços rodando: `pm2 status`
- [ ] PM2 startup configurado: `pm2 startup` executado
- [ ] Configuração salva: `pm2 save` executado
- [ ] Teste de reinicialização: servidor reiniciado e serviços iniciaram automaticamente
- [ ] Logs sendo monitorados
- [ ] Instância do WhatsApp criada e conectada

## 🎉 Pronto!

Agora seus serviços iniciarão automaticamente sempre que o servidor reiniciar!

### Comandos Rápidos

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs

# Reiniciar tudo
pm2 restart all

# Parar tudo
pm2 stop all

# Iniciar tudo
pm2 start all

# Salvar configuração
pm2 save
```


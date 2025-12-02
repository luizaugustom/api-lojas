# 📦 Como Instalar PM2

## 🚀 Instalação Rápida

### Opção 1: Via Script (Recomendado)

```bash
# No servidor Digital Ocean, na pasta do projeto
cd /caminho/para/api-lojas

# Dar permissão de execução
chmod +x scripts/install-pm2.sh

# Executar instalação
./scripts/install-pm2.sh
```

O script irá:
- ✅ Verificar se Node.js está instalado (e instalar se necessário)
- ✅ Instalar PM2 globalmente
- ✅ Configurar PM2 para iniciar no boot do sistema

### Opção 2: Manualmente

```bash
# 1. Verificar se Node.js está instalado
node --version

# Se não estiver instalado, instale Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Instalar PM2 globalmente
sudo npm install -g pm2

# 3. Verificar instalação
pm2 --version

# 4. Configurar PM2 para iniciar no boot
sudo pm2 startup

# Siga as instruções que aparecerem no terminal
# Geralmente será algo como:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u seu-usuario --hp /home/seu-usuario
```

## ✅ Verificar Instalação

```bash
# Verificar versão do PM2
pm2 --version

# Verificar se está funcionando
pm2 list
```

Se tudo estiver correto, você verá uma lista vazia (ou processos já rodando).

## 🔧 Comandos Básicos do PM2

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js

# Ver status
pm2 status

# Ver logs
pm2 logs

# Reiniciar aplicação
pm2 restart all

# Parar aplicação
pm2 stop all

# Deletar aplicação
pm2 delete all

# Salvar configuração atual
pm2 save

# Verificar uso de recursos
pm2 monit
```

## 🐛 Troubleshooting

### Problema: "pm2 command not found"

**Solução:**
1. Verifique se o PM2 foi instalado: `npm list -g pm2`
2. Se não estiver, instale novamente: `sudo npm install -g pm2`
3. Verifique o PATH: `echo $PATH` (deve incluir `/usr/bin` ou `/usr/local/bin`)

### Problema: "Permission denied"

**Solução:**
- Use `sudo` para instalar globalmente: `sudo npm install -g pm2`
- Ou instale localmente no projeto: `npm install pm2`

### Problema: PM2 não inicia no boot

**Solução:**
1. Execute: `sudo pm2 startup`
2. Siga as instruções que aparecerem
3. Salve a configuração: `pm2 save`

## 📚 Próximos Passos

Após instalar o PM2:

1. ✅ Configure o `ecosystem.config.js`
2. ✅ Instale a Evolution API: `./scripts/install-evolution-api.sh`
3. ✅ Configure as variáveis de ambiente no `.env`
4. ✅ Inicie os serviços: `pm2 start ecosystem.config.js`
5. ✅ Salve a configuração: `pm2 save`

## 🎉 Pronto!

Agora você tem o PM2 instalado e configurado para gerenciar suas aplicações!


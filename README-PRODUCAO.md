# 🚀 Instalação Automática - Produção Digital Ocean

## ⚡ Instalação Rápida (1 Comando)

```bash
sudo bash scripts/setup-production.sh
```

**Pronto!** O script instala e configura tudo automaticamente.

---

## 📋 O Que Será Instalado

- ✅ Node.js 20
- ✅ PM2 (Process Manager)
- ✅ API do MontShop
- ✅ Evolution API (sem Docker)
- ✅ Configuração automática
- ✅ Inicialização automática no boot

---

## 📝 Passo a Passo

### 1. Conectar ao Servidor

```bash
ssh root@seu-servidor-digital-ocean
```

### 2. Clonar Repositório (se necessário)

```bash
git clone seu-repositorio.git
cd api-lojas
```

### 3. Executar Setup

```bash
chmod +x scripts/*.sh
sudo bash scripts/setup-production.sh
```

### 4. Configurar .env

```bash
nano .env
```

Configure:
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- Outras variáveis necessárias

**Nota:** As variáveis da Evolution API já são configuradas automaticamente!

### 5. Criar Instância WhatsApp

1. Acesse: `http://seu-servidor:8080`
2. Crie instância (ex: `montshop`)
3. Escaneie QR Code
4. Atualize `EVOLUTION_INSTANCE` no `.env`

### 6. Reiniciar

```bash
pm2 restart api-lojas
```

---

## 🔧 Comandos Úteis

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs

# Reiniciar tudo
pm2 restart all

# Parar tudo
pm2 stop all
```

---

## 📚 Documentação Completa

Veja: `docs/INSTALACAO-PRODUCAO-AUTOMATICA.md`

---

## ✅ Após Instalação

- [ ] API rodando: `pm2 status`
- [ ] Evolution API rodando: `pm2 status`
- [ ] Instância WhatsApp criada e conectada
- [ ] Variáveis de ambiente configuradas
- [ ] Testar: `curl http://localhost:3000/health`

---

## 🎉 Pronto!

Tudo funcionando automaticamente! 🚀


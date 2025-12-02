# ✅ Resumo: Instalação Automática - Evolution API + API MontShop

## 🎉 O Que Foi Criado

Sistema completo de instalação automática para produção na Digital Ocean **sem Docker**. Tudo é gerenciado pelo PM2 e inicia automaticamente junto com o sistema.

---

## 📁 Arquivos Criados

### 1. Scripts de Instalação

- **`scripts/install-evolution-api.sh`**
  - Instala a Evolution API sem Docker
  - Gera chave API automaticamente
  - Configura variáveis de ambiente
  - Cria estrutura de diretórios

- **`scripts/setup-production.sh`**
  - Script principal de setup completo
  - Instala Node.js, PM2, dependências
  - Faz build da API
  - Instala Evolution API
  - Configura tudo automaticamente

### 2. Configuração PM2

- **`ecosystem.config.js`**
  - Gerencia API do MontShop
  - Gerencia Evolution API
  - Configuração de logs, restart, etc.

### 3. Documentação

- **`docs/INSTALACAO-PRODUCAO-AUTOMATICA.md`** - Guia completo
- **`README-PRODUCAO.md`** - Guia rápido

---

## 🚀 Como Usar

### Instalação (1 Comando)

```bash
sudo bash scripts/setup-production.sh
```

**Pronto!** Tudo será instalado e configurado automaticamente.

---

## ✨ Funcionalidades

### ✅ Instalação Automática
- Node.js 20
- PM2
- Dependências da API
- Evolution API (sem Docker)
- Build da aplicação

### ✅ Configuração Automática
- Variáveis de ambiente da Evolution API
- Chave API gerada automaticamente
- Estrutura de diretórios
- Logs configurados

### ✅ Gerenciamento Automático
- PM2 gerencia ambos os serviços
- Reinicialização automática em caso de erro
- Inicialização automática no boot do sistema
- Logs centralizados

### ✅ Sem Intervenção Manual
- Tudo configurado automaticamente
- Chave API gerada e salva
- Variáveis atualizadas no .env
- Pronto para usar após instalação

---

## 📋 Após Instalação

1. **Configurar outras variáveis no .env:**
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `CORS_ORIGIN`

2. **Criar instância WhatsApp:**
   - Acesse: `http://seu-servidor:8080`
   - Crie instância (ex: `montshop`)
   - Escaneie QR Code

3. **Reiniciar API:**
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

## 📊 Estrutura

```
/opt/evolution-api/
├── evolution-api/          # Evolution API instalada
│   ├── .env               # Configurações
│   ├── instances/         # Instâncias WhatsApp
│   └── logs/             # Logs
└── api-key.txt           # Chave API gerada

/api-lojas/
├── dist/                  # Build da API
├── logs/                  # Logs PM2
├── .env                   # Variáveis (auto-configurado)
└── ecosystem.config.js    # Config PM2
```

---

## ✅ Vantagens

1. **Sem Docker** - Instalação direta, mais leve
2. **Automático** - Tudo configurado sem intervenção
3. **PM2** - Gerenciamento profissional de processos
4. **Boot** - Inicia automaticamente com o sistema
5. **Logs** - Centralizados e organizados
6. **Restart** - Reinicia automaticamente em caso de erro

---

## 🎯 Resultado Final

Após executar o script:

- ✅ API do MontShop rodando na porta 3000
- ✅ Evolution API rodando na porta 8080
- ✅ Tudo gerenciado pelo PM2
- ✅ Iniciando automaticamente no boot
- ✅ Logs organizados
- ✅ Pronto para produção!

**As mensagens automáticas de cobrança funcionarão diariamente às 7h!** 🚀


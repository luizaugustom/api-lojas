# 🚀 Evolution API em Produção - Guia Rápido

## Instalação Rápida

### No servidor (Digital Ocean):

```bash
# 1. Conectar ao servidor
ssh usuario@seu-servidor

# 2. Navegar para o diretório da API
cd ~/api-lojas

# 3. Executar script de setup
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh
```

## O que o script faz:

1. ✅ Instala/atualiza Node.js e PM2
2. ✅ Instala a Evolution API em `~/evolution-api`
3. ✅ Configura variáveis de ambiente automaticamente
4. ✅ Instala dependências e faz build da API
5. ✅ Configura PM2 para gerenciar ambas as aplicações
6. ✅ Configura PM2 para iniciar no boot

## Após a instalação:

1. **Criar instância do WhatsApp:**
   - Acesse: `http://seu-servidor:8080`
   - Crie uma nova instância (ex: `montshop`)
   - Escaneie o QR Code

2. **Atualizar .env:**
   ```env
   EVOLUTION_INSTANCE=montshop  # nome da instância criada
   ```

3. **Reiniciar API:**
   ```bash
   pm2 restart api-lojas
   ```

## Comandos Úteis:

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs

# Reiniciar tudo
pm2 restart all

# Monitoramento
pm2 monit
```

## Documentação Completa:

Veja `docs/INSTALACAO-EVOLUTION-API-PRODUCAO.md` para detalhes completos.


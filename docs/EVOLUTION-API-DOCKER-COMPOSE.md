# 🐳 Evolution API com Docker Compose - Produção Digital Ocean

## 📋 Visão Geral

Este guia explica como a Evolution API está configurada para rodar junto com a API do MontShop usando Docker Compose na Digital Ocean.

## ✅ Configuração Automática

A Evolution API já está configurada no `docker-compose.yml` para rodar automaticamente junto com a aplicação.

### Serviços Configurados

1. **app** - API do MontShop
2. **db** - PostgreSQL
3. **evolution-api** - Evolution API (WhatsApp)
4. **nginx** - Reverse Proxy

## 🔧 Configuração

### Passo 1: Configurar Variáveis de Ambiente

No arquivo `.env` do projeto `api-lojas`, configure:

```env
# Evolution API - URL interna do Docker (comunicação entre containers)
EVOLUTION_API_URL=http://evolution-api:8080

# Evolution API - API Key (deve ser forte e segura)
EVOLUTION_API_KEY=EvoAPI-2024-ABC123-XYZ789-SECRET-KEY-123456

# Evolution API - Nome da instância
EVOLUTION_INSTANCE=montshop
```

**⚠️ IMPORTANTE:**
- `EVOLUTION_API_URL` usa `http://evolution-api:8080` (nome do serviço Docker)
- Isso permite comunicação interna entre containers sem expor a porta externamente
- `EVOLUTION_API_KEY` deve ser exatamente igual ao `AUTHENTICATION_API_KEY` do serviço evolution-api no docker-compose

### Passo 2: Definir API Key Segura

Você pode definir a API Key de duas formas:

#### Opção A: Via arquivo .env (Recomendado)

```env
EVOLUTION_API_KEY=EvoAPI-2024-ABC123-XYZ789-SECRET-KEY-123456
```

#### Opção B: Via variável de ambiente do sistema

```bash
export EVOLUTION_API_KEY=EvoAPI-2024-ABC123-XYZ789-SECRET-KEY-123456
```

### Passo 3: Iniciar os Serviços

```bash
# Na pasta do projeto api-lojas
docker-compose up -d
```

Isso iniciará todos os serviços:
- ✅ API do MontShop (porta 3000)
- ✅ PostgreSQL (porta 5432)
- ✅ Evolution API (porta 8080 - interna)
- ✅ Nginx (portas 80 e 443)

### Passo 4: Verificar se Está Funcionando

```bash
# Verificar status dos containers
docker-compose ps

# Ver logs da Evolution API
docker-compose logs -f evolution-api

# Ver logs da API do MontShop
docker-compose logs -f app
```

## 📱 Configurar Instância do WhatsApp

### Passo 1: Acessar a Evolution API

A Evolution API estará disponível em `http://localhost:8080` (ou IP do servidor:8080).

**⚠️ IMPORTANTE:** Em produção, você pode querer expor a Evolution API externamente para configurar a instância. Você pode:

1. **Temporariamente expor a porta 8080** no firewall da Digital Ocean
2. **Usar SSH Tunnel** para acessar localmente
3. **Configurar via API** usando curl

### Passo 2: Criar Instância via API

```bash
# Substitua EVOLUTION_API_KEY pela sua chave
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

### Passo 4: Verificar Status

```bash
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: EvoAPI-2024-ABC123-XYZ789-SECRET-KEY-123456"
```

A instância deve aparecer com `status: "open"` quando conectada.

## 🔒 Segurança em Produção

### 1. API Key Forte

Use uma chave forte e única:

```bash
# Gerar chave aleatória (Linux/Mac)
openssl rand -hex 32

# Ou use um gerador online seguro
```

### 2. Firewall da Digital Ocean

Configure o firewall para:
- ✅ Permitir porta 80 (HTTP)
- ✅ Permitir porta 443 (HTTPS)
- ✅ Permitir porta 22 (SSH)
- ❌ **NÃO** expor porta 8080 publicamente (apenas internamente)

### 3. Acesso à Evolution API

Para acessar a Evolution API em produção:

#### Opção A: SSH Tunnel (Recomendado)

```bash
# No seu computador local
ssh -L 8080:localhost:8080 usuario@ip-do-servidor

# Agora acesse http://localhost:8080 no seu navegador
```

#### Opção B: Expor Temporariamente

1. Abra a porta 8080 no firewall da Digital Ocean (temporariamente)
2. Configure a instância
3. Feche a porta novamente

#### Opção C: Via API (Mais Seguro)

Use curl para criar e gerenciar instâncias sem interface web.

## 🔄 Atualizações e Manutenção

### Reiniciar Serviços

```bash
# Reiniciar todos os serviços
docker-compose restart

# Reiniciar apenas a Evolution API
docker-compose restart evolution-api

# Reiniciar apenas a API do MontShop
docker-compose restart app
```

### Ver Logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas Evolution API
docker-compose logs -f evolution-api

# Apenas API do MontShop
docker-compose logs -f app
```

### Atualizar Evolution API

```bash
# Parar o serviço
docker-compose stop evolution-api

# Atualizar imagem
docker-compose pull evolution-api

# Reiniciar
docker-compose up -d evolution-api
```

## 📊 Monitoramento

### Verificar Status dos Containers

```bash
docker-compose ps
```

### Verificar Saúde da Evolution API

```bash
# Verificar se está respondendo
curl http://localhost:8080

# Verificar status da instância
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: sua-api-key"
```

### Verificar Conexão da API do MontShop

```bash
# Via endpoint de status (requer autenticação)
curl -X GET http://localhost:3000/whatsapp/status \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

## 🐛 Troubleshooting

### Problema: "Cannot connect to evolution-api"

**Solução:**
1. Verifique se o serviço está rodando: `docker-compose ps`
2. Verifique se está na mesma rede Docker: `docker network ls`
3. Verifique os logs: `docker-compose logs evolution-api`

### Problema: "401 Unauthorized"

**Solução:**
1. Verifique se `EVOLUTION_API_KEY` no `.env` é igual ao `AUTHENTICATION_API_KEY` do docker-compose
2. Verifique se não há espaços extras na chave
3. Reinicie os serviços: `docker-compose restart`

### Problema: "Instância não encontrada"

**Solução:**
1. Liste as instâncias: `curl -X GET http://localhost:8080/instance/fetchInstances -H "apikey: sua-key"`
2. Verifique se o nome em `EVOLUTION_INSTANCE` corresponde exatamente
3. Certifique-se de que a instância foi criada

### Problema: "Instância desconectada"

**Solução:**
1. Verifique se o WhatsApp ainda está conectado no celular
2. Gere um novo QR Code:
   ```bash
   curl -X GET http://localhost:8080/instance/connect/montshop \
     -H "apikey: sua-key"
   ```
3. Escaneie novamente

### Problema: Volumes não persistem

**Solução:**
Os volumes estão configurados para persistir. Verifique:
```bash
docker volume ls
docker volume inspect api-lojas_evolution_instances
```

## 📝 Checklist de Produção

Antes de colocar em produção:

- [ ] API Key forte configurada (mínimo 32 caracteres)
- [ ] `EVOLUTION_API_KEY` no `.env` igual ao `AUTHENTICATION_API_KEY` do docker-compose
- [ ] `EVOLUTION_INSTANCE` configurado com o nome correto da instância
- [ ] Instância do WhatsApp criada e conectada (status: `open`)
- [ ] Firewall configurado (porta 8080 não exposta publicamente)
- [ ] Volumes persistentes funcionando
- [ ] Logs sendo monitorados
- [ ] Backup dos volumes configurado (opcional mas recomendado)

## 🎉 Pronto!

Agora a Evolution API está rodando junto com a API do MontShop em produção! 

O sistema enviará mensagens automáticas de cobrança diariamente às 7h (horário de Brasília) para todas as empresas configuradas.


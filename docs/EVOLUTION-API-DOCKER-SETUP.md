# 🐳 Evolution API com Docker Compose - Guia de Produção

## 📋 Visão Geral

A Evolution API agora está integrada ao `docker-compose.yml` do projeto, rodando automaticamente junto com a API do MontShop em produção.

## 🚀 Configuração Rápida

### Passo 1: Configurar Variáveis de Ambiente

No arquivo `.env` do projeto `api-lojas`, configure:

```env
# Evolution API
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=sua-chave-super-secreta-forte-aqui
EVOLUTION_INSTANCE=montshop
```

**⚠️ IMPORTANTE:**
- `EVOLUTION_API_KEY`: Escolha uma chave forte e única (mínimo 20 caracteres)
- `EVOLUTION_INSTANCE`: Escolha um nome para sua instância (ex: `montshop`, `loja-1`)
- A URL `http://evolution-api:8080` é para comunicação interna entre containers Docker

### Passo 2: Iniciar os Containers

```bash
# Iniciar todos os serviços (app, db, evolution-api, nginx)
docker-compose up -d

# Verificar se todos estão rodando
docker-compose ps

# Ver logs da Evolution API
docker-compose logs -f evolution-api
```

### Passo 3: Criar Instância do WhatsApp

Após os containers iniciarem, você precisa criar uma instância do WhatsApp na Evolution API.

#### Opção A: Via Interface Web (Recomendado)

1. Acesse `http://localhost:8080` no navegador (ou `http://seu-servidor:8080` em produção)
2. Você verá a interface da Evolution API
3. Clique em "Criar Instância" ou "Create Instance"
4. Digite o nome da instância (deve ser igual ao `EVOLUTION_INSTANCE` do `.env`)
5. Clique em "Criar"
6. Escaneie o QR Code com seu WhatsApp:
   - Abra o WhatsApp no celular
   - Vá em **Configurações > Aparelhos conectados > Conectar um aparelho**
   - Escaneie o QR Code

#### Opção B: Via API (Linha de Comando)

```bash
# Substitua pela sua API Key e nome da instância
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: sua-chave-super-secreta-forte-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "montshop",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

### Passo 4: Verificar Status

```bash
# Verificar status da instância
curl -X GET http://localhost:8080/instance/connectionState/montshop \
  -H "apikey: sua-chave-super-secreta-forte-aqui"

# Ou via endpoint do MontShop (após configurar)
curl -X GET http://localhost:3000/whatsapp/status \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

## 📁 Estrutura do Docker Compose

O `docker-compose.yml` agora inclui:

```yaml
services:
  app:              # API do MontShop
  db:               # PostgreSQL
  evolution-api:    # Evolution API (NOVO)
  nginx:            # Nginx (reverse proxy)
```

### Comunicação entre Containers

- A API do MontShop se comunica com a Evolution API usando: `http://evolution-api:8080`
- Esta é uma URL interna do Docker, não acessível de fora
- Para acessar a Evolution API externamente (criar instâncias, etc.), use: `http://localhost:8080` ou `http://seu-servidor:8080`

## 🔒 Segurança em Produção

### 1. Alterar API Key Padrão

**⚠️ CRÍTICO:** Altere a API Key padrão antes de colocar em produção!

No arquivo `.env`:
```env
EVOLUTION_API_KEY=GereUmaChaveForteEUnicaAqui123456789
```

**Como gerar uma chave forte:**
```bash
# Linux/Mac
openssl rand -hex 32

# Ou use um gerador online seguro
```

### 2. Restringir Acesso à Porta 8080

Em produção, considere:
- Usar firewall para restringir acesso à porta 8080
- Ou usar Nginx como reverse proxy para a Evolution API
- Ou expor apenas via VPN/tunnel

### 3. Variáveis de Ambiente Seguras

Nunca commite o arquivo `.env` com chaves reais. Use:
- Variáveis de ambiente do sistema
- Secrets do Docker Swarm/Kubernetes
- Serviços de gerenciamento de secrets (ex: HashiCorp Vault)

## 🔧 Configurações Avançadas

### Acessar Evolution API via Nginx (Opcional)

Se quiser acessar a Evolution API através do Nginx (ex: `https://api.seudominio.com/evolution`), adicione ao `nginx.conf`:

```nginx
location /evolution {
    proxy_pass http://evolution-api:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

E atualize o `.env`:
```env
EVOLUTION_API_URL=http://evolution-api:8080  # Interno (mantém assim)
# Para acesso externo, use: https://api.seudominio.com/evolution
```

### Usar Redis (Opcional - Para Alta Performance)

Para melhor performance em produção, você pode habilitar Redis:

```yaml
evolution-api:
  environment:
    REDIS_ENABLED: true
    REDIS_URI: redis://redis:6379
  depends_on:
    - redis

redis:
  image: redis:7-alpine
  volumes:
    - redis_data:/data
  networks:
    - montshop-network
```

### Usar PostgreSQL para Evolution API (Opcional)

Por padrão, a Evolution API usa SQLite. Para produção com alta carga, use PostgreSQL:

```yaml
evolution-api:
  environment:
    DATABASE_ENABLED: true
    DATABASE_PROVIDER: postgresql
    DATABASE_NAME: evolution
    DATABASE_URL: postgresql://postgres:password@db:5432/evolution
  depends_on:
    - db
```

## 📊 Monitoramento

### Ver Logs

```bash
# Logs da Evolution API
docker-compose logs -f evolution-api

# Logs de todos os serviços
docker-compose logs -f

# Logs apenas de erros
docker-compose logs evolution-api | grep -i error
```

### Health Check

A Evolution API tem health check configurado. Verifique o status:

```bash
docker-compose ps evolution-api
```

Deve mostrar `healthy` quando estiver funcionando.

### Verificar Instâncias

```bash
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: sua-api-key"
```

## 🔍 Troubleshooting

### Problema: Evolution API não inicia

**Soluções:**
1. Verifique os logs: `docker-compose logs evolution-api`
2. Verifique se a porta 8080 está livre: `netstat -tuln | grep 8080`
3. Verifique se há espaço em disco: `df -h`

### Problema: "Cannot connect to evolution-api"

**Soluções:**
1. Verifique se o serviço está rodando: `docker-compose ps`
2. Verifique se estão na mesma rede: `docker network ls`
3. Verifique se a URL está correta: `http://evolution-api:8080` (não `localhost`)

### Problema: "401 Unauthorized"

**Soluções:**
1. Verifique se `EVOLUTION_API_KEY` no `.env` é igual ao `AUTHENTICATION_API_KEY` do docker-compose
2. Reinicie os containers após alterar: `docker-compose restart`

### Problema: Instância não conecta

**Soluções:**
1. Verifique se a instância foi criada: `curl -X GET http://localhost:8080/instance/fetchInstances -H "apikey: sua-key"`
2. Gere um novo QR Code: `curl -X GET http://localhost:8080/instance/connect/montshop -H "apikey: sua-key"`
3. Verifique os logs: `docker-compose logs evolution-api`

## ✅ Checklist de Produção

Antes de colocar em produção, verifique:

- [ ] API Key alterada para uma chave forte e única
- [ ] `.env` configurado com as variáveis corretas
- [ ] Containers iniciados: `docker-compose ps`
- [ ] Evolution API acessível: `curl http://localhost:8080`
- [ ] Instância criada e conectada (status: `open`)
- [ ] Teste de envio de mensagem funcionando
- [ ] Logs sendo monitorados
- [ ] Backup dos volumes configurado (opcional mas recomendado)

## 📝 Comandos Úteis

```bash
# Iniciar todos os serviços
docker-compose up -d

# Parar todos os serviços
docker-compose down

# Reiniciar apenas a Evolution API
docker-compose restart evolution-api

# Ver logs em tempo real
docker-compose logs -f evolution-api

# Acessar shell do container
docker-compose exec evolution-api sh

# Verificar status de todos os serviços
docker-compose ps

# Reconstruir containers
docker-compose up -d --build

# Limpar volumes (CUIDADO: apaga dados)
docker-compose down -v
```

## 🎉 Pronto!

Agora a Evolution API roda automaticamente junto com a API do MontShop. As mensagens automáticas de cobrança funcionarão assim que você:

1. ✅ Configurar as variáveis no `.env`
2. ✅ Iniciar os containers: `docker-compose up -d`
3. ✅ Criar e conectar a instância do WhatsApp
4. ✅ Ativar mensagens automáticas nas empresas

Tudo funcionando! 🚀


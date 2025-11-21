# 🚀 Início Rápido - WhatsApp Evolution API

## Configuração em 3 Passos

### 1️⃣ Instalar Evolution API (Docker)

Crie um arquivo `docker-compose.yml`:

```yaml
version: '3.8'
services:
  evolution-api:
    container_name: evolution-api
    image: atendai/evolution-api:latest
    restart: always
    ports:
      - "8080:8080"
    environment:
      SERVER_URL: http://localhost:8080
      PORT: 8080
      AUTHENTICATION_API_KEY: minha-chave-secreta-123
      DATABASE_ENABLED: true
      DATABASE_PROVIDER: sqlite
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store

volumes:
  evolution_instances:
  evolution_store:
```

Inicie:
```bash
docker-compose up -d
```

### 2️⃣ Criar Instância e Conectar WhatsApp

```bash
# Criar instância
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: minha-chave-secreta-123" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "minha-loja", "qrcode": true}'

# Obter QR Code
curl -X GET http://localhost:8080/instance/connect/minha-loja \
  -H "apikey: minha-chave-secreta-123"
```

Escaneie o QR Code com seu WhatsApp.

### 3️⃣ Configurar MontShop

Adicione no arquivo `.env` do `api-lojas`:

```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=minha-chave-secreta-123
EVOLUTION_INSTANCE=minha-loja
```

Reinicie a API do MontShop.

## ✅ Pronto!

Agora você pode usar os endpoints de cobrança:

```bash
POST /whatsapp/send-installment-billing
POST /whatsapp/send-customer-billing
```

## 📖 Documentação Completa

- **[EVOLUTION-API-SETUP.md](./EVOLUTION-API-SETUP.md)** - Guia completo passo a passo
- **[WHATSAPP-BILLING.md](./WHATSAPP-BILLING.md)** - Documentação dos endpoints


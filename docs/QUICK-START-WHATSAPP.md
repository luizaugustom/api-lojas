# 🚀 Início Rápido - WhatsApp Z-API

## Configuração em 3 Passos

### 1️⃣ Criar Conta na Z-API

1. Acesse: https://developer.z-api.io/
2. Crie uma conta
3. Crie uma nova instância
4. Anote o `INSTANCE_ID` e o `TOKEN`

### 2️⃣ Conectar WhatsApp

1. Siga as instruções da Z-API para conectar seu número de WhatsApp
2. Geralmente envolve escanear um QR Code no painel da Z-API

### 3️⃣ Configurar MontShop

Adicione no arquivo `.env` do `api-lojas`:

```env
# Z-API
Z_API_URL=https://api.z-api.io
Z_API_INSTANCE_ID=seu-instance-id-aqui
Z_API_TOKEN=seu-token-aqui
```

Reinicie a API do MontShop.

## ✅ Pronto!

Agora você pode usar os endpoints de cobrança:

```bash
POST /whatsapp/send-installment-billing
POST /whatsapp/send-customer-billing
```

## 📖 Documentação Completa

- **[WHATSAPP-PRODUCAO.md](./WHATSAPP-PRODUCAO.md)** - Guia completo de configuração
- **[WHATSAPP-BILLING.md](./WHATSAPP-BILLING.md)** - Documentação dos endpoints

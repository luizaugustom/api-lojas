# Integração com N8N

Esta documentação descreve como integrar a API Lojas SaaS com o N8N para automação de workflows.

## Configuração

### 1. Configurar Webhook URL

Configure a variável de ambiente `N8N_WEBHOOK_URL` no arquivo `.env`:

```env
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/api-lojas-saas
```

### 2. Criar Webhook no N8N

1. Acesse sua instância do N8N
2. Crie um novo workflow
3. Adicione um nó "Webhook"
4. Configure a URL do webhook
5. Ative o workflow

## Eventos Disponíveis

A API envia webhooks para os seguintes eventos:

### 1. Venda Criada (`sale.created`)

**Quando:** Uma nova venda é realizada

**Dados enviados:**
```json
{
  "event": "sale.created",
  "data": {
    "id": "sale-id",
    "companyId": "company-id",
    "total": 150.75,
    "clientName": "João Silva",
    "clientCpfCnpj": "123.456.789-00",
    "paymentMethods": ["cash", "pix"],
    "saleDate": "2024-01-15T10:30:00Z",
    "items": [
      {
        "productId": "product-id",
        "quantity": 2,
        "unitPrice": 25.50,
        "totalPrice": 51.00
      }
    ],
    "seller": {
      "id": "seller-id",
      "name": "Maria Santos"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "api-lojas-saas"
}
```

### 2. Produto com Estoque Baixo (`product.low_stock`)

**Quando:** Um produto atinge o estoque mínimo

**Dados enviados:**
```json
{
  "event": "product.low_stock",
  "data": {
    "id": "product-id",
    "companyId": "company-id",
    "name": "Smartphone Samsung",
    "barcode": "7891234567890",
    "stockQuantity": 5,
    "category": "Eletrônicos"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "api-lojas-saas"
}
```

### 3. Conta Próxima do Vencimento (`bill.due_soon`)

**Quando:** Uma conta está próxima do vencimento

**Dados enviados:**
```json
{
  "event": "bill.due_soon",
  "data": {
    "id": "bill-id",
    "companyId": "company-id",
    "title": "Conta de luz - Janeiro 2024",
    "amount": 150.75,
    "dueDate": "2024-02-15",
    "barcode": "12345678901234567890"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "api-lojas-saas"
}
```

### 4. Fechamento de Caixa (`cash_closure.closed`)

**Quando:** Um fechamento de caixa é realizado

**Dados enviados:**
```json
{
  "event": "cash_closure.closed",
  "data": {
    "id": "closure-id",
    "companyId": "company-id",
    "openingDate": "2024-01-15T08:00:00Z",
    "closingDate": "2024-01-15T18:00:00Z",
    "openingAmount": 100.00,
    "closingAmount": 1250.75,
    "totalSales": 1150.75,
    "totalWithdrawals": 0.00,
    "salesCount": 25
  },
  "timestamp": "2024-01-15T18:00:00Z",
  "source": "api-lojas-saas"
}
```

### 5. Documento Fiscal Gerado (`fiscal_document.generated`)

**Quando:** Uma NFe ou NFSe é gerada

**Dados enviados:**
```json
{
  "event": "fiscal_document.generated",
  "data": {
    "id": "document-id",
    "companyId": "company-id",
    "documentType": "NFe",
    "documentNumber": "123456",
    "accessKey": "NFe12345678901234567890123456789012345678901234",
    "status": "Autorizada",
    "emissionDate": "2024-01-15T10:30:00Z",
    "pdfUrl": "https://example.com/documento.pdf"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "api-lojas-saas"
}
```

### 6. Cliente Criado (`customer.created`)

**Quando:** Um novo cliente é cadastrado

**Dados enviados:**
```json
{
  "event": "customer.created",
  "data": {
    "id": "customer-id",
    "companyId": "company-id",
    "name": "João Silva",
    "phone": "(11) 99999-9999",
    "cpfCnpj": "123.456.789-00",
    "email": "joao@example.com",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "api-lojas-saas"
}
```

### 7. Vendedor Criado (`seller.created`)

**Quando:** Um novo vendedor é cadastrado

**Dados enviados:**
```json
{
  "event": "seller.created",
  "data": {
    "id": "seller-id",
    "companyId": "company-id",
    "name": "Maria Santos",
    "email": "maria@example.com",
    "phone": "(11) 88888-8888",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "api-lojas-saas"
}
```

### 8. Empresa Criada (`company.created`)

**Quando:** Uma nova empresa é cadastrada

**Dados enviados:**
```json
{
  "event": "company.created",
  "data": {
    "id": "company-id",
    "name": "Loja Exemplo LTDA",
    "cnpj": "12.345.678/0001-90",
    "email": "contato@lojaexemplo.com",
    "phone": "(11) 99999-9999",
    "city": "São Paulo",
    "state": "SP",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "api-lojas-saas"
}
```

## Exemplos de Workflows N8N

### 1. Notificação de Venda via WhatsApp

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "api-lojas-saas",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Filter Sale Created",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.event }}",
              "operation": "equal",
              "value2": "sale.created"
            }
          ]
        }
      }
    },
    {
      "name": "Format Message",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "string": [
            {
              "name": "message",
              "value": "🛍️ Nova venda realizada!\n\nCliente: {{ $json.data.clientName || 'Não informado' }}\nTotal: R$ {{ $json.data.total }}\nVendedor: {{ $json.data.seller.name }}"
            }
          ]
        }
      }
    },
    {
      "name": "Send WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.whatsapp.com/send",
        "method": "POST",
        "body": {
          "phone": "+5511999999999",
          "message": "={{ $json.message }}"
        }
      }
    }
  ]
}
```

### 2. Alerta de Estoque Baixo

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "api-lojas-saas",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Filter Low Stock",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.event }}",
              "operation": "equal",
              "value2": "product.low_stock"
            }
          ]
        }
      }
    },
    {
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "toEmail": "gerente@empresa.com",
        "subject": "⚠️ Alerta de Estoque Baixo",
        "text": "Produto {{ $json.data.name }} está com estoque baixo ({{ $json.data.stockQuantity }} unidades)"
      }
    }
  ]
}
```

### 3. Backup de Dados para Google Drive

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "api-lojas-saas",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Filter Fiscal Document",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.event }}",
              "operation": "equal",
              "value2": "fiscal_document.generated"
            }
          ]
        }
      }
    },
    {
      "name": "Download PDF",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{ $json.data.pdfUrl }}",
        "method": "GET",
        "options": {
          "response": {
            "response": {
              "responseFormat": "file"
            }
          }
        }
      }
    },
    {
      "name": "Upload to Google Drive",
      "type": "n8n-nodes-base.googleDrive",
      "parameters": {
        "operation": "upload",
        "name": "={{ 'Documento_' + $json.data.documentNumber + '.pdf' }}",
        "parents": {
          "parentId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
        },
        "binaryData": true
      }
    }
  ]
}
```

## Testando a Integração

### 1. Teste Manual

Use o endpoint de teste da API:

```bash
curl -X POST "https://your-api.com/n8n/test" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Verificar Status

```bash
curl -X GET "https://your-api.com/n8n/status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Configurações Avançadas

### 1. Autenticação

Se necessário, configure autenticação no webhook do N8N:

```env
N8N_WEBHOOK_SECRET=your-secret-key
```

### 2. Retry Policy

A API implementa retry automático em caso de falha:

- Tentativas: 3
- Intervalo: 1 segundo
- Timeout: 5 segundos

### 3. Logs

Todos os webhooks são logados com:
- Timestamp
- Evento
- Status (sucesso/falha)
- Resposta do N8N

## Troubleshooting

### Webhook não recebido

1. Verifique se a URL está correta
2. Confirme se o N8N está ativo
3. Verifique os logs da API
4. Teste a conectividade

### Dados incorretos

1. Verifique a versão da API
2. Confirme o formato dos dados
3. Valide o schema do webhook

### Performance

1. Configure timeout adequado
2. Implemente queue para webhooks
3. Monitore métricas de envio

## Suporte

Para dúvidas sobre a integração:

1. Consulte esta documentação
2. Verifique os logs da API
3. Entre em contato com o suporte técnico

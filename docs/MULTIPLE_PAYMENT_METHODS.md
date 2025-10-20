# Sistema de Múltiplos Métodos de Pagamento

## Visão Geral

O sistema agora suporta múltiplos métodos de pagamento por venda, permitindo que uma única venda seja paga usando diferentes formas de pagamento (dinheiro, PIX, cartão, etc.) com valores específicos para cada método.

## Mudanças Implementadas

### 1. Novo DTO para Métodos de Pagamento

Foi criado o arquivo `src/application/sale/dto/payment-method.dto.ts` com:

```typescript
export class PaymentMethodDto {
  method: PaymentMethod;  // Tipo do método de pagamento
  amount: number;         // Valor pago neste método específico
  additionalInfo?: string; // Informações adicionais (opcional)
}
```

### 2. Atualização do CreateSaleDto

O campo `paymentMethods` agora aceita um array de objetos `PaymentMethodDto` em vez de um array simples de strings:

```typescript
// Antes
paymentMethods: PaymentMethod[]; // ['cash', 'pix']

// Agora
paymentMethods: PaymentMethodDto[]; // [{method: 'cash', amount: 50}, {method: 'pix', amount: 30}]
```

### 3. Nova Tabela no Banco de Dados

Foi criada a tabela `sale_payment_methods` para armazenar os métodos de pagamento com seus valores:

```sql
CREATE TABLE sale_payment_methods (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  method TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  additional_info TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);
```

### 4. Atualização do SaleService

O serviço foi atualizado para:
- Validar que a soma dos valores dos métodos de pagamento seja igual ao total da venda
- Criar registros separados para cada método de pagamento
- Incluir os métodos de pagamento nas consultas de vendas

## Como Usar

### Exemplo de Criação de Venda com Múltiplos Métodos de Pagamento

```javascript
const saleData = {
  items: [
    {
      productId: "produto-id",
      quantity: 2
    }
  ],
  clientCpfCnpj: "123.456.789-00",
  clientName: "João Silva",
  paymentMethods: [
    {
      method: "cash",
      amount: 50.00,
      additionalInfo: "Dinheiro"
    },
    {
      method: "pix", 
      amount: 30.00,
      additionalInfo: "PIX instantâneo"
    },
    {
      method: "credit_card",
      amount: 20.00,
      additionalInfo: "Cartão de crédito - parcelado em 2x"
    }
  ]
};

// POST /sale
const response = await fetch('/sale', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(saleData)
});
```

### Resposta da API

```javascript
{
  "id": "sale-id",
  "total": 100.00,
  "clientName": "João Silva",
  "clientCpfCnpj": "123.456.789-00",
  "change": 0,
  "isInstallment": false,
  "saleDate": "2024-01-15T10:30:00Z",
  "paymentMethods": [
    {
      "id": "pm-id-1",
      "method": "cash",
      "amount": 50.00,
      "additionalInfo": "Dinheiro"
    },
    {
      "id": "pm-id-2", 
      "method": "pix",
      "amount": 30.00,
      "additionalInfo": "PIX instantâneo"
    },
    {
      "id": "pm-id-3",
      "method": "credit_card", 
      "amount": 20.00,
      "additionalInfo": "Cartão de crédito - parcelado em 2x"
    }
  ],
  "items": [...],
  "seller": {...}
}
```

## Validações

1. **Soma dos Valores**: A soma dos valores dos métodos de pagamento deve ser igual ao total da venda (com tolerância de 0.01 para arredondamentos)

2. **Valores Positivos**: Cada método de pagamento deve ter um valor maior que zero

3. **Métodos Válidos**: Apenas métodos de pagamento válidos são aceitos:
   - `cash` - Dinheiro
   - `pix` - PIX
   - `credit_card` - Cartão de crédito
   - `debit_card` - Cartão de débito
   - `installment` - A prazo

4. **Cliente para Vendas a Prazo**: Se houver método de pagamento `installment`, o nome do cliente é obrigatório

## Benefícios

1. **Flexibilidade**: Permite combinar diferentes formas de pagamento
2. **Controle**: Cada método de pagamento tem seu valor específico
3. **Rastreabilidade**: Histórico detalhado de como cada venda foi paga
4. **Relatórios**: Possibilidade de gerar relatórios por método de pagamento
5. **Compatibilidade**: Mantém compatibilidade com vendas de método único

## Migração

Para atualizar o banco de dados, execute:

```bash
npx prisma db push --accept-data-loss
```

**⚠️ Atenção**: Este comando irá remover dados existentes da coluna `paymentMethod` da tabela `sales`. Certifique-se de fazer backup antes de executar.

## Status da Implementação

✅ **Implementação Concluída com Sucesso!**

- ✅ Novo DTO para métodos de pagamento criado
- ✅ CreateSaleDto atualizado para suportar múltiplos métodos
- ✅ Banco de dados atualizado com nova tabela `sale_payment_methods`
- ✅ SaleService atualizado para processar múltiplos métodos
- ✅ CashClosureService atualizado para relatórios
- ✅ ReportsService atualizado para relatórios
- ✅ FiscalService atualizado para NFCe
- ✅ Todos os erros de compilação corrigidos
- ✅ Projeto compila sem erros

## Teste

Para testar a funcionalidade, execute:

```bash
node scripts/test-multiple-payment-methods.js
```

Este script testa:
- Login no sistema
- Criação de venda com múltiplos métodos de pagamento
- Busca da venda criada
- Validação dos métodos de pagamento retornados

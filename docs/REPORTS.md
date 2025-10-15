# Módulo de Relatórios para Contabilidade

## Visão Geral

O módulo de relatórios fornece funcionalidade completa para gerar relatórios contábeis da empresa em múltiplos formatos (JSON, XML, Excel) para envio à contabilidade ou download.

## Funcionalidades

### Tipos de Relatórios

1. **Relatório de Vendas** (`sales`)
   - Resumo de vendas (total, receita, ticket médio)
   - Detalhes de cada venda
   - Produtos vendidos por venda
   - Estatísticas por método de pagamento
   - Estatísticas por vendedor

2. **Relatório de Produtos** (`products`)
   - Lista completa de produtos
   - Estoque atual
   - Total vendido por produto
   - Receita gerada por produto
   - Valor total em estoque
   - Estatísticas por categoria

3. **Relatório de Notas Fiscais** (`invoices`)
   - Lista de notas fiscais emitidas
   - Status das notas (emitida, cancelada, etc.)
   - Conteúdo XML das notas
   - Estatísticas por tipo e status

4. **Relatório Completo** (`complete`)
   - Todos os relatórios acima
   - Contas a pagar
   - Fechamentos de caixa
   - Informações da empresa

### Formatos de Exportação

- **JSON**: Formato estruturado para integração com sistemas
- **XML**: Formato padrão para envio à contabilidade
- **Excel (.xlsx)**: Planilhas organizadas por abas para análise

## Uso da API

### Endpoint

```
POST /reports/generate
```

### Autenticação

Requer autenticação JWT com role `COMPANY`.

### Request Body

```json
{
  "reportType": "complete",
  "format": "xml",
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-12-31T23:59:59.999Z",
  "sellerId": "optional-seller-id"
}
```

### Parâmetros

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `reportType` | enum | Sim | Tipo de relatório: `sales`, `products`, `invoices`, `complete` |
| `format` | enum | Sim | Formato de saída: `json`, `xml`, `excel` |
| `startDate` | string (ISO 8601) | Não | Data inicial do período |
| `endDate` | string (ISO 8601) | Não | Data final do período |
| `sellerId` | string | Não | Filtrar por vendedor específico |

### Exemplo de Requisição

```bash
curl -X POST https://api.example.com/reports/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "complete",
    "format": "xml",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.999Z"
  }' \
  --output relatorio-completo.xml
```

### Response

O endpoint retorna o arquivo diretamente com headers apropriados:

- **Content-Type**: Varia conforme o formato
  - JSON: `application/json`
  - XML: `application/xml`
  - Excel: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  
- **Content-Disposition**: `attachment; filename="relatorio-{type}-{timestamp}.{ext}"`

## Estrutura dos Dados

### Relatório Completo (JSON)

```json
{
  "company": {
    "id": "company-id",
    "name": "Nome da Empresa",
    "cnpj": "00.000.000/0000-00",
    "email": "empresa@example.com",
    "phone": "(11) 99999-9999",
    "stateRegistration": "123456789",
    "municipalRegistration": "987654321"
  },
  "reportMetadata": {
    "type": "complete",
    "generatedAt": "2025-10-15T12:34:56.789Z",
    "period": {
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-12-31T23:59:59.999Z"
    }
  },
  "data": {
    "sales": {
      "summary": {
        "totalSales": 150,
        "totalRevenue": 45000.00,
        "averageTicket": 300.00
      },
      "sales": [...]
    },
    "products": {
      "summary": {
        "totalProducts": 50,
        "totalStockValue": 25000.00
      },
      "products": [...]
    },
    "invoices": {
      "summary": {
        "totalInvoices": 100
      },
      "invoices": [...]
    },
    "billsToPay": {
      "summary": {
        "totalBills": 20,
        "paidBills": 15,
        "totalAmount": 10000.00
      },
      "bills": [...]
    },
    "cashClosures": {
      "summary": {
        "totalClosures": 30,
        "totalSales": 45000.00
      },
      "closures": [...]
    }
  }
}
```

### Estrutura Excel

O arquivo Excel contém múltiplas abas:

1. **Empresa**: Informações da empresa
2. **Vendas**: Lista de vendas detalhadas
3. **Produtos**: Catálogo de produtos com estatísticas
4. **Notas Fiscais**: Lista de documentos fiscais
5. **Contas a Pagar**: Contas pendentes e pagas
6. **Fechamentos**: Histórico de fechamentos de caixa

Cada aba possui:
- Cabeçalhos em negrito
- Colunas formatadas com largura apropriada
- Dados organizados em tabelas

### Estrutura XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<report>
  <company>
    <id>company-id</id>
    <name>Nome da Empresa</name>
    <cnpj>00.000.000/0000-00</cnpj>
    ...
  </company>
  <reportMetadata>
    <type>complete</type>
    <generatedAt>2025-10-15T12:34:56.789Z</generatedAt>
    ...
  </reportMetadata>
  <data>
    <sales>
      <summary>...</summary>
      <sales>...</sales>
    </sales>
    ...
  </data>
</report>
```

## Casos de Uso

### 1. Envio Mensal para Contabilidade

```javascript
// Gerar relatório completo do mês em XML
const response = await fetch('/reports/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reportType: 'complete',
    format: 'xml',
    startDate: '2025-10-01T00:00:00.000Z',
    endDate: '2025-10-31T23:59:59.999Z'
  })
});

const blob = await response.blob();
// Enviar por email ou fazer download
```

### 2. Análise de Vendas em Excel

```javascript
// Gerar relatório de vendas em Excel para análise
const response = await fetch('/reports/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reportType: 'sales',
    format: 'excel',
    startDate: '2025-01-01T00:00:00.000Z',
    endDate: '2025-12-31T23:59:59.999Z'
  })
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'relatorio-vendas.xlsx';
a.click();
```

### 3. Integração com Sistema Externo

```javascript
// Obter dados em JSON para integração
const response = await fetch('/reports/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reportType: 'invoices',
    format: 'json',
    startDate: '2025-10-01T00:00:00.000Z',
    endDate: '2025-10-31T23:59:59.999Z'
  })
});

const data = await response.json();
// Processar dados para integração
```

## Instalação de Dependências

Após adicionar o módulo, instale as novas dependências:

```bash
npm install
```

As seguintes bibliotecas foram adicionadas:
- `exceljs`: Geração de arquivos Excel
- `xml2js`: Conversão de objetos para XML
- `@types/xml2js`: Tipos TypeScript para xml2js

## Segurança

- ✅ Autenticação JWT obrigatória
- ✅ Apenas usuários com role `COMPANY` podem gerar relatórios
- ✅ Relatórios filtrados automaticamente por empresa do usuário
- ✅ Dados sensíveis protegidos

## Performance

- Relatórios são gerados sob demanda
- Queries otimizadas com Prisma
- Uso de Promise.all para operações paralelas
- Streaming de arquivos grandes

## Próximas Melhorias

- [ ] Cache de relatórios frequentes
- [ ] Agendamento automático de relatórios
- [ ] Envio por email integrado
- [ ] Mais formatos (PDF, CSV)
- [ ] Relatórios customizáveis
- [ ] Dashboard de visualização

## Suporte

Para dúvidas ou problemas, consulte a documentação da API ou entre em contato com o suporte técnico.

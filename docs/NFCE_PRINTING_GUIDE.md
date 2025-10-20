# Impressão de NFCe na Finalização de Vendas

## Visão Geral

O sistema agora gera e imprime automaticamente uma NFCe (Nota Fiscal do Consumidor Eletrônica) na impressora térmica sempre que uma venda é finalizada. A impressão inclui todas as informações obrigatórias da legislação fiscal brasileira, além de permitir um footer personalizado adicional.

## Funcionalidades Implementadas

### 1. Geração Automática de NFCe
- **Quando**: Automaticamente ao finalizar qualquer venda
- **Onde**: Integrado ao processo de criação de venda (`POST /sale`)
- **Processo**: 
  1. Venda é criada no banco de dados
  2. NFCe é gerada via API fiscal
  3. NFCe é impressa na impressora térmica configurada

### 2. Impressão Completa da NFCe
A NFCe impressa inclui:
- **Cabeçalho**: Nome da empresa, CNPJ, endereço, telefone, email
- **Informações Fiscais**: Número da nota, chave de acesso, data/hora de emissão, status
- **Dados da Venda**: ID da venda, data, vendedor, cliente (se informado)
- **Itens**: Lista completa com código, descrição, quantidade, preço unitário e total
- **Formas de Pagamento**: Métodos utilizados na venda
- **Totais**: Valor total e troco (se houver)
- **QR Code**: Informações para consulta na Receita Federal
- **Footer Personalizado**: Mensagem adicional configurável pela empresa

### 3. Footer Personalizado
- **Configuração**: Via endpoints específicos
- **Flexibilidade**: Permite até 500 caracteres
- **Uso**: Aparece na NFCe impressa após as informações obrigatórias
- **Padrão**: "OBRIGADO PELA PREFERÊNCIA!\nVOLTE SEMPRE!" se não configurado

## Endpoints Disponíveis

### Gerenciar Footer Personalizado

#### Atualizar Footer Personalizado
```http
POST /printer/custom-footer
Authorization: Bearer <token>
Content-Type: application/json

{
  "customFooter": "OBRIGADO PELA PREFERÊNCIA!\nVOLTE SEMPRE!\n\nSiga-nos nas redes sociais:\n@minhaloja"
}
```

#### Obter Footer Atual
```http
GET /printer/custom-footer
Authorization: Bearer <token>
```

### Gerar NFCe Manualmente (Opcional)
```http
POST /fiscal/nfce
Authorization: Bearer <token>
Content-Type: application/json

{
  "saleId": "123e4567-e89b-12d3-a456-426614174000",
  "sellerName": "João Silva",
  "clientCpfCnpj": "123.456.789-00",
  "clientName": "Maria Santos",
  "items": [
    {
      "productId": "prod123",
      "productName": "Produto Exemplo",
      "barcode": "1234567890123",
      "quantity": 2,
      "unitPrice": 25.50,
      "totalPrice": 51.00
    }
  ],
  "totalValue": 51.00,
  "paymentMethod": ["cash", "pix"]
}
```

## Configuração do Banco de Dados

### Nova Coluna na Tabela Company
```sql
ALTER TABLE companies ADD COLUMN custom_footer TEXT;
```

### Migração Prisma
Execute o comando para aplicar as mudanças no schema:
```bash
npx prisma db push
```

## Fluxo de Funcionamento

1. **Venda Criada**: Cliente finaliza compra via frontend
2. **Processamento**: Sistema valida produtos e calcula totais
3. **Persistência**: Venda é salva no banco de dados
4. **Geração Fiscal**: NFCe é gerada via API fiscal externa
5. **Impressão**: NFCe é enviada para impressora térmica
6. **Logs**: Sistema registra sucesso ou falha da operação

## Tratamento de Erros

- **Falha na Geração Fiscal**: Venda continua sendo criada, mas NFCe não é impressa
- **Falha na Impressão**: NFCe é gerada, mas não é impressa fisicamente
- **Logs**: Todas as falhas são registradas para análise posterior
- **Continuidade**: Vendas não são interrompidas por falhas na impressão

## Configurações Necessárias

### Variáveis de Ambiente
```env
FISCAL_API_URL=https://api.fiscal.com.br
FISCAL_API_KEY=sua_chave_api
FISCAL_CERTIFICATE_PATH=./certificates/cert.p12
FISCAL_CERTIFICATE_PASSWORD=sua_senha_certificado
```

### Impressora Térmica
- Deve estar configurada no sistema via endpoint `/printer`
- Deve estar conectada e funcionando
- Recomendado: Impressora térmica de 80mm

## Exemplo de NFCe Impressa

```
        MINHA LOJA LTDA
        CNPJ: 12.345.678/0001-90
    Rua das Flores, 123 - Centro
        Tel: (11) 99999-9999
        Email: contato@minhaloja.com
--------------------------------
    NOTA FISCAL DO CONSUMIDOR
        ELETRÔNICA - NFCe
--------------------------------
Número: 000000001
Chave de Acesso:
35240114200166000187650010000000001234567890
Data/Hora Emissão: 15/01/2024 14:30:25
Status: Autorizada
--------------------------------
Venda: cmgty5s880006ww3b8bup77v5
Data: 15/01/2024 14:30:25
Vendedor: João Silva
Cliente: Maria Santos
CPF/CNPJ: 123.456.789-00
--------------------------------
ITEM DESCRIÇÃO           QTD  V.UNIT  TOTAL
----------------------------------------
  1 Produto Exemplo        2   R$ 25,50   R$ 51,00
     Código: 1234567890123
--------------------------------
FORMA DE PAGAMENTO:
- Dinheiro
- PIX
Troco: R$ 9,00
--------------------------------
TOTAL: R$ 51,00
--------------------------------
    CONSULTE A CHAVE DE ACESSO
    NO SITE DA RECEITA FEDERAL
    OU USE O QR CODE ABAIXO
--------------------------------
--------------------------------
    OBRIGADO PELA PREFERÊNCIA!
        VOLTE SEMPRE!
        
Siga-nos nas redes sociais:
        @minhaloja
--------------------------------
    OBRIGADO PELA PREFERÊNCIA!
        VOLTE SEMPRE!
--------------------------------
    15/01/2024 14:30:25
--------------------------------
```

## Benefícios

1. **Conformidade Fiscal**: Atende às exigências da Receita Federal
2. **Automatização**: Processo totalmente automático
3. **Personalização**: Footer personalizado para cada empresa
4. **Rastreabilidade**: Logs completos de todas as operações
5. **Flexibilidade**: Sistema continua funcionando mesmo com falhas na impressão
6. **Integração**: Integrado ao fluxo normal de vendas

## Próximos Passos

1. Configurar API fiscal externa
2. Configurar impressora térmica
3. Testar geração e impressão de NFCe
4. Configurar footer personalizado
5. Treinar equipe no uso da funcionalidade


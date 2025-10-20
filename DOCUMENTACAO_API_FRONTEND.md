# Documentação Completa da API - Frontend

Esta documentação contém todas as rotas, métodos HTTP, estruturas de dados e exemplos de uso da API para integração com o frontend.

## 🔐 Autenticação

### Base URL
```
http://localhost:3000/api
```

### Headers Obrigatórios
```javascript
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
```

### Cookies de Autenticação
A API utiliza cookies HTTP-only para refresh tokens:
- `access_token`: Token de acesso (15 minutos)
- `refresh_token`: Token de renovação (30 dias)

---

## 📋 Rotas da API

### 1. 🔑 Autenticação (`/auth`)

#### POST `/auth/login`
**Descrição:** Realizar login no sistema
**Autenticação:** Não requerida
**Body:**
```json
{
  "login": "usuario@email.com",
  "password": "senha123"
}
```
**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "login": "usuario@email.com",
    "role": "COMPANY",
    "companyId": "uuid",
    "name": "Nome do Usuário"
  }
}
```

#### POST `/auth/refresh`
**Descrição:** Renovar token de acesso
**Autenticação:** Não requerida (usa cookie refresh_token)
**Body:** Vazio
**Resposta:** Mesma estrutura do login

#### POST `/auth/logout`
**Descrição:** Fazer logout
**Autenticação:** Não requerida
**Body:** Vazio
**Resposta:**
```json
{
  "message": "Logged out"
}
```

---

### 2. 👤 Administradores (`/admin`)

#### POST `/admin`
**Descrição:** Criar novo administrador
**Permissão:** ADMIN
**Body:**
```json
{
  "login": "admin@email.com",
  "password": "senha123",
  "name": "Nome do Admin"
}
```

#### GET `/admin`
**Descrição:** Listar todos os administradores
**Permissão:** ADMIN
**Query Parameters:**
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página

#### GET `/admin/:id`
**Descrição:** Buscar administrador por ID
**Permissão:** ADMIN

#### PATCH `/admin/:id`
**Descrição:** Atualizar administrador
**Permissão:** ADMIN
**Body:** Mesma estrutura do POST (campos opcionais)

#### DELETE `/admin/:id`
**Descrição:** Remover administrador
**Permissão:** ADMIN

---

### 3. 🏢 Empresas (`/company`)

#### POST `/company`
**Descrição:** Criar nova empresa
**Permissão:** ADMIN
**Body:**
```json
{
  "name": "Minha Loja LTDA",
  "login": "empresa@email.com",
  "password": "senha123",
  "phone": "(11) 99999-9999",
  "cnpj": "12.345.678/0001-90",
  "stateRegistration": "123456789",
  "municipalRegistration": "12345678",
  "email": "contato@empresa.com",
  "zipCode": "01234-567",
  "state": "SP",
  "city": "São Paulo",
  "district": "Centro",
  "street": "Rua das Flores",
  "number": "123",
  "complement": "Sala 1",
  "fiscalEmail": "fiscal@empresa.com",
  "fiscalPhone": "(11) 88888-8888"
}
```

#### GET `/company`
**Descrição:** Listar empresas
**Permissão:** ADMIN, COMPANY

#### GET `/company/my-company`
**Descrição:** Obter dados da própria empresa
**Permissão:** COMPANY, SELLER

#### GET `/company/stats`
**Descrição:** Obter estatísticas da empresa
**Permissão:** COMPANY

#### GET `/company/:id`
**Descrição:** Buscar empresa por ID
**Permissão:** ADMIN

#### PATCH `/company/my-company`
**Descrição:** Atualizar dados da própria empresa
**Permissão:** COMPANY
**Body:** Mesma estrutura do POST (campos opcionais)

#### PATCH `/company/:id/activate`
**Descrição:** Ativar empresa
**Permissão:** ADMIN

#### PATCH `/company/:id/deactivate`
**Descrição:** Desativar empresa
**Permissão:** ADMIN

#### PATCH `/company/:id`
**Descrição:** Atualizar empresa
**Permissão:** ADMIN

#### DELETE `/company/:id`
**Descrição:** Remover empresa
**Permissão:** ADMIN

---

### 4. 👥 Clientes (`/customer`)

#### POST `/customer`
**Descrição:** Criar novo cliente
**Permissão:** COMPANY
**Body:**
```json
{
  "name": "João Silva",
  "phone": "(11) 99999-9999",
  "email": "cliente@email.com",
  "cpfCnpj": "123.456.789-00",
  "zipCode": "01234-567",
  "state": "SP",
  "city": "São Paulo",
  "district": "Centro",
  "street": "Rua das Flores",
  "number": "123",
  "complement": "Apto 1"
}
```

#### GET `/customer`
**Descrição:** Listar clientes
**Permissão:** ADMIN, COMPANY
**Query Parameters:**
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página
- `search` (opcional): Termo de busca

#### GET `/customer/stats`
**Descrição:** Obter estatísticas dos clientes
**Permissão:** ADMIN, COMPANY

#### GET `/customer/cpf-cnpj/:cpfCnpj`
**Descrição:** Buscar cliente por CPF/CNPJ
**Permissão:** ADMIN, COMPANY, SELLER

#### GET `/customer/:id`
**Descrição:** Buscar cliente por ID
**Permissão:** ADMIN, COMPANY

#### GET `/customer/:id/installments`
**Descrição:** Obter vendas a prazo do cliente
**Permissão:** ADMIN, COMPANY

#### PATCH `/customer/:id`
**Descrição:** Atualizar cliente
**Permissão:** ADMIN, COMPANY
**Body:** Mesma estrutura do POST (campos opcionais)

#### POST `/customer/:id/send-promotional-email`
**Descrição:** Enviar email promocional para cliente específico
**Permissão:** ADMIN, COMPANY
**Body:**
```json
{
  "subject": "Promoção Especial",
  "message": "Conteúdo do email promocional"
}
```

#### POST `/customer/:id/send-sale-confirmation/:saleId`
**Descrição:** Enviar confirmação de venda por email
**Permissão:** ADMIN, COMPANY

#### POST `/customer/send-bulk-promotional-email`
**Descrição:** Enviar email promocional para todos os clientes
**Permissão:** ADMIN, COMPANY
**Body:**
```json
{
  "subject": "Promoção Geral",
  "message": "Conteúdo do email promocional"
}
```

#### DELETE `/customer/:id`
**Descrição:** Remover cliente
**Permissão:** ADMIN, COMPANY

---

### 5. 📦 Produtos (`/product`)

#### POST `/product`
**Descrição:** Criar novo produto
**Permissão:** COMPANY
**Body:**
```json
{
  "name": "Smartphone Samsung Galaxy",
  "photos": ["https://example.com/photo1.jpg"],
  "barcode": "7891234567890",
  "size": "M",
  "stockQuantity": 100,
  "price": 1299.99,
  "category": "Eletrônicos",
  "expirationDate": "2024-12-31"
}
```

#### GET `/product`
**Descrição:** Listar produtos
**Permissão:** ADMIN, COMPANY, SELLER
**Query Parameters:**
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página
- `search` (opcional): Termo de busca

#### GET `/product/stats`
**Descrição:** Obter estatísticas dos produtos
**Permissão:** ADMIN, COMPANY

#### GET `/product/low-stock`
**Descrição:** Listar produtos com estoque baixo
**Permissão:** ADMIN, COMPANY
**Query Parameters:**
- `threshold` (opcional): Limite de estoque (padrão: 10)

#### GET `/product/expiring`
**Descrição:** Listar produtos próximos do vencimento
**Permissão:** ADMIN, COMPANY
**Query Parameters:**
- `days` (opcional): Dias para vencimento (padrão: 30)

#### GET `/product/categories`
**Descrição:** Listar categorias de produtos
**Permissão:** ADMIN, COMPANY, SELLER

#### GET `/product/barcode/:barcode`
**Descrição:** Buscar produto por código de barras
**Permissão:** ADMIN, COMPANY, SELLER

#### GET `/product/:id`
**Descrição:** Buscar produto por ID
**Permissão:** ADMIN, COMPANY, SELLER

#### PATCH `/product/:id`
**Descrição:** Atualizar produto
**Permissão:** ADMIN, COMPANY
**Body:** Mesma estrutura do POST (campos opcionais)

#### PATCH `/product/:id/stock`
**Descrição:** Atualizar estoque do produto
**Permissão:** ADMIN, COMPANY
**Body:**
```json
{
  "stockQuantity": 150
}
```

#### DELETE `/product/:id`
**Descrição:** Remover produto
**Permissão:** ADMIN, COMPANY

#### POST `/product/:id/photo`
**Descrição:** Adicionar foto ao produto
**Permissão:** ADMIN, COMPANY
**Content-Type:** `multipart/form-data`
**Body:** Arquivo de imagem

#### POST `/product/:id/photos`
**Descrição:** Adicionar múltiplas fotos ao produto
**Permissão:** ADMIN, COMPANY
**Content-Type:** `multipart/form-data`
**Body:** Múltiplos arquivos de imagem (máx. 10)

#### POST `/product/upload-and-create`
**Descrição:** Fazer upload de fotos e criar produto
**Permissão:** ADMIN, COMPANY
**Content-Type:** `multipart/form-data`
**Body:** Arquivos de imagem + dados do produto

#### DELETE `/product/:id/photo`
**Descrição:** Remover foto do produto
**Permissão:** ADMIN, COMPANY
**Body:**
```json
{
  "photoUrl": "https://example.com/photo.jpg"
}
```

#### DELETE `/product/:id/photos`
**Descrição:** Remover todas as fotos do produto
**Permissão:** ADMIN, COMPANY

---

### 6. 💰 Vendas (`/sale`)

#### POST `/sale`
**Descrição:** Criar nova venda
**Permissão:** COMPANY, SELLER
**Body:**
```json
{
  "sellerId": "cmgty5s880006ww3b8bup77v7",
  "items": [
    {
      "productId": "cmgty5s880006ww3b8bup77v8",
      "quantity": 2,
      "unitPrice": 50.00,
      "totalPrice": 100.00
    }
  ],
  "clientCpfCnpj": "123.456.789-00",
  "clientName": "João Silva",
  "paymentMethods": [
    {
      "method": "cash",
      "amount": 50.00
    },
    {
      "method": "pix",
      "amount": 30.00
    }
  ],
  "totalPaid": 150.00
}
```

#### GET `/sale`
**Descrição:** Listar vendas
**Permissão:** ADMIN, COMPANY, SELLER
**Query Parameters:**
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página
- `sellerId` (opcional): ID do vendedor
- `startDate` (opcional): Data inicial
- `endDate` (opcional): Data final

#### GET `/sale/stats`
**Descrição:** Obter estatísticas de vendas
**Permissão:** ADMIN, COMPANY
**Query Parameters:**
- `sellerId` (opcional): ID do vendedor
- `startDate` (opcional): Data inicial
- `endDate` (opcional): Data final

#### GET `/sale/my-sales`
**Descrição:** Obter vendas do vendedor logado
**Permissão:** SELLER
**Query Parameters:**
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página
- `startDate` (opcional): Data inicial
- `endDate` (opcional): Data final

#### GET `/sale/my-stats`
**Descrição:** Obter estatísticas do vendedor logado
**Permissão:** SELLER
**Query Parameters:**
- `startDate` (opcional): Data inicial
- `endDate` (opcional): Data final

#### GET `/sale/:id`
**Descrição:** Buscar venda por ID
**Permissão:** ADMIN, COMPANY, SELLER

#### POST `/sale/exchange`
**Descrição:** Processar troca de produto
**Permissão:** COMPANY
**Body:**
```json
{
  "originalSaleId": "cmgty5s880006ww3b8bup77va",
  "newItems": [
    {
      "productId": "cmgty5s880006ww3b8bup77v8",
      "quantity": 1,
      "unitPrice": 100.00,
      "totalPrice": 100.00
    }
  ],
  "reason": "Produto com defeito"
}
```

#### POST `/sale/:id/reprint`
**Descrição:** Reimprimir cupom da venda
**Permissão:** ADMIN, COMPANY, SELLER

#### PATCH `/sale/:id`
**Descrição:** Atualizar venda
**Permissão:** ADMIN, COMPANY
**Body:** Mesma estrutura do POST (campos opcionais)

#### DELETE `/sale/:id`
**Descrição:** Remover venda
**Permissão:** ADMIN, COMPANY

---

### 7. 👨‍💼 Vendedores (`/seller`)

#### POST `/seller`
**Descrição:** Criar novo vendedor
**Permissão:** COMPANY
**Body:**
```json
{
  "login": "vendedor@email.com",
  "password": "senha123",
  "name": "Nome do Vendedor",
  "phone": "(11) 99999-9999",
  "email": "vendedor@email.com"
}
```

#### GET `/seller`
**Descrição:** Listar vendedores
**Permissão:** ADMIN, COMPANY

#### GET `/seller/my-profile`
**Descrição:** Obter perfil do vendedor
**Permissão:** SELLER

#### GET `/seller/my-stats`
**Descrição:** Obter estatísticas do vendedor
**Permissão:** SELLER

#### GET `/seller/my-sales`
**Descrição:** Obter vendas do vendedor
**Permissão:** SELLER
**Query Parameters:**
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página

#### GET `/seller/:id`
**Descrição:** Buscar vendedor por ID
**Permissão:** ADMIN, COMPANY

#### GET `/seller/:id/stats`
**Descrição:** Obter estatísticas do vendedor
**Permissão:** ADMIN, COMPANY

#### GET `/seller/:id/sales`
**Descrição:** Obter vendas do vendedor
**Permissão:** ADMIN, COMPANY
**Query Parameters:**
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página

#### PATCH `/seller/my-profile`
**Descrição:** Atualizar perfil do vendedor
**Permissão:** SELLER
**Body:** Mesma estrutura do POST (campos opcionais)

#### PATCH `/seller/:id`
**Descrição:** Atualizar vendedor
**Permissão:** ADMIN, COMPANY
**Body:** Mesma estrutura do POST (campos opcionais)

#### DELETE `/seller/:id`
**Descrição:** Remover vendedor
**Permissão:** ADMIN, COMPANY

---

### 8. 🧾 Fiscal (`/fiscal`)

#### POST `/fiscal/nfe`
**Descrição:** Gerar NFe
**Permissão:** COMPANY
**Body:**
```json
{
  "clientCpfCnpj": "123.456.789-00",
  "clientName": "João Silva",
  "items": [
    {
      "productId": "cmgty5s880006ww3b8bup77v8",
      "quantity": 2,
      "unitPrice": 50.00,
      "totalPrice": 100.00
    }
  ],
  "totalValue": 100.00,
  "paymentMethod": "cash"
}
```

#### POST `/fiscal/nfse`
**Descrição:** Gerar NFSe
**Permissão:** COMPANY
**Body:**
```json
{
  "clientCpfCnpj": "123.456.789-00",
  "clientName": "João Silva",
  "serviceDescription": "Serviço de consultoria",
  "serviceValue": 500.00,
  "paymentMethod": "pix"
}
```

#### POST `/fiscal/nfce`
**Descrição:** Gerar NFCe
**Permissão:** COMPANY
**Body:**
```json
{
  "clientCpfCnpj": "123.456.789-00",
  "clientName": "João Silva",
  "items": [
    {
      "productId": "cmgty5s880006ww3b8bup77v8",
      "quantity": 1,
      "unitPrice": 50.00,
      "totalPrice": 50.00
    }
  ],
  "totalValue": 50.00,
  "paymentMethod": "cash",
      "saleId": "cmgty5s880006ww3b8bup77va",
  "sellerName": "Nome do Vendedor"
}
```

#### GET `/fiscal`
**Descrição:** Listar documentos fiscais
**Permissão:** ADMIN, COMPANY
**Query Parameters:**
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página
- `documentType` (opcional): Tipo do documento

#### GET `/fiscal/status`
**Descrição:** Obter status da API fiscal
**Permissão:** ADMIN, COMPANY

#### POST `/fiscal/certificate/upload`
**Descrição:** Upload de certificado digital
**Permissão:** COMPANY
**Body:**
```json
{
  "certificatePath": "/path/to/certificate.pfx",
  "password": "senha-do-certificado"
}
```

#### GET `/fiscal/validate-company`
**Descrição:** Validar dados fiscais da empresa
**Permissão:** COMPANY

#### GET `/fiscal/access-key/:accessKey`
**Descrição:** Buscar documento fiscal por chave de acesso
**Permissão:** ADMIN, COMPANY

#### GET `/fiscal/:id`
**Descrição:** Buscar documento fiscal por ID
**Permissão:** ADMIN, COMPANY

#### POST `/fiscal/upload-xml`
**Descrição:** Upload de arquivo XML fiscal
**Permissão:** ADMIN, COMPANY
**Content-Type:** multipart/form-data
**Body:** Arquivo XML (campo: xmlFile)
**Resposta:**
```json
{
  "id": "cmgty5s880006ww3b8bup77vb",
  "documentNumber": "123456",
  "documentType": "NFe",
  "accessKey": "35240114200166000187550010000000071123456789",
  "emissionDate": "2024-01-15T10:30:00.000Z",
  "status": "Autorizada",
  "totalValue": 1000.00,
  "message": "XML processado com sucesso"
}
```

#### GET `/fiscal/:id/download`
**Descrição:** Baixar documento fiscal em XML ou PDF
**Permissão:** ADMIN, COMPANY
**Query Parameters:**
- `format`: "xml" ou "pdf" (obrigatório)
**Headers de Resposta:**
- `Content-Type`: Tipo de conteúdo do arquivo
- `Content-Disposition`: Nome do arquivo para download
- `Content-Length`: Tamanho do arquivo em bytes
**Resposta:** Arquivo binário (XML ou PDF) ou redirecionamento para URL externa

#### GET `/fiscal/:id/download-info`
**Descrição:** Obter informações sobre formatos disponíveis para download
**Permissão:** ADMIN, COMPANY
**Resposta:**
```json
{
  "documentId": "cmgty5s880006ww3b8bup77vb",
  "documentNumber": "123456",
  "documentType": "NFe",
  "accessKey": "35240114200166000187550010000000071123456789",
  "emissionDate": "2024-01-15T10:30:00.000Z",
  "status": "Autorizada",
  "availableFormats": [
    {
      "format": "xml",
      "available": true,
      "filename": "NFe_123456.xml",
      "size": 1024,
      "downloadUrl": "/api/fiscal/cmgty5s880006ww3b8bup77vb/download?format=xml",
      "mimetype": "application/xml"
    },
    {
      "format": "pdf",
      "available": true,
      "filename": "NFe_123456.pdf",
      "downloadUrl": "/api/fiscal/cmgty5s880006ww3b8bup77vb/download?format=pdf",
      "mimetype": "application/pdf",
      "isGenerated": true
    }
  ]
}
```

#### POST `/fiscal/:id/cancel`
**Descrição:** Cancelar documento fiscal
**Permissão:** COMPANY
**Body:**
```json
{
  "reason": "Motivo do cancelamento"
}
```

---

### 9. 📁 Upload (`/upload`)

#### POST `/upload/single`
**Descrição:** Fazer upload de um arquivo
**Permissão:** ADMIN, COMPANY
**Content-Type:** `multipart/form-data`
**Body:** Arquivo + subfolder (opcional)

#### POST `/upload/multiple`
**Descrição:** Fazer upload de múltiplos arquivos
**Permissão:** ADMIN, COMPANY
**Content-Type:** `multipart/form-data`
**Body:** Múltiplos arquivos + subfolder (opcional)

#### DELETE `/upload/file`
**Descrição:** Excluir arquivo
**Permissão:** ADMIN, COMPANY
**Body:**
```json
{
  "fileUrl": "https://example.com/file.jpg"
}
```

#### DELETE `/upload/files`
**Descrição:** Excluir múltiplos arquivos
**Permissão:** ADMIN, COMPANY
**Body:**
```json
{
  "fileUrls": ["https://example.com/file1.jpg", "https://example.com/file2.jpg"]
}
```

#### POST `/upload/info`
**Descrição:** Obter informações do arquivo
**Permissão:** ADMIN, COMPANY
**Body:**
```json
{
  "fileUrl": "https://example.com/file.jpg"
}
```

#### POST `/upload/resize`
**Descrição:** Redimensionar imagem
**Permissão:** ADMIN, COMPANY
**Content-Type:** `multipart/form-data`
**Query Parameters:**
- `maxWidth` (opcional): Largura máxima
- `maxHeight` (opcional): Altura máxima

#### POST `/upload/optimize`
**Descrição:** Otimizar imagem
**Permissão:** ADMIN, COMPANY
**Content-Type:** `multipart/form-data`

---

### 10. 🖨️ Impressoras (`/printer`)

#### POST `/printer/discover`
**Descrição:** Descobrir impressoras disponíveis
**Permissão:** ADMIN, COMPANY

#### POST `/printer`
**Descrição:** Adicionar nova impressora
**Permissão:** COMPANY
**Body:**
```json
{
  "name": "Impressora Fiscal",
  "type": "thermal",
  "connection": "usb",
  "port": "USB001",
  "isDefault": true
}
```

#### GET `/printer`
**Descrição:** Listar impressoras
**Permissão:** ADMIN, COMPANY

#### GET `/printer/:id/status`
**Descrição:** Obter status da impressora
**Permissão:** ADMIN, COMPANY

#### POST `/printer/:id/test`
**Descrição:** Testar impressora
**Permissão:** ADMIN, COMPANY

#### POST `/printer/custom-footer`
**Descrição:** Atualizar footer personalizado para NFCe
**Permissão:** COMPANY
**Body:**
```json
{
  "customFooter": "Obrigado pela preferência!"
}
```

#### GET `/printer/custom-footer`
**Descrição:** Obter footer personalizado atual
**Permissão:** COMPANY

---

### 11. 💬 WhatsApp (`/whatsapp`)

#### POST `/whatsapp/send-message`
**Descrição:** Enviar mensagem via WhatsApp
**Permissão:** ADMIN, COMPANY
**Body:**
```json
{
  "to": "5511999999999",
  "message": "Olá! Sua compra foi processada.",
  "type": "text",
  "mediaUrl": "https://example.com/image.jpg",
  "filename": "recibo.pdf"
}
```

#### POST `/whatsapp/send-template`
**Descrição:** Enviar mensagem de template via WhatsApp
**Permissão:** ADMIN, COMPANY
**Body:**
```json
{
  "to": "5511999999999",
  "templateName": "venda_confirmada",
  "language": "pt_BR",
  "parameters": ["João Silva", "R$ 100,00"]
}
```

#### POST `/whatsapp/validate-phone`
**Descrição:** Validar número de telefone
**Permissão:** ADMIN, COMPANY
**Body:**
```json
{
  "phone": "5511999999999"
}
```

#### POST `/whatsapp/format-phone`
**Descrição:** Formatar número de telefone
**Permissão:** ADMIN, COMPANY
**Body:**
```json
{
  "phone": "11999999999"
}
```

---

### 12. 💳 Contas a Pagar (`/bill-to-pay`)

#### POST `/bill-to-pay`
**Descrição:** Criar nova conta a pagar
**Permissão:** COMPANY
**Body:**
```json
{
  "title": "Conta de luz - Janeiro 2024",
  "barcode": "12345678901234567890",
  "paymentInfo": "Pagar na agência do banco",
  "dueDate": "2024-02-15",
  "amount": 150.75
}
```

#### GET `/bill-to-pay`
**Descrição:** Listar contas a pagar
**Permissão:** ADMIN, COMPANY
**Query Parameters:**
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página
- `isPaid` (opcional): Se está paga
- `startDate` (opcional): Data inicial
- `endDate` (opcional): Data final

#### GET `/bill-to-pay/stats`
**Descrição:** Obter estatísticas das contas a pagar
**Permissão:** ADMIN, COMPANY

#### GET `/bill-to-pay/overdue`
**Descrição:** Listar contas em atraso
**Permissão:** ADMIN, COMPANY

#### GET `/bill-to-pay/upcoming`
**Descrição:** Listar contas próximas do vencimento
**Permissão:** ADMIN, COMPANY
**Query Parameters:**
- `days` (opcional): Dias para vencimento (padrão: 7)

#### GET `/bill-to-pay/:id`
**Descrição:** Buscar conta a pagar por ID
**Permissão:** ADMIN, COMPANY

#### PATCH `/bill-to-pay/:id`
**Descrição:** Atualizar conta a pagar
**Permissão:** ADMIN, COMPANY
**Body:** Mesma estrutura do POST (campos opcionais)

#### PATCH `/bill-to-pay/:id/mark-paid`
**Descrição:** Marcar conta como paga
**Permissão:** ADMIN, COMPANY
**Body:**
```json
{
  "paidDate": "2024-02-10",
  "paidAmount": 150.75,
  "notes": "Pago via PIX"
}
```

#### DELETE `/bill-to-pay/:id`
**Descrição:** Remover conta a pagar
**Permissão:** ADMIN, COMPANY

---

### 13. 💰 Fechamento de Caixa (`/cash-closure`)

#### POST `/cash-closure`
**Descrição:** Abrir novo fechamento de caixa
**Permissão:** COMPANY
**Body:**
```json
{
  "openingAmount": 100.00
}
```

#### GET `/cash-closure`
**Descrição:** Listar fechamentos de caixa
**Permissão:** ADMIN, COMPANY
**Query Parameters:**
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página
- `isClosed` (opcional): Se está fechado

#### GET `/cash-closure/current`
**Descrição:** Obter fechamento de caixa atual
**Permissão:** COMPANY

#### GET `/cash-closure/stats`
**Descrição:** Obter estatísticas do fechamento de caixa
**Permissão:** COMPANY

#### GET `/cash-closure/history`
**Descrição:** Obter histórico de fechamentos de caixa
**Permissão:** COMPANY
**Query Parameters:**
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página

#### GET `/cash-closure/:id`
**Descrição:** Buscar fechamento de caixa por ID
**Permissão:** ADMIN, COMPANY

#### PATCH `/cash-closure/close`
**Descrição:** Fechar fechamento de caixa atual
**Permissão:** COMPANY
**Body:**
```json
{
  "closingAmount": 500.00,
  "notes": "Fechamento do dia"
}
```

#### POST `/cash-closure/:id/reprint`
**Descrição:** Reimprimir relatório de fechamento de caixa
**Permissão:** ADMIN, COMPANY

---

### 14. 📊 Relatórios (`/reports`)

#### POST `/reports/generate`
**Descrição:** Gerar relatório completo para contabilidade
**Permissão:** COMPANY
**Body:**
```json
{
  "reportType": "sales",
  "format": "excel",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "includeProducts": true,
  "includeCustomers": true,
  "includeFiscal": true
}
```
**Formatos disponíveis:** `json`, `xml`, `excel`
**Tipos de relatório:** `sales`, `products`, `customers`, `fiscal`, `complete`

---

### 15. 🔗 N8N (`/n8n`)

#### POST `/n8n/test`
**Descrição:** Testar webhook do N8N
**Permissão:** ADMIN, COMPANY

#### GET `/n8n/status`
**Descrição:** Obter status da integração N8N
**Permissão:** ADMIN, COMPANY

#### GET `/n8n/webhook-url`
**Descrição:** Obter URL do webhook N8N
**Permissão:** ADMIN, COMPANY

---

### 16. 📊 Dashboard (`/dashboard`)

#### GET `/dashboard/metrics`
**Descrição:** Obter métricas consolidadas do dashboard
**Permissão:** ADMIN, COMPANY
**Resposta:**
```json
{
  "company": {
    "id": "cmgty5s880006ww3b8bup77v5",
    "name": "Minha Loja LTDA",
    "isActive": true
  },
  "counts": {
    "products": 150,
    "customers": 89,
    "sellers": 5,
    "sales": 1247,
    "billsToPay": 12,
    "fiscalDocuments": 89,
    "closedCashClosures": 30
  },
  "financial": {
    "totalSalesValue": 125000.50,
    "pendingBillsValue": 2500.00,
    "paidBillsValue": 15000.00,
    "stockValue": 45000.00,
    "netRevenue": 110000.50
  },
  "sales": {
    "thisMonth": {
      "count": 45,
      "value": 8500.00,
      "averageTicket": 188.89
    },
    "lastMonth": {
      "count": 38,
      "value": 7200.00
    },
    "total": {
      "count": 1247,
      "value": 125000.50,
      "averageTicket": 100.24
    },
    "growth": {
      "countPercentage": 18.42,
      "valuePercentage": 18.06
    }
  },
  "products": {
    "total": 150,
    "lowStock": 12,
    "expiring": 8,
    "stockValue": 45000.00,
    "lowStockPercentage": 8.0,
    "expiringPercentage": 5.33
  },
  "cash": {
    "currentClosure": {
      "id": "cmgty5s880006ww3b8bup77vd",
      "openingDate": "2024-01-15T08:00:00.000Z",
      "openingAmount": 100.00,
      "totalSales": 2500.00,
      "isClosed": false
    },
    "closedClosures": 30
  },
  "fiscal": {
    "totalDocuments": 89,
    "documentsThisMonth": 15,
    "documentsGrowth": 20.27
  },
  "rankings": {
    "topSellers": [
      {
        "id": "cmgty5s880006ww3b8bup77v7",
        "name": "João Silva",
        "salesCount": 45,
        "totalValue": 8500.00
      }
    ],
    "topProducts": [
      {
        "id": "cmgty5s880006ww3b8bup77v8",
        "name": "Smartphone Samsung",
        "barcode": "7891234567890",
        "salesCount": 25,
        "totalValue": 12500.00,
        "stockQuantity": 15
      }
    ]
  },
  "metadata": {
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "period": {
      "thisMonth": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-01-31T23:59:59.999Z",
        "label": "2024-01"
      },
      "lastMonth": {
        "start": "2023-12-01T00:00:00.000Z",
        "end": "2023-12-31T23:59:59.999Z",
        "label": "2023-12"
      }
    }
  }
}
```

#### GET `/dashboard/metrics/summary`
**Descrição:** Obter resumo das métricas principais
**Permissão:** ADMIN, COMPANY
**Resposta:**
```json
{
  "totalSales": 125000.50,
  "salesThisMonth": 8500.00,
  "salesGrowth": 18.06,
  "totalProducts": 150,
  "lowStockProducts": 12,
  "totalCustomers": 89,
  "totalSellers": 5,
  "pendingBills": 2500.00,
  "netRevenue": 110000.50
}
```

#### GET `/dashboard/metrics/trends`
**Descrição:** Obter tendências das métricas
**Permissão:** ADMIN, COMPANY
**Query Parameters:**
- `period` (opcional): "7d", "30d", "90d" (padrão: "30d")
**Resposta:**
```json
{
  "salesTrend": [],
  "productsTrend": [],
  "period": "30d",
  "message": "Análise de tendências em desenvolvimento"
}
```

---

### 17. ❤️ Health Check (`/health`)

#### GET `/health`
**Descrição:** Verificar status da aplicação
**Autenticação:** Não requerida
**Resposta:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

---

## 🔒 Permissões e Roles

### Roles Disponíveis:
- **ADMIN**: Acesso total ao sistema
- **COMPANY**: Acesso aos dados da própria empresa
- **SELLER**: Acesso limitado às próprias vendas

### Regras de Acesso:
- ADMIN pode acessar dados de todas as empresas
- COMPANY pode acessar apenas dados da própria empresa
- SELLER pode acessar apenas suas próprias vendas e perfil

---

## 📝 Códigos de Status HTTP

- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Dados inválidos
- **401**: Não autorizado
- **403**: Acesso negado
- **404**: Não encontrado
- **409**: Conflito (dados já existem)
- **500**: Erro interno do servidor

---

## 🔧 Exemplos de Uso

### Exemplo de Login:
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    login: 'empresa@email.com',
    password: 'senha123'
  })
});

const data = await response.json();
// Salvar access_token para uso posterior
localStorage.setItem('access_token', data.access_token);
```

### Exemplo de Listagem de Produtos:
```javascript
const response = await fetch('/api/product?page=1&limit=10&search=smartphone', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  }
});

const products = await response.json();
```

### Exemplo de Criação de Venda:
```javascript
const response = await fetch('/api/sale', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    items: [
      {
        productId: 'cmgty5s880006ww3b8bup77v8',
        quantity: 2,
        unitPrice: 50.00,
        totalPrice: 100.00
      }
    ],
    paymentMethods: [
      {
        method: 'cash',
        amount: 100.00
      }
    ]
  })
});
```

### Exemplo de Obtenção de Métricas do Dashboard:
```javascript
// Obter métricas completas
const metricsResponse = await fetch('/api/dashboard/metrics', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  }
});

const metrics = await metricsResponse.json();
console.log('Vendas do mês:', metrics.sales.thisMonth.value);
console.log('Crescimento:', metrics.sales.growth.valuePercentage + '%');
console.log('Produtos com estoque baixo:', metrics.products.lowStock);

// Obter resumo das métricas (mais rápido)
const summaryResponse = await fetch('/api/dashboard/metrics/summary', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  }
});

const summary = await summaryResponse.json();
console.log('Receita líquida:', summary.netRevenue);
console.log('Total de vendas:', summary.totalSales);
```

### Exemplo de Download de Documentos Fiscais:
```javascript
// Verificar formatos disponíveis antes do download
const downloadInfoResponse = await fetch('/api/fiscal/cmgty5s880006ww3b8bup77vb/download-info', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  }
});

const downloadInfo = await downloadInfoResponse.json();
console.log('Formatos disponíveis:', downloadInfo.availableFormats);

// Download de XML
const xmlResponse = await fetch('/api/fiscal/cmgty5s880006ww3b8bup77vb/download?format=xml', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  }
});

if (xmlResponse.ok) {
  const xmlBlob = await xmlResponse.blob();
  const xmlUrl = window.URL.createObjectURL(xmlBlob);
  const xmlLink = document.createElement('a');
  xmlLink.href = xmlUrl;
  xmlLink.download = 'NFe_123456.xml';
  xmlLink.click();
  window.URL.revokeObjectURL(xmlUrl);
}

// Download de PDF
const pdfResponse = await fetch('/api/fiscal/cmgty5s880006ww3b8bup77vb/download?format=pdf', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  }
});

if (pdfResponse.ok) {
  const pdfBlob = await pdfResponse.blob();
  const pdfUrl = window.URL.createObjectURL(pdfBlob);
  const pdfLink = document.createElement('a');
  pdfLink.href = pdfUrl;
  pdfLink.download = 'NFe_123456.pdf';
  pdfLink.click();
  window.URL.revokeObjectURL(pdfUrl);
}
```

### Exemplo de Upload de XML Fiscal:
```javascript
// Upload de arquivo XML fiscal
const formData = new FormData();
formData.append('xmlFile', xmlFile); // Arquivo XML selecionado pelo usuário

const uploadResponse = await fetch('/api/fiscal/upload-xml', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  },
  body: formData
});

if (uploadResponse.ok) {
  const result = await uploadResponse.json();
  console.log('XML processado:', result.message);
  console.log('Documento ID:', result.id);
  console.log('Chave de acesso:', result.accessKey);
  console.log('Valor total:', result.totalValue);
} else {
  const error = await uploadResponse.json();
  console.error('Erro no upload:', error.message);
}
```

---

## 🆔 IDs Válidos na Aplicação

### Formato de IDs
Todos os IDs na aplicação seguem o padrão **CUID (Collision-resistant Unique Identifier)** gerado pelo Prisma:

**Formato:** `cuid()` - String de 25 caracteres
**Exemplo:** `cmgty5s880006ww3b8bup77v5`

### Tipos de IDs por Entidade

#### 1. **Admin ID**
- **Formato:** CUID de 25 caracteres
- **Exemplo:** `cmgty5s880006ww3b8bup77v5`
- **Uso:** Identificação única de administradores

#### 2. **Company ID**
- **Formato:** CUID de 25 caracteres
- **Exemplo:** `cmgty5s880006ww3b8bup77v5`
- **Uso:** Identificação única de empresas

#### 3. **Seller ID**
- **Formato:** CUID de 25 caracteres
- **Exemplo:** `cmgty5s880006ww3b8bup77v5`
- **Uso:** Identificação única de vendedores

#### 4. **Product ID**
- **Formato:** CUID de 25 caracteres
- **Exemplo:** `cmgty5s880006ww3b8bup77v5`
- **Uso:** Identificação única de produtos

#### 5. **Customer ID**
- **Formato:** CUID de 25 caracteres
- **Exemplo:** `cmgty5s880006ww3b8bup77v5`
- **Uso:** Identificação única de clientes

#### 6. **Sale ID**
- **Formato:** CUID de 25 caracteres
- **Exemplo:** `cmgty5s880006ww3b8bup77v5`
- **Uso:** Identificação única de vendas

#### 7. **Fiscal Document ID**
- **Formato:** CUID de 25 caracteres
- **Exemplo:** `cmgty5s880006ww3b8bup77v5`
- **Uso:** Identificação única de documentos fiscais

#### 8. **Bill to Pay ID**
- **Formato:** CUID de 25 caracteres
- **Exemplo:** `cmgty5s880006ww3b8bup77v5`
- **Uso:** Identificação única de contas a pagar

#### 9. **Cash Closure ID**
- **Formato:** CUID de 25 caracteres
- **Exemplo:** `cmgty5s880006ww3b8bup77v5`
- **Uso:** Identificação única de fechamentos de caixa

#### 10. **Printer ID**
- **Formato:** CUID de 25 caracteres
- **Exemplo:** `cmgty5s880006ww3b8bup77v5`
- **Uso:** Identificação única de impressoras

### Validação de IDs

#### JavaScript - Validação de CUID
```javascript
function isValidCuid(id) {
  // CUID tem exatamente 25 caracteres
  if (typeof id !== 'string' || id.length !== 25) {
    return false;
  }
  
  // CUID começa com 'c' e contém apenas caracteres alfanuméricos
  const cuidRegex = /^c[a-z0-9]{24}$/;
  return cuidRegex.test(id);
}

// Exemplo de uso
const productId = "cmgty5s880006ww3b8bup77v5";
if (isValidCuid(productId)) {
  console.log("ID válido");
} else {
  console.log("ID inválido");
}
```

#### TypeScript - Validação de CUID
```typescript
function isValidCuid(id: string): boolean {
  if (typeof id !== 'string' || id.length !== 25) {
    return false;
  }
  
  const cuidRegex = /^c[a-z0-9]{24}$/;
  return cuidRegex.test(id);
}

// Exemplo de uso
const productId: string = "cmgty5s880006ww3b8bup77v5";
if (isValidCuid(productId)) {
  console.log("ID válido");
} else {
  console.log("ID inválido");
}
```

### IDs Especiais

#### 1. **Código de Barras de Produtos**
- **Formato:** String de 8-20 caracteres numéricos
- **Exemplo:** `7891234567890`
- **Validação:** Apenas números, sem formatação

#### 2. **CPF/CNPJ**
- **CPF:** `123.456.789-00` ou `12345678900`
- **CNPJ:** `12.345.678/0001-90` ou `12345678000190`
- **Validação:** Aceita com ou sem formatação

#### 3. **Chave de Acesso Fiscal**
- **Formato:** String de 44 caracteres numéricos
- **Exemplo:** `35240114200166000187550010000000071123456789`
- **Uso:** Identificação única de documentos fiscais

#### 4. **Número de Telefone**
- **Formato:** `(11) 99999-9999` ou `5511999999999`
- **Validação:** Aceita com ou sem formatação

### Exemplos de IDs Válidos para Testes

```javascript
// IDs válidos para testes (exemplos)
const validIds = {
  admin: "cmgty5s880006ww3b8bup77v5",
  company: "cmgty5s880006ww3b8bup77v6",
  seller: "cmgty5s880006ww3b8bup77v7",
  product: "cmgty5s880006ww3b8bup77v8",
  customer: "cmgty5s880006ww3b8bup77v9",
  sale: "cmgty5s880006ww3b8bup77va",
  fiscalDocument: "cmgty5s880006ww3b8bup77vb",
  billToPay: "cmgty5s880006ww3b8bup77vc",
  cashClosure: "cmgty5s880006ww3b8bup77vd",
  printer: "cmgty5s880006ww3b8bup77ve"
};

// Códigos de barras válidos
const validBarcodes = [
  "7891234567890",
  "1234567890123",
  "9876543210987"
];

// CPF/CNPJ válidos
const validDocuments = {
  cpf: "123.456.789-00",
  cnpj: "12.345.678/0001-90"
};
```

### Tratamento de Erros com IDs

#### Erro 400 - ID Inválido
```json
{
  "statusCode": 400,
  "message": "ID inválido",
  "error": "Bad Request"
}
```

#### Erro 404 - ID Não Encontrado
```json
{
  "statusCode": 404,
  "message": "Recurso não encontrado",
  "error": "Not Found"
}
```

### Boas Práticas para IDs

1. **Validação no Frontend**: Sempre validar IDs antes de enviar requisições
2. **Tratamento de Erros**: Implementar tratamento adequado para IDs inválidos
3. **Cache de IDs**: Armazenar IDs válidos em cache para melhor performance
4. **Logs**: Registrar IDs inválidos para debugging
5. **Testes**: Usar IDs válidos nos testes automatizados

---

## ⚠️ Observações Importantes

1. **Autenticação**: Sempre incluir o token de acesso no header Authorization
2. **Cookies**: O sistema usa cookies HTTP-only para refresh tokens
3. **Validação**: Todos os campos obrigatórios devem ser enviados
4. **Formato de Data**: Use formato ISO 8601 (YYYY-MM-DD)
5. **Upload de Arquivos**: Use Content-Type multipart/form-data
6. **Paginação**: Use page e limit para listagens grandes
7. **Filtros**: Use query parameters para filtrar resultados
8. **IDs**: Todos os IDs são CUIDs de 25 caracteres gerados pelo Prisma
9. **Validação de IDs**: Sempre validar formato de ID antes de enviar requisições
10. **Tratamento de Erros**: Implementar tratamento adequado para IDs inválidos ou não encontrados

---

Esta documentação cobre todas as rotas disponíveis na API. Para implementação no frontend, siga os exemplos fornecidos e mantenha a consistência com os tipos de dados especificados.

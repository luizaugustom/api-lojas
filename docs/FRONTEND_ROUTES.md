# Mapeamento de Rotas da API (guia para o Frontend)

Este documento descreve as rotas disponíveis, autenticação, parâmetros e exemplos de payloads e respostas para integração do frontend.

Base URL (dev): http://localhost:3000

Observações importantes
- Autenticação: a maioria das rotas é protegida por JWT. Use Authorization: Bearer <access_token> (ou cookies httpOnly se o front optar por isso com withCredentials: true).
- Refresh: POST /auth/refresh usa cookie httpOnly. Envie as requisições com credenciais (withCredentials/credentials: 'include') para que o cookie vá junto.
- CORS: configure CORS_ORIGIN no backend com a URL do frontend (ex.: http://localhost:5173). Com credentials habilitado, não use '*'.
- Paginação padrão: page=1, limit=10.
- Datas: quando houver filtros de data, use ISO 8601 (ex.: 2025-10-15 ou 2025-10-15T00:00:00.000Z).

## Autenticação

POST /auth/login (public)
- Body
```json
{
  "login": "empresa@example.com",
  "password": "company123"
}
```
- Response
```json
{
  "access_token": "<jwt>",
  "user": {
    "id": "...",
    "login": "empresa@example.com",
    "role": "company",
    "companyId": "<mesmo id da empresa>",
    "name": "Loja Exemplo LTDA"
  }
}
```
- Efeito: servidor seta cookie httpOnly `refresh_token` (e `access_token` opcionalmente).

POST /auth/refresh (public, via cookie)
- Body: vazio
- Response
```json
{
  "access_token": "<novo jwt>",
  "user": { "id": "...", "login": "...", "role": "company", "companyId": "..." }
}
```

POST /auth/logout (autenticado via cookie)
- Body: vazio
- Response: `{ "message": "Logged out" }`

Exemplo Axios (login + uso):
```ts
const baseURL = 'http://localhost:3000';
const api = axios.create({ baseURL, withCredentials: true });

async function login(login: string, password: string) {
  const { data } = await api.post('/auth/login', { login, password });
  api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
  return data.user;
}
```

---

## Produtos (/product)

GET /product
- Roles: admin, company, seller
- Query: `page?`, `limit?`, `search?`
- Exemplo:
```
GET /product?page=1&limit=20&search=
Authorization: Bearer <token>
```
- Resposta (resumo):
```json
{
  "products": [
    {
      "id": "...",
      "name": "Smartphone Samsung Galaxy",
      "barcode": "7891234567890",
      "stockQuantity": 50,
      "price": 1299.99,
      "category": "Eletrônicos",
      "company": { "id": "...", "name": "Loja Exemplo LTDA" }
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

POST /product (company)
- Body
```json
{
  "name": "Camiseta Polo",
  "photos": ["https://.../polo.jpg"],
  "barcode": "7891234567899",
  "size": "M",
  "stockQuantity": 75,
  "price": 89.99,
  "category": "Roupas",
  "expirationDate": "2025-12-31"
}
```

PATCH /product/:id (admin, company)
- Body (exemplo parcial)
```json
{ "price": 99.9, "stockQuantity": 80 }
```

PATCH /product/:id/stock (admin, company)
- Body
```json
{ "stockQuantity": 120 }
```

DELETE /product/:id (admin, company)
- Observação: falha se houver vendas associadas.

Extras:
- GET /product/:id
- GET /product/barcode/:barcode
- GET /product/categories
- GET /product/stats
- GET /product/low-stock?threshold=10
- GET /product/expiring?days=30

---

## Empresas (/company)

GET /company/my-company (company, seller)
- Retorna dados da empresa do usuário logado.

PATCH /company/my-company (company)
- Body (exemplo)
```json
{
  "phone": "(11) 99999-9999",
  "email": "contato@lojaexemplo.com",
  "brandColor": "#FF0000"
}
```

GET /company (admin, company)
- Admin: todas; Company: somente sua.

---

## Vendedores (/seller)

POST /seller (company)
- Body
```json
{
  "login": "novo.vendedor@example.com",
  "password": "senhaSegura",
  "name": "Fulano de Tal",
  "cpf": "123.456.789-00",
  "email": "fulano@example.com",
  "phone": "(11) 90000-0000"
}
```

GET /seller (admin, company)
- Lista vendedores (da empresa no caso de company).

---

## Vendas (/sale)

POST /sale (company, seller)
- Body
```json
{
  "items": [
    { "productId": "...", "quantity": 2, "unitPrice": 1299.99 }
  ],
  "paymentMethod": ["pix"],
  "clientCpfCnpj": "987.654.321-00",
  "clientName": "Maria Santos",
  "isInstallment": false,
  "change": 0
}
```

GET /sale (admin, company, seller)
- Query: `page?`, `limit?`, `sellerId?`, `startDate?`, `endDate?`

POST /sale/exchange (company)
- Body
```json
{
  "originalSaleId": "...",
  "productId": "...",
  "reason": "Troca por defeito",
  "exchangedQuantity": 1
}
```

---

## Clientes (/customer)

POST /customer (company)
- Body
```json
{
  "name": "Cliente X",
  "phone": "(11) 77777-7777",
  "cpfCnpj": "987.654.321-00",
  "zipCode": "04567-890",
  "city": "São Paulo"
}
```

GET /customer (admin, company)
- Query: `page?`, `limit?`, `search?`

---

## Contas a pagar (/bill-to-pay)

POST /bill-to-pay (company)
- Body
```json
{
  "title": "Conta de luz - Novembro 2025",
  "barcode": "12345678901234567890",
  "paymentInfo": "Banco XYZ",
  "dueDate": "2025-11-15",
  "amount": 150.75
}
```

GET /bill-to-pay (admin, company)
- Query: `page?`, `limit?`, `isPaid?`, `startDate?`, `endDate?`

PATCH /bill-to-pay/:id/mark-paid (admin, company)
- Body
```json
{ "paidAt": "2025-11-16T10:30:00.000Z" }
```

---

## Fechamento de caixa (/cash-closure)

POST /cash-closure (company)
- Body
```json
{ "openingAmount": 100.00 }
```

PATCH /cash-closure/close (company)
- Body
```json
{ "closingAmount": 500.00 }
```

GET /cash-closure/current (company)
- Retorna fechamento aberto.

---

## Uploads (/upload)

POST /upload/single (admin, company)
- multipart/form-data com campo `file` e opcional `subfolder`.

DELETE /upload/file (admin, company)
- Body
```json
{ "fileUrl": "https://..." }
```

---

## Relatórios (/reports)

POST /reports/generate (company)
- Body
```json
{
  "reportType": "sales", // ou products, customers, bills, fiscal
  "format": "excel" // json | xml | excel
}
```
- Resposta: arquivo em anexo (Content-Disposition: attachment)

---

## Fiscal (/fiscal)

POST /fiscal/nfe (company)
- Body
```json
{
  "clientCpfCnpj": "123.456.789-00",
  "clientName": "Cliente Teste",
  "items": [
    { "productId": "...", "quantity": 1, "unitPrice": 1299.99 }
  ],
  "totalValue": 1299.99,
  "paymentMethod": ["credit"]
}
```

GET /fiscal (admin, company)
- Query: `page?`, `limit?`, `documentType?`

---

## Impressoras (/printer)

GET /printer (admin, company)
- Lista impressoras cadastradas.

POST /printer/discover (admin, company)
- Busca impressoras disponíveis.

---

## WhatsApp (/whatsapp)

POST /whatsapp/send-message (admin, company)
- Body
```json
{
  "to": "+5511999999999",
  "message": "Olá! Seu pedido foi concluído.",
  "type": "text"
}
```

---

## Exemplos rápidos (PowerShell)

Login + listar produtos (empresa):
```powershell
$login = Invoke-RestMethod -Uri http://localhost:3000/auth/login -Method POST -ContentType 'application/json' -Body (@{ login='empresa@example.com'; password='company123' } | ConvertTo-Json)
$token = $login.access_token
Invoke-RestMethod -Uri 'http://localhost:3000/product?page=1&limit=20' -Headers @{ Authorization = "Bearer $token" }
```

---

## Erros comuns
- 401 Unauthorized: token ausente/expirado ou não enviado no header Authorization (ou cookies sem withCredentials). Faça refresh ou login novamente.
- 403 Forbidden: role não autorizada para a rota.
- 409 Conflict: campos únicos duplicados (ex.: barcode, login, cnpj, email).

---

Dúvidas ou ajustes? Abra uma issue no repositório indicando a rota e um exemplo da requisição/resposta.

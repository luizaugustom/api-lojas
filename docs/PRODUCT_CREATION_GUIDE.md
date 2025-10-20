# 📋 Guia de Criação de Produtos - Correção de Erros

Este guia mostra como corrigir os erros de validação na criação de produtos.

## 🚨 Erros Comuns

### **Erro 1: Campos não permitidos**
```json
{
  "message": [
    "property activityId should not exist",
    "each value in photos must be a string"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### **Erro 2: Formato de data inválido**
```
Invalid value for argument `expirationDate`: premature end of input. Expected ISO-8601 DateTime.
```

## ✅ Soluções Implementadas

### 1. **Interceptor de Sanitização**
- Remove automaticamente campos não permitidos (`activityId`, `companyId`, etc.)
- Sanitiza array de `photos` para conter apenas strings válidas
- Converte strings para números quando necessário
- **Converte datas automaticamente** para formato ISO-8601 DateTime

### 2. **Validação Robusta**
- DTO atualizado com transformações automáticas
- Filtros para remover valores inválidos do array `photos`
- **Conversão automática de datas** (YYYY-MM-DD → ISO DateTime)

## 📝 Exemplos Corretos

### **Criação Básica (POST `/product`)**

```json
{
  "name": "Smartphone Samsung Galaxy",
  "barcode": "7891234567890",
  "stockQuantity": 100,
  "price": 1299.99,
  "category": "Eletrônicos",
  "expirationDate": "2025-12-31"
}
```

**Nota:** A data `"2025-12-31"` será automaticamente convertida para `"2025-12-31T00:00:00.000Z"` pelo sistema.

### **Criação com Fotos (POST `/product`)**

```json
{
  "name": "Notebook Dell Inspiron",
  "barcode": "7891234567891",
  "stockQuantity": 50,
  "price": 2599.99,
  "category": "Informática",
  "photos": [
    "/uploads/products/company123/photo1.jpg",
    "/uploads/products/company123/photo2.jpg"
  ]
}
```

### **Criação com Upload (POST `/product/upload-and-create`)**

```javascript
const formData = new FormData();
formData.append('name', 'Produto com Upload');
formData.append('barcode', '7891234567893');
formData.append('stockQuantity', '30');
formData.append('price', '199.99');
formData.append('category', 'Teste');
formData.append('photos', file1);
formData.append('photos', file2);
```

## ❌ Dados que Causam Erro

```json
{
  "name": "Produto Teste",
  "activityId": "abc123",           // ← REMOVER
  "companyId": "company123",        // ← REMOVER (automático)
  "barcode": "7891234567892",
  "stockQuantity": 25,
  "price": 99.99,
  "photos": [
    { "url": "/uploads/photo.jpg" }, // ← INCORRETO: objeto
    null,                            // ← INCORRETO: null
    undefined,                       // ← INCORRETO: undefined
    "/uploads/valid-photo.jpg"       // ← CORRETO: string
  ]
}
```

## ✅ Dados Corrigidos

```json
{
  "name": "Produto Teste",
  "barcode": "7891234567892",
  "stockQuantity": 25,
  "price": 99.99,
  "photos": [
    "/uploads/valid-photo1.jpg",     // ← CORRETO: string
    "/uploads/valid-photo2.jpg"      // ← CORRETO: string
  ]
}
```

## 🛠️ Campos Permitidos

### **Obrigatórios:**
- `name` (string, 2-255 caracteres)
- `barcode` (string, 8-20 caracteres, único)
- `stockQuantity` (number, ≥ 0)
- `price` (number, ≥ 0)

### **Opcionais:**
- `photos` (array de strings - URLs)
- `size` (string, máx 50 caracteres)
- `category` (string, máx 100 caracteres)
- `expirationDate` (string, formato ISO date)

## 🚫 Campos Proibidos

- `activityId` ❌
- `companyId` ❌ (definido automaticamente)
- `id` ❌ (gerado automaticamente)
- `createdAt` ❌ (gerado automaticamente)
- `updatedAt` ❌ (gerado automaticamente)

## 📅 Formatos de Data Aceitos

O campo `expirationDate` aceita os seguintes formatos (todos são convertidos automaticamente):

### **✅ Formatos Aceitos:**
```javascript
// Data simples (mais comum)
"2025-12-31"

// Data ISO completa
"2025-12-31T00:00:00.000Z"

// Data com hora
"2025-12-31T14:30:00Z"

// Sem data (opcional)
undefined
null
```

### **❌ Formatos Não Aceitos:**
```javascript
// Data inválida
"31/12/2025"  // Formato brasileiro

// Data malformada
"2025-13-32"  // Mês/dia inválidos

// String vazia
""
```

## 🧪 Testando

### **Teste Geral:**
```bash
node scripts/test-product-creation.js
```

### **Teste Específico de Datas:**
```bash
node scripts/test-date-conversion.js
```

## 🔧 Troubleshooting

### **Erro: "property activityId should not exist"**
- **Causa:** Enviando campo `activityId` que não existe no DTO
- **Solução:** Remover o campo `activityId` da requisição

### **Erro: "each value in photos must be a string"**
- **Causa:** Array `photos` contém objetos, null ou undefined
- **Solução:** Garantir que array contém apenas strings (URLs)

### **Erro: "Código de barras já está em uso"**
- **Causa:** `barcode` já existe para outro produto
- **Solução:** Usar um código de barras único

### **Erro: "Expected ISO-8601 DateTime"**
- **Causa:** Data no formato incorreto (ex: "2025-12-31")
- **Solução:** Sistema converte automaticamente, mas você pode enviar no formato ISO completo

## 📞 Suporte

Se os problemas persistirem após seguir este guia, verifique:

1. ✅ Token JWT válido
2. ✅ Permissões de usuário (COMPANY)
3. ✅ Dados no formato correto
4. ✅ Campos obrigatórios preenchidos

O sistema agora sanitiza automaticamente os dados e deve funcionar corretamente! 🎯

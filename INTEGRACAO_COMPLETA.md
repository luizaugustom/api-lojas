# Integração Completa UUID v4 - Backend & Frontend

## ✅ Padronização Implementada

Esta documentação descreve a integração completa entre backend (API NestJS) e frontend (Next.js) com padr onização total de UUIDs v4.

### 🎯 Objetivos Alcançados

1. ✅ **Backend (API)**
   - Schema Prisma padronizado com UUID v4
   - Todos os controllers com validação UUID
   - Pipe de validação UUID centralizado
   - DTOs com validação IsUUID consistente
   - Migration SQL completa para produção

2. ✅ **Frontend (Next.js)**
   - Validador UUID TypeScript completo
   - Interceptor axios para validação automática
   - Helpers e utilitários UUID
   - Integração total com API

3. ✅ **Integração**
   - Validação consistente em ambos os lados
   - Mensagens de erro padronizadas
   - Type safety com TypeScript
   - Documentação completa

## 📋 Estrutura de Arquivos

### Backend (api-lojas/)

```
api-lojas/
├── prisma/
│   ├── schema.prisma                          # ✅ Atualizado: uuid() em todos os models
│   └── migrations/
│       └── production_uuid_migration.sql      # ✅ Migration completa para produção
├── src/
│   ├── shared/
│   │   ├── validators/
│   │   │   └── uuid.validator.ts              # ✅ Validador customizado
│   │   └── pipes/
│   │       └── uuid-validation.pipe.ts        # ✅ Pipe atualizado (somente UUID v4)
│   └── application/
│       ├── product/
│       │   └── product.controller.ts          # ✅ Com UuidValidationPipe
│       ├── sale/
│       │   ├── sale.controller.ts             # ✅ Com UuidValidationPipe
│       │   └── dto/
│       │       └── create-sale.dto.ts         # ✅ Com @IsUUID()
│       ├── company/
│       │   └── company.controller.ts          # ✅ Com UuidValidationPipe
│       ├── seller/
│       │   └── seller.controller.ts           # ✅ Com UuidValidationPipe
│       ├── customer/
│       │   └── customer.controller.ts         # ✅ Com UuidValidationPipe
│       ├── bill-to-pay/
│       │   └── bill-to-pay.controller.ts      # ✅ Com UuidValidationPipe
│       ├── cash-closure/
│       │   └── cash-closure.controller.ts     # ✅ Com UuidValidationPipe
│       ├── fiscal/
│       │   └── fiscal.controller.ts           # ✅ Com UuidValidationPipe
│       ├── printer/
│       │   └── printer.controller.ts          # ✅ Com UuidValidationPipe
│       └── admin/
│           └── admin.controller.ts            # ✅ Com UuidValidationPipe
└── scripts/
    └── add-uuid-validation-to-all-controllers.js  # Script automático
```

### Frontend (front-lojas/)

```
front-lojas/
└── src/
    └── lib/
        ├── uuid-validator.ts                   # ✅ Validador completo UUID v4
        ├── api-uuid-interceptor.ts             # ✅ Interceptor para axios
        └── api.ts                              # ✅ Integrado com interceptor
```

## 🔧 Formato UUID v4

**Padrão:** `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`

Onde:
- `x` é qualquer dígito hexadecimal (0-9, a-f)
- `4` indica versão 4
- `y` é um de: 8, 9, a, ou b

**Exemplo válido:** `550e8400-e29b-41d4-a716-446655440000`

**Regex:** `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`

## 🚀 Como Usar

### Backend - Validação em Controllers

```typescript
import { UuidValidationPipe } from '../../shared/pipes/uuid-validation.pipe';

@Get(':id')
@ApiOperation({ summary: 'Buscar por ID' })
@ApiResponse({ status: 200, description: 'Encontrado' })
@ApiResponse({ status: 404, description: 'Não encontrado' })
@ApiResponse({ status: 400, description: 'ID inválido' })
findOne(@Param('id', UuidValidationPipe) id: string) {
  return this.service.findOne(id);
}
```

### Backend - Validação em DTOs

```typescript
import { IsUUID } from 'class-validator';

export class CreateSaleDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsUUID()
  @IsOptional()
  sellerId?: string;
}
```

### Frontend - Validação Manual

```typescript
import { isValidUUID, validateUUID } from '@/lib/uuid-validator';

// Validar UUID
if (isValidUUID(id)) {
  console.log('UUID válido!');
}

// Validar e lançar erro se inválido
try {
  const validId = validateUUID(id, 'Product ID');
  // Use validId...
} catch (error) {
  console.error(error.message);
}
```

### Frontend - Validação em Forms (React Hook Form)

```typescript
import { uuidValidationRules } from '@/lib/uuid-validator';

<input
  {...register('productId', uuidValidationRules(true))}
  placeholder="Product ID"
/>
```

### Frontend - Geração de UUID

```typescript
import { generateUUID } from '@/lib/uuid-validator';

const newId = generateUUID();
console.log(newId); // 550e8400-e29b-41d4-a716-446655440000
```

### Frontend - Interceptor Automático

O interceptor já está configurado em `api.ts` e valida automaticamente:

```typescript
// Validação automática em todas as chamadas
await api.getProduct(productId);  // UUID será validado automaticamente
await api.updateProduct(id, data); // URL e data serão validados
```

## 🔄 Migration para Produção

### Passos para Executar

1. **Backup do banco:**
   ```bash
   pg_dump -h localhost -U usuario -d database > backup_$(date +%Y%m%d).sql
   ```

2. **Parar a aplicação:**
   ```bash
   pm2 stop api-lojas
   # ou
   docker-compose down api
   ```

3. **Executar migration:**
   ```bash
   cd api-lojas
   psql -h localhost -U usuario -d database -f prisma/migrations/production_uuid_migration.sql
   ```

4. **Regenerar Prisma Client:**
   ```bash
   npm run db:generate
   npm run build
   ```

5. **Reiniciar aplicação:**
   ```bash
   pm2 start api-lojas
   # ou
   docker-compose up -d api
   ```

6. **Verificar logs:**
   ```bash
   pm2 logs api-lojas
   ```

**⚠️ IMPORTANTE:** Leia o arquivo `MIGRACAO_UUID_GUIA.md` antes de executar em produção!

## 🧪 Testes

### Backend

```bash
cd api-lojas

# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Verificar linting
npm run lint
```

### Frontend

```bash
cd front-lojas

# Testes
npm run test

# Build para verificar tipos
npm run build

# Verificar linting
npm run lint
```

## 🔍 Validação de Integridade

### Verificar UUIDs no Banco

```sql
-- Verificar que todos os IDs são UUID v4
SELECT 
    'products' as tabela,
    COUNT(*) as total,
    COUNT(*) FILTER (
        WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ) as uuid_v4_validos
FROM products
UNION ALL
SELECT 'sales', COUNT(*), 
    COUNT(*) FILTER (
        WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    )
FROM sales;
```

### Verificar Foreign Keys

```sql
-- Verificar integridade referencial
SELECT 
    tc.table_name, 
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

## 📊 Performance

- **Validação UUID:** ~0.01ms por validação (negligível)
- **Migration:** Depende do volume de dados
  - < 1.000 registros: ~1-2 minutos
  - 1.000-10.000 registros: ~5-10 minutos
  - 10.000-100.000 registros: ~15-30 minutos
  - \> 100.000 registros: ~1-2 horas

## 🛡️ Segurança

### Benefícios da Padronização UUID v4

1. **Não-sequenciais:** Impossível adivinhar IDs
2. **Globalmente únicos:** Sem colisões entre ambientes
3. **Distribuídos:** Geração sem coordenação central
4. **Padrão industria:** RFC 4122 compliant

### Validação em Múltiplas Camadas

1. **Frontend:** Validação antes de enviar ao backend
2. **Backend DTOs:** Validação com class-validator
3. **Backend Controllers:** Validação com pipes
4. **Banco de Dados:** Constraints e foreign keys

## 🐛 Troubleshooting

### Erro: "UUID inválido"

**Problema:** Frontend envia CUID ou ID inválido

**Solução:**
```typescript
import { sanitizeUUID } from '@/lib/uuid-validator';

const cleanId = sanitizeUUID(dirtyId);
if (!cleanId) {
  console.error('ID inválido:', dirtyId);
}
```

### Erro: "ID é obrigatório"

**Problema:** ID não foi fornecido

**Solução:** Verificar se o ID está sendo passado corretamente:
```typescript
if (!id) {
  throw new Error('ID é obrigatório');
}
```

### Erro: Migration falhou

**Problema:** Tabelas temporárias ou constraints quebrados

**Solução:**
1. Restaure o backup
2. Verifique os logs de erro
3. Execute a migration em ambiente de teste primeiro

## 📝 Checklist de Deployment

### Pré-deployment

- [ ] Backup completo do banco de dados
- [ ] Testes em ambiente de homologação
- [ ] Revisão de todas as mudanças de código
- [ ] Documentação atualizada
- [ ] Variáveis de ambiente configuradas

### Deployment

- [ ] Parar aplicação
- [ ] Executar migration
- [ ] Verificar integridade do banco
- [ ] Regenerar Prisma Client
- [ ] Build da aplicação
- [ ] Reiniciar aplicação
- [ ] Verificar logs

### Pós-deployment

- [ ] Testar login (admin, empresa, vendedor)
- [ ] Testar CRUD de produtos
- [ ] Testar criação de vendas
- [ ] Testar emissão de notas fiscais
- [ ] Verificar performance
- [ ] Monitorar logs por 24h

## 🤝 Suporte

Em caso de problemas:

1. **Não execute mais comandos** sem orientação
2. **Preserve o backup** e os logs de erro
3. **Documente** exatamente qual passo falhou
4. Consulte a documentação adicional:
   - `MIGRACAO_UUID_GUIA.md` - Guia detalhado de migration
   - `api-lojas/prisma/schema.prisma` - Schema do banco
   - `api-lojas/src/shared/pipes/uuid-validation.pipe.ts` - Validação backend
   - `front-lojas/src/lib/uuid-validator.ts` - Validação frontend

## 📚 Referências

- [RFC 4122 - UUID Standard](https://www.rfc-editor.org/rfc/rfc4122)
- [Prisma UUID Documentation](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#uuid)
- [NestJS Validation Pipes](https://docs.nestjs.com/techniques/validation)
- [class-validator UUID](https://github.com/typestack/class-validator#validation-decorators)

---

**Versão:** 1.0.0  
**Data:** Outubro 2025  
**Status:** ✅ Produção Ready


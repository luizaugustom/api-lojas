# Migration: Fix exchangedQuantity Constraint Violation

## Descrição

Esta migração remove o campo `exchangedQuantity` da tabela `product_exchanges` que está causando erro de constraint violation.

## Erro Corrigido

```
Null constraint violation on the fields: (`exchangedQuantity`)
```

## Campos Removidos

- `exchangedQuantity` (camelCase) ⚠️ **Principal causador do erro**
- `exchanged_quantity` (snake_case)
- `originalQuantity` (camelCase)
- `original_quantity` (snake_case)
- `product_id` (snake_case)
- `productId` (camelCase)

## Como Aplicar

### Em Produção:

```bash
cd api-lojas
npm run db:migrate:deploy
```

### Ou via SQL direto:

```bash
psql -h SEU_HOST -U SEU_USUARIO -d SEU_BANCO -f prisma/migrations/20251124220000_fix_exchanged_quantity_constraint/migration.sql
```

### Verificar se foi aplicada:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'product_exchanges'
  AND column_name IN ('exchangedQuantity', 'exchanged_quantity');
```

Se não retornar nenhuma linha, a migração foi aplicada com sucesso! ✅

## Segurança

✅ Esta migração é **idempotente** - pode ser executada múltiplas vezes  
✅ Usa `IF EXISTS` para verificar antes de remover  
✅ Não remove dados, apenas colunas não utilizadas  
✅ Usa transações para garantir atomicidade  

## Após Aplicar

**IMPORTANTE**: Reinicie a aplicação após aplicar a migração!

```bash
pm2 restart api-lojas
# ou
docker-compose restart app
```


# 🚨 Solução: Erro `exchangedQuantity` em Produção

## ❌ Problema

O erro `Null constraint violation on the fields: (exchangedQuantity)` ocorre porque:
- O campo `exchangedQuantity` ainda existe no banco de dados de produção como NOT NULL
- O campo foi removido do schema do Prisma
- O código não envia mais esse campo ao criar `ProductExchange`
- A migração não está sendo aplicada ou não aparece em produção

## ✅ Solução Rápida (Escolha uma opção)

### Opção 1: Script Node.js (RECOMENDADO - Mais Fácil)

Execute diretamente na produção:

```bash
cd api-lojas
npm run fix:exchanged-quantity
```

Este script:
- ✅ Verifica automaticamente se o campo existe
- ✅ Remove o campo se encontrado
- ✅ Funciona independente do Prisma Migrate
- ✅ Mostra status detalhado

### Opção 2: Script SQL Direto

Execute o SQL diretamente no banco:

```bash
# Via psql
psql -h SEU_HOST -U SEU_USUARIO -d SEU_BANCO -f api-lojas/prisma/fix_exchange_fields_standalone.sql

# Ou copie e cole o conteúdo do arquivo no seu cliente SQL (pgAdmin, DBeaver, etc.)
```

Arquivo: `api-lojas/prisma/fix_exchange_fields_standalone.sql`

### Opção 3: SQL Manual

Execute este SQL no seu banco de dados:

```sql
BEGIN;

-- Remove exchangedQuantity (camelCase) - ESTE É O QUE ESTÁ CAUSANDO O ERRO
ALTER TABLE "product_exchanges" DROP COLUMN IF EXISTS "exchangedQuantity";

-- Remove exchanged_quantity (snake_case)
ALTER TABLE "product_exchanges" DROP COLUMN IF EXISTS "exchanged_quantity";

-- Remove outros campos antigos se existirem
ALTER TABLE "product_exchanges" DROP COLUMN IF EXISTS "originalQuantity";
ALTER TABLE "product_exchanges" DROP COLUMN IF EXISTS "original_quantity";
ALTER TABLE "product_exchanges" DROP COLUMN IF EXISTS "product_id";
ALTER TABLE "product_exchanges" DROP COLUMN IF EXISTS "productId";

COMMIT;
```

## 🔄 Após Executar

**IMPORTANTE**: Reinicie a aplicação!

```bash
# PM2
pm2 restart api-lojas

# Docker
docker-compose restart app

# Ou reinicie o serviço da forma que preferir
```

## ✅ Verificação

Após executar, verifique se funcionou:

```sql
-- Verificar se o campo ainda existe
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'product_exchanges'
  AND column_name IN ('exchangedQuantity', 'exchanged_quantity');
```

Se não retornar nenhuma linha, está correto! ✅

## 📋 O que o script remove

- `originalQuantity` / `original_quantity`
- `exchangedQuantity` / `exchanged_quantity` ⚠️ **Este causa o erro**
- `product_id` / `productId`

## 🔒 Segurança

✅ Scripts são **idempotentes** - podem ser executados múltiplas vezes  
✅ Não remove dados, apenas colunas não utilizadas  
✅ Usa `IF EXISTS` para verificar antes de remover  

## 🆘 Problemas?

1. **Sem permissão**: Verifique se o usuário do banco tem permissão para ALTER TABLE
2. **Tabela bloqueada**: Verifique se não há transações abertas
3. **Erro de conexão**: Verifique as variáveis de ambiente `DATABASE_URL`

## 📞 Suporte

Se ainda houver problemas:
- Verifique os logs da aplicação
- Confirme que o Prisma Client foi regenerado: `npm run db:generate`
- Verifique se a tabela `product_exchanges` existe


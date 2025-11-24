# 🔧 Instruções para Corrigir o Erro de `exchangedQuantity` em Produção

## Problema
O erro `Null constraint violation on the fields: (exchangedQuantity)` está ocorrendo porque o campo `exchangedQuantity` ainda existe no banco de dados de produção como NOT NULL, mas foi removido do schema do Prisma.

## Solução Rápida (Recomendada)

### Passo 1: Execute o Script SQL de Correção

Execute o script SQL diretamente no banco de dados de produção:

```bash
psql -h SEU_HOST -U SEU_USUARIO -d SEU_BANCO -f prisma/fix_exchange_fields_production.sql
```

Ou via cliente SQL (pgAdmin, DBeaver, etc.):
1. Conecte-se ao banco de dados de produção
2. Abra o arquivo `prisma/fix_exchange_fields_production.sql`
3. Execute o script completo

### Passo 2: Marque a Migração como Aplicada (Opcional)

Se você quiser que o Prisma reconheça que a migração foi aplicada:

```bash
psql -h SEU_HOST -U SEU_USUARIO -d SEU_BANCO -f prisma/mark_migration_as_applied.sql
```

### Passo 3: Reinicie a Aplicação

Após executar o script, **reinicie a aplicação** para que as mudanças tenham efeito:

```bash
# Se estiver usando PM2
pm2 restart api-lojas

# Ou se estiver usando Docker
docker-compose restart api

# Ou simplesmente reinicie o serviço
```

## Verificação

Após executar o script, você deve ver mensagens como:
- ✅ Coluna exchangedQuantity removida (ERRO CORRIGIDO)
- ✅ SUCESSO: Todos os campos antigos foram removidos!

## Alternativa: Usar o Prisma Migrate (Se Tiver Acesso)

Se você tiver acesso ao ambiente de produção e puder executar comandos do Prisma:

```bash
cd api-lojas
npm run db:migrate:deploy
```

Mas se a migração não estiver sendo reconhecida, use a **Solução Rápida** acima.

## Campos que Serão Removidos

O script remove os seguintes campos antigos:
- `originalQuantity` / `original_quantity`
- `exchangedQuantity` / `exchanged_quantity` ⚠️ **Este é o que está causando o erro**
- `product_id` / `productId`

## Segurança

✅ O script é **idempotente** - pode ser executado múltiplas vezes sem problemas
✅ Usa `IF EXISTS` para verificar antes de remover
✅ Usa transações (`BEGIN`/`COMMIT`) para garantir atomicidade
✅ Não remove dados, apenas colunas que não são mais necessárias

## Suporte

Se encontrar algum problema, verifique:
1. Se você tem permissões para alterar a estrutura da tabela
2. Se não há transações abertas bloqueando a tabela
3. Os logs do script para ver quais colunas foram removidas


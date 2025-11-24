# 🚨 CORREÇÃO URGENTE: Erro `exchangedQuantity` em Produção

## Problema
O erro `Null constraint violation on the fields: (exchangedQuantity)` está ocorrendo porque o campo `exchangedQuantity` ainda existe no banco de dados de produção como NOT NULL, mas foi removido do schema do Prisma.

## ✅ Solução Rápida (RECOMENDADA)

### Opção 1: Executar o Script SQL de Correção (Mais Rápido)

Execute o script SQL diretamente no banco de dados de produção:

```bash
# Via psql
psql -h SEU_HOST -U SEU_USUARIO -d SEU_BANCO -f api-lojas/prisma/fix_exchange_fields_production.sql

# Ou via cliente SQL (pgAdmin, DBeaver, etc.):
# 1. Conecte-se ao banco de dados de produção
# 2. Abra o arquivo api-lojas/prisma/fix_exchange_fields_production.sql
# 3. Execute o script completo
```

### Opção 2: Aplicar a Migração via Prisma

Se você tiver acesso ao ambiente de produção e puder executar comandos do Prisma:

```bash
cd api-lojas
npm run db:migrate:deploy
```

## 🔄 Após Executar a Correção

**IMPORTANTE**: Reinicie a aplicação após executar o script!

```bash
# Se estiver usando PM2
pm2 restart api-lojas

# Ou se estiver usando Docker
docker-compose restart app

# Ou reinicie o serviço da forma que preferir
```

## ✅ Verificação

Após executar o script, você deve ver mensagens como:
- ✅ Coluna exchangedQuantity removida (ERRO CORRIGIDO)
- ✅ SUCESSO: Todos os campos antigos foram removidos!

## 📝 Detalhes Técnicos

O script remove os seguintes campos antigos da tabela `product_exchanges`:
- `originalQuantity` / `original_quantity`
- `exchangedQuantity` / `exchanged_quantity` ⚠️ **Este é o que está causando o erro**
- `product_id` / `productId`

## 🔒 Segurança

✅ O script é **idempotente** - pode ser executado múltiplas vezes sem problemas  
✅ Usa `IF EXISTS` para verificar antes de remover  
✅ Usa transações (`BEGIN`/`COMMIT`) para garantir atomicidade  
✅ Não remove dados, apenas colunas que não são mais necessárias  

## 🆘 Se Ainda Houver Problemas

1. Verifique se você tem permissões para alterar a estrutura da tabela
2. Verifique se não há transações abertas bloqueando a tabela
3. Verifique os logs do script para ver quais colunas foram removidas
4. Confirme que o Prisma Client foi regenerado: `npm run db:generate`


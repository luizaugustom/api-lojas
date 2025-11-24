# 🔧 Instruções para Registrar Migrations em Produção

## Problema
As migrations foram aplicadas manualmente no banco de dados, mas não estão registradas na tabela `_prisma_migrations` do Prisma. Isso faz com que o Prisma não reconheça que as migrations já foram aplicadas.

## Solução

### Método 1: Usar Script Node.js (Recomendado) ⭐

O método mais fácil é usar o script Node.js que verifica e registra automaticamente:

```bash
cd api-lojas

# Verificar quais migrations estão faltando (modo dry-run)
npm run db:register-migrations:dry

# Registrar as migrations faltantes
npm run db:register-migrations
```

O script irá:
- ✅ Verificar quais migrations já estão registradas
- ✅ Identificar quais estão faltando
- ✅ Registrar automaticamente as migrations faltantes
- ✅ Mostrar um resumo do que foi feito

### Método 2: Usar Script SQL

Se preferir usar SQL diretamente:

#### Passo 1: Verificar quais migrations estão faltando

Execute no banco de dados de produção:

```sql
-- Verificar migrations aplicadas no banco
SELECT "migration_name", "finished_at"
FROM "_prisma_migrations"
ORDER BY "finished_at" DESC
LIMIT 10;
```

#### Passo 2: Registrar as migrations manualmente

Execute o script SQL que registra as migrations recentes:

```bash
psql -h SEU_HOST -U SEU_USUARIO -d SEU_BANCO -f prisma/mark_recent_migrations_as_applied.sql
```

Ou via cliente SQL (pgAdmin, DBeaver, etc.):
1. Conecte-se ao banco de dados de produção
2. Abra o arquivo `prisma/mark_recent_migrations_as_applied.sql`
3. Execute o script completo

### Passo 3: Verificar se foi registrado

Se usou o script Node.js, o próprio script mostra o resultado. Se usou SQL, execute:

```sql
SELECT 
  "migration_name",
  "finished_at",
  "started_at"
FROM "_prisma_migrations"
WHERE "migration_name" IN (
  '20251124190000_remove_original_quantity_from_exchanges',
  '20251124220000_fix_exchanged_quantity_constraint'
)
ORDER BY "finished_at" DESC;
```

### Passo 4: Testar com Prisma Migrate

Após registrar, teste se o Prisma reconhece as migrations:

```bash
cd api-lojas
npm run db:migrate:deploy
```

O comando deve retornar algo como:
```
✅ No pending migrations to apply
```

## Migrations que serão registradas

O script registra as seguintes migrations:
- `20251124190000_remove_original_quantity_from_exchanges`
- `20251124220000_fix_exchanged_quantity_constraint`

## Adicionar mais migrations

Se você precisar registrar outras migrations, edite o arquivo `mark_recent_migrations_as_applied.sql` e adicione o nome da migration no array:

```sql
SELECT unnest(ARRAY[
  '20251124190000_remove_original_quantity_from_exchanges',
  '20251124220000_fix_exchanged_quantity_constraint',
  'NOME_DA_NOVA_MIGRATION'  -- Adicione aqui
])
```

## Alternativa: Usar Prisma Migrate Deploy

Se você tiver acesso ao ambiente de produção e puder executar comandos do Prisma:

```bash
cd api-lojas
npm run db:migrate:deploy
```

**IMPORTANTE**: Se as migrations já foram aplicadas manualmente, você PRECISA registrá-las primeiro usando o script acima, caso contrário o Prisma tentará aplicá-las novamente e pode causar erros.

## Segurança

✅ O script é **idempotente** - pode ser executado múltiplas vezes sem problemas  
✅ Verifica se a migration já está registrada antes de inserir  
✅ Usa transações para garantir atomicidade  
✅ Não modifica dados, apenas registra na tabela de controle do Prisma

## Suporte

Se encontrar algum problema, verifique:
1. Se você tem permissões para inserir na tabela `_prisma_migrations`
2. Se a tabela `_prisma_migrations` existe no banco
3. Se os nomes das migrations estão corretos (case-sensitive)
4. Os logs do script para ver quais migrations foram registradas


# Migration: Adicionar Configuração Focus NFe por Empresa

## 📋 Descrição

Esta migration adiciona os campos de configuração do Focus NFe na tabela `companies`, permitindo que cada empresa tenha sua própria API Key e configurações do Focus NFe.

## 🔧 Campos Adicionados

- `focusNfeApiKey` (TEXT, nullable): API Key do Focus NFe específica da empresa
- `focusNfeEnvironment` (TEXT, nullable, default: 'sandbox'): Ambiente do Focus NFe (sandbox ou production)
- `ibptToken` (TEXT, nullable): Token da API IBPT (opcional)

## ✅ Execução em Produção

### Opção 1: Usando Prisma Migrate Deploy (Recomendado)

```bash
cd api-lojas
npm run db:migrate:deploy
```

Este comando:
- ✅ Aplica apenas as migrations pendentes
- ✅ Não cria novas migrations
- ✅ Seguro para produção
- ✅ Idempotente (pode ser executado múltiplas vezes)

### Opção 2: Execução Manual do SQL

Se preferir executar manualmente:

```bash
# Conectar ao banco de dados PostgreSQL
psql -h seu-host -U seu-usuario -d api_lojas

# Executar o SQL
\i prisma/migrations/20250130000000_add_focus_nfe_to_company/migration.sql
```

### Opção 3: Via Script de Deploy

Se você tem um script de deploy automatizado, adicione:

```bash
# No seu script de deploy
cd api-lojas
npm install
npm run db:generate  # Gerar Prisma Client
npm run db:migrate:deploy  # Aplicar migrations
npm run build  # Build da aplicação
```

## 🔍 Verificação

Após executar a migration, verifique se as colunas foram criadas:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'companies'
  AND column_name IN ('focusNfeApiKey', 'focusNfeEnvironment', 'ibptToken');
```

## ⚠️ Importante

- Esta migration é **idempotente** - pode ser executada múltiplas vezes sem problemas
- As colunas são **opcionais** (nullable) - empresas existentes não serão afetadas
- O valor padrão de `focusNfeEnvironment` é `'sandbox'`
- A migration verifica se as colunas já existem antes de criar, evitando erros

## 🔄 Rollback

Se precisar reverter esta migration (não recomendado em produção):

```sql
ALTER TABLE "companies" DROP COLUMN IF EXISTS "focusNfeApiKey";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "focusNfeEnvironment";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "ibptToken";
```

## 📝 Notas

- Esta migration é compatível com PostgreSQL
- Não há perda de dados - apenas adiciona novas colunas
- Empresas existentes continuarão funcionando normalmente
- O sistema usa fallback para configuração do Admin se a empresa não tiver configurado


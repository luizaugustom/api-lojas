# Guia de Migração UUID v4 - Produção

## ⚠️ IMPORTANTE - LEIA ANTES DE EXECUTAR

Esta migration é **IRREVERSÍVEL** e converte todos os IDs do sistema de CUID para UUID v4.

### Pré-requisitos

1. **Backup Completo**: Faça backup completo do banco de dados
2. **Ambiente de Teste**: Teste primeiro em ambiente de homologação
3. **Downtime**: Planeje uma janela de manutenção
4. **Acesso ao Banco**: Acesso direto ao PostgreSQL com permissões adequadas

## Passos para Execução

### 1. Backup do Banco de Dados

```bash
# PostgreSQL
pg_dump -h localhost -U usuario -d nome_do_banco > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# Ou usando Docker
docker exec postgres_container pg_dump -U usuario nome_do_banco > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Parar a Aplicação

```bash
# Parar o servidor da API
pm2 stop api-lojas

# Ou se estiver usando Docker
docker-compose down api
```

### 3. Executar a Migration

```bash
# Opção 1: Via psql
psql -h localhost -U usuario -d nome_do_banco -f prisma/migrations/production_uuid_migration.sql

# Opção 2: Via Docker
docker exec -i postgres_container psql -U usuario -d nome_do_banco < prisma/migrations/production_uuid_migration.sql
```

### 4. Verificar a Migration

Após a execução, verifique se:

- ✅ Todas as tabelas têm IDs no formato UUID v4
- ✅ Todas as foreign keys estão funcionando
- ✅ Contagem de registros permanece igual

```sql
-- Verificar formato de IDs
SELECT id FROM admins LIMIT 5;
SELECT id FROM companies LIMIT 5;
SELECT id FROM sellers LIMIT 5;

-- Verificar integridade referencial
SELECT 
    tc.table_name, 
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

### 5. Atualizar Prisma Client

```bash
cd api-lojas

# Gerar novo Prisma Client
npm run db:generate

# Reconstruir a aplicação
npm run build
```

### 6. Reiniciar a Aplicação

```bash
# Via PM2
pm2 start api-lojas

# Ou via Docker
docker-compose up -d api

# Verificar logs
pm2 logs api-lojas
# ou
docker-compose logs -f api
```

### 7. Testes Pós-Migration

Execute os testes para garantir que tudo funciona:

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Teste manual das principais funcionalidades
# - Login de admin/empresa/vendedor
# - Criação de produto
# - Criação de venda
# - Emissão de nota fiscal
```

## Rollback (em caso de problemas)

Se algo der errado:

1. **Pare a aplicação imediatamente**
2. **Restaure o backup**:

```bash
# PostgreSQL
psql -h localhost -U usuario -d nome_do_banco < backup_pre_migration_TIMESTAMP.sql

# Docker
docker exec -i postgres_container psql -U usuario -d nome_do_banco < backup_pre_migration_TIMESTAMP.sql
```

3. **Reverta o código** para a versão anterior (antes da migration)
4. **Reinicie a aplicação**

## Verificação de Integridade

Após a migration bem-sucedida, execute estas queries para garantir integridade:

```sql
-- 1. Verificar que todos os IDs são UUID v4 válidos
SELECT 
    'admins' as tabela,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$') as uuid_v4_validos
FROM admins
UNION ALL
SELECT 'companies', COUNT(*), COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$') FROM companies
UNION ALL
SELECT 'sellers', COUNT(*), COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$') FROM sellers;

-- 2. Verificar orphaned records (foreign keys quebradas)
SELECT s.id, s."companyId"
FROM sellers s
LEFT JOIN companies c ON s."companyId" = c.id
WHERE c.id IS NULL;

SELECT p.id, p."companyId"
FROM products p
LEFT JOIN companies c ON p."companyId" = c.id
WHERE c.id IS NULL;

SELECT s.id, s."sellerId", s."companyId"
FROM sales s
LEFT JOIN sellers se ON s."sellerId" = se.id
LEFT JOIN companies c ON s."companyId" = c.id
WHERE se.id IS NULL OR c.id IS NULL;
```

## Troubleshooting

### Erro: "relation does not exist"

- Verifique se o banco de dados correto está sendo usado
- Confirme que as tabelas existem antes da migration

### Erro: "cannot drop column ... because other objects depend on it"

- A migration já trata das dependências
- Se persistir, execute manualmente o DROP CONSTRAINT para cada foreign key

### Erro: "out of memory"

- A migration processa muitos dados
- Aumente a memória disponível para o PostgreSQL
- Execute a migration em partes menores (por tabela)

### Dados corrompidos após migration

- Restaure o backup imediatamente
- Revise o script de migration
- Entre em contato com o suporte técnico

## Contato e Suporte

Em caso de problemas durante a migration:

1. **Não execute mais comandos** sem orientação
2. **Preserve o backup** e os logs de erro
3. **Documente** exatamente qual passo falhou
4. Entre em contato com a equipe de desenvolvimento

## Checklist Final

Antes de considerar a migration completa:

- [ ] Backup verificado e restaurável
- [ ] Migration executada sem erros
- [ ] Todos os IDs são UUID v4 válidos
- [ ] Nenhum orphaned record encontrado
- [ ] Foreign keys funcionando
- [ ] Aplicação iniciada com sucesso
- [ ] Login funcionando para todos os tipos de usuário
- [ ] CRUD de produtos funcionando
- [ ] CRUD de vendas funcionando
- [ ] Emissão de notas fiscais funcionando
- [ ] Frontend conectado e funcionando
- [ ] Performance dentro do esperado

## Performance

Tempo estimado de execução (depende do volume de dados):

- Menos de 1.000 registros: ~1-2 minutos
- 1.000 - 10.000 registros: ~5-10 minutos
- 10.000 - 100.000 registros: ~15-30 minutos
- Mais de 100.000 registros: ~1-2 horas

**Nota**: Durante a migration, o banco ficará em modo de manutenção e a aplicação deve estar parada.


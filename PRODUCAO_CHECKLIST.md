# ✅ Checklist Completo para Produção - UUID v4

## 📋 Pré-Deployment

### Backend (API NestJS)

- [ ] **Ambiente**
  - [ ] Variáveis de ambiente configuradas (`env.uuid.example` como referência)
  - [ ] Secrets e senhas alterados para produção
  - [ ] DATABASE_URL apontando para banco de produção
  - [ ] JWT_SECRET forte e único
  - [ ] CORS_ORIGIN configurado corretamente
  
- [ ] **Banco de Dados**
  - [ ] Backup completo realizado
  - [ ] Extensão `uuid-ossp` habilitada no PostgreSQL
  - [ ] Migration SQL testada em homologação
  - [ ] Verificação de relacionamentos executada
  - [ ] Índices otimizados criados
  
- [ ] **Código**
  - [ ] Schema Prisma usando `@default(uuid())`
  - [ ] Todos controllers com `UuidValidationPipe`
  - [ ] DTOs com `@IsUUID()` onde necessário
  - [ ] Testes unitários passando
  - [ ] Testes E2E passando
  - [ ] Build sem erros
  - [ ] Linter sem warnings críticos

### Frontend (Next.js)

- [ ] **Ambiente**
  - [ ] `NEXT_PUBLIC_API_URL` configurado
  - [ ] Debug mode desativado em produção
  - [ ] Secrets não expostos em variáveis NEXT_PUBLIC_*
  
- [ ] **Código**
  - [ ] Validador UUID integrado
  - [ ] Interceptor axios configurado
  - [ ] Tipos TypeScript corretos
  - [ ] Build production sem erros
  - [ ] Testes passando
  - [ ] Performance otimizada

## 🚀 Deployment

### 1. Parar Aplicações

```bash
# Backend
pm2 stop api-lojas
# ou
docker-compose down api

# Frontend
pm2 stop front-lojas
# ou
docker-compose down frontend
```

### 2. Backup do Banco

```bash
# PostgreSQL
pg_dump -h localhost -U usuario -d database > backup_production_$(date +%Y%m%d_%H%M%S).sql

# Docker
docker exec postgres_container pg_dump -U usuario database > backup_production_$(date +%Y%m%d_%H%M%S).sql
```

### 3. Executar Migration

```bash
cd api-lojas
psql -h localhost -U usuario -d database -f prisma/migrations/production_uuid_migration.sql
```

### 4. Atualizar Backend

```bash
cd api-lojas

# Instalar dependências
npm ci --only=production

# Gerar Prisma Client
npm run db:generate

# Build
npm run build

# Verificar build
ls -la dist/
```

### 5. Atualizar Frontend

```bash
cd front-lojas

# Instalar dependências
npm ci --only=production

# Build
npm run build

# Verificar build
ls -la .next/
```

### 6. Verificar Integridade do Banco

```bash
cd api-lojas
psql -h localhost -U usuario -d database -f scripts/verify-database-relationships.sql
```

### 7. Iniciar Aplicações

```bash
# Backend
pm2 start api-lojas
pm2 save

# Frontend
pm2 start front-lojas
pm2 save

# Verificar status
pm2 status
pm2 logs
```

## 🧪 Testes Pós-Deployment

### Testes Manuais Críticos

- [ ] **Autenticação**
  - [ ] Login como Admin
  - [ ] Login como Empresa
  - [ ] Login como Vendedor
  - [ ] Logout funciona corretamente
  - [ ] Refresh token funcionando

- [ ] **Produtos**
  - [ ] Listar produtos
  - [ ] Criar novo produto
  - [ ] Buscar produto por ID (UUID)
  - [ ] Buscar produto por código de barras
  - [ ] Atualizar produto
  - [ ] Upload de fotos
  - [ ] Deletar produto (se permitido)

- [ ] **Vendas**
  - [ ] Criar venda simples
  - [ ] Criar venda com múltiplos itens
  - [ ] Criar venda com múltiplos métodos de pagamento
  - [ ] Criar venda a prazo
  - [ ] Buscar venda por ID (UUID)
  - [ ] Listar vendas
  - [ ] Reimprimir cupom

- [ ] **Clientes**
  - [ ] Criar cliente
  - [ ] Buscar cliente por ID (UUID)
  - [ ] Buscar cliente por CPF/CNPJ
  - [ ] Atualizar cliente
  - [ ] Listar clientes

- [ ] **Vendedores**
  - [ ] Criar vendedor
  - [ ] Listar vendedores
  - [ ] Buscar estatísticas de vendedor
  - [ ] Atualizar perfil de vendedor

- [ ] **Contas a Pagar**
  - [ ] Criar conta a pagar
  - [ ] Listar contas
  - [ ] Marcar como paga
  - [ ] Ver contas vencidas

- [ ] **Fechamento de Caixa**
  - [ ] Abrir caixa
  - [ ] Ver caixa atual
  - [ ] Fechar caixa

- [ ] **Notas Fiscais**
  - [ ] Emitir NFCe
  - [ ] Consultar documento fiscal
  - [ ] Cancelar documento (se permitido)

- [ ] **Relatórios**
  - [ ] Gerar relatório de vendas (JSON)
  - [ ] Gerar relatório de vendas (Excel)
  - [ ] Gerar relatório completo

### Testes Automatizados

```bash
# Backend
cd api-lojas
npm run test
npm run test:e2e

# Frontend
cd front-lojas
npm run test
```

### Testes de Performance

- [ ] Tempo de resposta < 200ms para endpoints simples
- [ ] Tempo de resposta < 1s para endpoints complexos
- [ ] Frontend carrega em < 3s
- [ ] Sem memory leaks (monitorar por 1 hora)
- [ ] Banco de dados performando bem (verificar slow queries)

### Testes de Segurança

- [ ] Tentativa de SQL injection bloqueada
- [ ] UUID inválido retorna erro apropriado
- [ ] Token expirado redireciona para login
- [ ] Permissões de role funcionando
- [ ] CORS configurado corretamente
- [ ] Rate limiting funcionando

## 📊 Monitoramento

### Métricas para Acompanhar (primeiras 24h)

- [ ] **Backend**
  - [ ] CPU usage < 70%
  - [ ] Memory usage < 80%
  - [ ] Response time médio
  - [ ] Error rate < 1%
  - [ ] Requests per second

- [ ] **Frontend**
  - [ ] Load time
  - [ ] JavaScript errors
  - [ ] API call errors
  - [ ] User sessions

- [ ] **Banco de Dados**
  - [ ] Connection pool usage
  - [ ] Slow queries (> 1s)
  - [ ] Disk usage
  - [ ] Backup status

### Logs para Monitorar

```bash
# Backend logs
pm2 logs api-lojas --lines 100

# Frontend logs
pm2 logs front-lojas --lines 100

# Banco de dados
tail -f /var/log/postgresql/postgresql.log

# Nginx (se aplicável)
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 🔥 Rollback Plan

Se algo der errado:

### 1. Identificar o Problema

- Verificar logs de erro
- Identificar qual componente está falhando
- Documentar o erro exato

### 2. Decisão de Rollback

Se o problema for crítico:

```bash
# 1. Parar aplicações
pm2 stop all

# 2. Restaurar banco de dados
psql -h localhost -U usuario -d database < backup_production_TIMESTAMP.sql

# 3. Reverter código
git checkout <hash-commit-anterior>

# 4. Rebuild
cd api-lojas && npm run build
cd ../front-lojas && npm run build

# 5. Reiniciar
pm2 restart all
```

### 3. Comunicação

- [ ] Notificar equipe sobre rollback
- [ ] Documentar causa do rollback
- [ ] Planejar correção para próximo deploy

## 📝 Documentação Pós-Deploy

- [ ] Atualizar CHANGELOG.md
- [ ] Documentar quaisquer issues encontrados
- [ ] Atualizar documentação de API se necessário
- [ ] Registrar métricas de performance
- [ ] Criar relatório de deploy

## 🎯 Critérios de Sucesso

Deploy é considerado bem-sucedido quando:

- [ ] ✅ Todos os testes manuais passando
- [ ] ✅ Nenhum erro crítico nos logs (primeiras 2 horas)
- [ ] ✅ Performance dentro do esperado
- [ ] ✅ Nenhum orphaned record no banco
- [ ] ✅ Todos os UUIDs são v4 válidos
- [ ] ✅ Foreign keys íntegros
- [ ] ✅ Usuários conseguem usar sistema normalmente
- [ ] ✅ Monitoramento estável por 24h

## 📞 Contatos de Emergência

Em caso de problemas críticos:

1. **Database Admin:** [contato]
2. **DevOps:** [contato]
3. **Backend Lead:** [contato]
4. **Frontend Lead:** [contato]

## 📚 Referências Rápidas

- `MIGRACAO_UUID_GUIA.md` - Guia detalhado de migration
- `INTEGRACAO_COMPLETA.md` - Documentação de integração
- `api-lojas/PRODUCAO_CHECKLIST.md` - Este documento
- `api-lojas/scripts/validate-uuid-integration.js` - Script de validação
- `api-lojas/scripts/verify-database-relationships.sql` - Verificação de BD

---

**Última Atualização:** Outubro 2025  
**Versão:** 1.0.0  
**Status:** ✅ Production Ready


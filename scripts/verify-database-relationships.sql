-- Script de Verificação de Relacionamentos UUID v4
-- Execute este script após a migration para garantir integridade

-- =====================================================
-- 1. Verificar Formato dos UUIDs
-- =====================================================

\echo '============================================================'
\echo '1. VERIFICANDO FORMATO DE UUIDs'
\echo '============================================================'

-- Verificar admins
SELECT 
    'admins' as tabela,
    COUNT(*) as total_registros,
    COUNT(*) FILTER (
        WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ) as uuid_v4_validos,
    COUNT(*) - COUNT(*) FILTER (
        WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ) as uuid_invalidos
FROM admins
UNION ALL
SELECT 
    'companies',
    COUNT(*),
    COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
    COUNT(*) - COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
FROM companies
UNION ALL
SELECT 
    'sellers',
    COUNT(*),
    COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
    COUNT(*) - COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
FROM sellers
UNION ALL
SELECT 
    'products',
    COUNT(*),
    COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
    COUNT(*) - COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
FROM products
UNION ALL
SELECT 
    'customers',
    COUNT(*),
    COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
    COUNT(*) - COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
FROM customers
UNION ALL
SELECT 
    'sales',
    COUNT(*),
    COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
    COUNT(*) - COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
FROM sales
UNION ALL
SELECT 
    'sale_items',
    COUNT(*),
    COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
    COUNT(*) - COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
FROM sale_items
UNION ALL
SELECT 
    'bills_to_pay',
    COUNT(*),
    COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
    COUNT(*) - COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
FROM bills_to_pay
UNION ALL
SELECT 
    'cash_closures',
    COUNT(*),
    COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
    COUNT(*) - COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
FROM cash_closures
UNION ALL
SELECT 
    'fiscal_documents',
    COUNT(*),
    COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
    COUNT(*) - COUNT(*) FILTER (WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
FROM fiscal_documents
ORDER BY tabela;

-- =====================================================
-- 2. Verificar Foreign Keys
-- =====================================================

\echo ''
\echo '============================================================'
\echo '2. VERIFICANDO FOREIGN KEYS'
\echo '============================================================'

SELECT 
    tc.table_name AS tabela, 
    tc.constraint_name AS constraint,
    kcu.column_name AS coluna,
    ccu.table_name AS tabela_referenciada,
    ccu.column_name AS coluna_referenciada
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- 3. Verificar Orphaned Records (Foreign Keys Quebradas)
-- =====================================================

\echo ''
\echo '============================================================'
\echo '3. VERIFICANDO ORPHANED RECORDS'
\echo '============================================================'

-- Companies sem Admin
SELECT 
    'Companies sem Admin' as tipo,
    COUNT(*) as total
FROM companies c
LEFT JOIN admins a ON c."adminId" = a.id
WHERE a.id IS NULL;

-- Sellers sem Company
SELECT 
    'Sellers sem Company' as tipo,
    COUNT(*) as total
FROM sellers s
LEFT JOIN companies c ON s."companyId" = c.id
WHERE c.id IS NULL;

-- Products sem Company
SELECT 
    'Products sem Company' as tipo,
    COUNT(*) as total
FROM products p
LEFT JOIN companies c ON p."companyId" = c.id
WHERE c.id IS NULL;

-- Sales sem Company
SELECT 
    'Sales sem Company' as tipo,
    COUNT(*) as total
FROM sales s
LEFT JOIN companies c ON s."companyId" = c.id
WHERE c.id IS NULL;

-- Sales sem Seller
SELECT 
    'Sales sem Seller' as tipo,
    COUNT(*) as total
FROM sales s
LEFT JOIN sellers se ON s."sellerId" = se.id
WHERE se.id IS NULL;

-- SaleItems sem Sale
SELECT 
    'SaleItems sem Sale' as tipo,
    COUNT(*) as total
FROM sale_items si
LEFT JOIN sales s ON si."saleId" = s.id
WHERE s.id IS NULL;

-- SaleItems sem Product
SELECT 
    'SaleItems sem Product' as tipo,
    COUNT(*) as total
FROM sale_items si
LEFT JOIN products p ON si."productId" = p.id
WHERE p.id IS NULL;

-- =====================================================
-- 4. Verificar Defaults dos IDs
-- =====================================================

\echo ''
\echo '============================================================'
\echo '4. VERIFICANDO DEFAULTS DE IDs'
\echo '============================================================'

SELECT 
    table_name,
    column_name,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'id'
ORDER BY table_name;

-- =====================================================
-- 5. Verificar Constraints PRIMARY KEY
-- =====================================================

\echo ''
\echo '============================================================'
\echo '5. VERIFICANDO PRIMARY KEYS'
\echo '============================================================'

SELECT 
    tc.table_name AS tabela,
    tc.constraint_name AS constraint,
    kcu.column_name AS coluna
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =====================================================
-- 6. Verificar Integridade Geral
-- =====================================================

\echo ''
\echo '============================================================'
\echo '6. RESUMO DE INTEGRIDADE'
\echo '============================================================'

SELECT 
    'Total de Tabelas' as metrica,
    COUNT(DISTINCT table_name) as valor
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'Total de Foreign Keys',
    COUNT(*)
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_schema = 'public'
UNION ALL
SELECT 
    'Total de Primary Keys',
    COUNT(*)
FROM information_schema.table_constraints
WHERE constraint_type = 'PRIMARY KEY'
AND table_schema = 'public'
UNION ALL
SELECT 
    'Admins',
    COUNT(*)
FROM admins
UNION ALL
SELECT 
    'Companies',
    COUNT(*)
FROM companies
UNION ALL
SELECT 
    'Sellers',
    COUNT(*)
FROM sellers
UNION ALL
SELECT 
    'Products',
    COUNT(*)
FROM products
UNION ALL
SELECT 
    'Sales',
    COUNT(*)
FROM sales
UNION ALL
SELECT 
    'Customers',
    COUNT(*)
FROM customers;

\echo ''
\echo '============================================================'
\echo 'VERIFICAÇÃO CONCLUÍDA!'
\echo '============================================================'
\echo ''
\echo 'Se todos os UUIDs são válidos e não há orphaned records,'
\echo 'a integração está 100% funcional!'
\echo ''





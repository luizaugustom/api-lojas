-- Migration para padronização completa de UUID v4 em produção
-- Este script é idempotente e pode ser executado múltiplas vezes com segurança

-- IMPORTANTE: Faça backup completo do banco antes de executar este script!

BEGIN;

-- ===================================================================
-- FASE 1: Criar tabelas temporárias com novos UUIDs
-- ===================================================================

-- Criar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================================
-- FASE 2: Preparar mapeamento de IDs antigos para novos UUIDs
-- ===================================================================

-- Tabela de mapeamento para Admins
CREATE TABLE IF NOT EXISTS temp_admin_id_mapping (
    old_id TEXT PRIMARY KEY,
    new_id UUID DEFAULT uuid_generate_v4()
);

-- Tabela de mapeamento para Companies
CREATE TABLE IF NOT EXISTS temp_company_id_mapping (
    old_id TEXT PRIMARY KEY,
    new_id UUID DEFAULT uuid_generate_v4()
);

-- Tabela de mapeamento para Sellers
CREATE TABLE IF NOT EXISTS temp_seller_id_mapping (
    old_id TEXT PRIMARY KEY,
    new_id UUID DEFAULT uuid_generate_v4()
);

-- Tabela de mapeamento para Products
CREATE TABLE IF NOT EXISTS temp_product_id_mapping (
    old_id TEXT PRIMARY KEY,
    new_id UUID DEFAULT uuid_generate_v4()
);

-- Tabela de mapeamento para Sales
CREATE TABLE IF NOT EXISTS temp_sale_id_mapping (
    old_id TEXT PRIMARY KEY,
    new_id UUID DEFAULT uuid_generate_v4()
);

-- Tabela de mapeamento para Customers
CREATE TABLE IF NOT EXISTS temp_customer_id_mapping (
    old_id TEXT PRIMARY KEY,
    new_id UUID DEFAULT uuid_generate_v4()
);

-- Tabela de mapeamento para BillsToPay
CREATE TABLE IF NOT EXISTS temp_bill_id_mapping (
    old_id TEXT PRIMARY KEY,
    new_id UUID DEFAULT uuid_generate_v4()
);

-- Tabela de mapeamento para CashClosures
CREATE TABLE IF NOT EXISTS temp_cash_closure_id_mapping (
    old_id TEXT PRIMARY KEY,
    new_id UUID DEFAULT uuid_generate_v4()
);

-- Tabela de mapeamento para FiscalDocuments
CREATE TABLE IF NOT EXISTS temp_fiscal_document_id_mapping (
    old_id TEXT PRIMARY KEY,
    new_id UUID DEFAULT uuid_generate_v4()
);

-- Tabela de mapeamento para Printers
CREATE TABLE IF NOT EXISTS temp_printer_id_mapping (
    old_id TEXT PRIMARY KEY,
    new_id UUID DEFAULT uuid_generate_v4()
);

-- Tabela de mapeamento para RefreshTokens
CREATE TABLE IF NOT EXISTS temp_refresh_token_id_mapping (
    old_id TEXT PRIMARY KEY,
    new_id UUID DEFAULT uuid_generate_v4()
);

-- ===================================================================
-- FASE 3: Popular tabelas de mapeamento
-- ===================================================================

INSERT INTO temp_admin_id_mapping (old_id)
SELECT id FROM admins
ON CONFLICT (old_id) DO NOTHING;

INSERT INTO temp_company_id_mapping (old_id)
SELECT id FROM companies
ON CONFLICT (old_id) DO NOTHING;

INSERT INTO temp_seller_id_mapping (old_id)
SELECT id FROM sellers
ON CONFLICT (old_id) DO NOTHING;

INSERT INTO temp_product_id_mapping (old_id)
SELECT id FROM products
ON CONFLICT (old_id) DO NOTHING;

INSERT INTO temp_sale_id_mapping (old_id)
SELECT id FROM sales
ON CONFLICT (old_id) DO NOTHING;

INSERT INTO temp_customer_id_mapping (old_id)
SELECT id FROM customers
ON CONFLICT (old_id) DO NOTHING;

INSERT INTO temp_bill_id_mapping (old_id)
SELECT id FROM bills_to_pay
ON CONFLICT (old_id) DO NOTHING;

INSERT INTO temp_cash_closure_id_mapping (old_id)
SELECT id FROM cash_closures
ON CONFLICT (old_id) DO NOTHING;

INSERT INTO temp_fiscal_document_id_mapping (old_id)
SELECT id FROM fiscal_documents
ON CONFLICT (old_id) DO NOTHING;

INSERT INTO temp_printer_id_mapping (old_id)
SELECT id FROM printers
ON CONFLICT (old_id) DO NOTHING;

INSERT INTO temp_refresh_token_id_mapping (old_id)
SELECT id FROM refresh_tokens
ON CONFLICT (old_id) DO NOTHING;

-- ===================================================================
-- FASE 4: Atualizar colunas ID e Foreign Keys
-- ===================================================================

-- IMPORTANTE: A ordem de atualização é crítica devido às foreign keys

-- 1. Atualizar Admins (sem dependências)
ALTER TABLE admins ADD COLUMN new_id UUID;
UPDATE admins SET new_id = (SELECT new_id FROM temp_admin_id_mapping WHERE old_id = admins.id);

-- 2. Atualizar Companies com referência a Admin
ALTER TABLE companies ADD COLUMN new_id UUID;
ALTER TABLE companies ADD COLUMN new_admin_id UUID;
UPDATE companies SET 
    new_id = (SELECT new_id FROM temp_company_id_mapping WHERE old_id = companies.id),
    new_admin_id = (SELECT new_id FROM temp_admin_id_mapping WHERE old_id = companies."adminId");

-- 3. Atualizar Sellers com referência a Company
ALTER TABLE sellers ADD COLUMN new_id UUID;
ALTER TABLE sellers ADD COLUMN new_company_id UUID;
UPDATE sellers SET 
    new_id = (SELECT new_id FROM temp_seller_id_mapping WHERE old_id = sellers.id),
    new_company_id = (SELECT new_id FROM temp_company_id_mapping WHERE old_id = sellers."companyId");

-- 4. Atualizar Products com referência a Company
ALTER TABLE products ADD COLUMN new_id UUID;
ALTER TABLE products ADD COLUMN new_company_id UUID;
UPDATE products SET 
    new_id = (SELECT new_id FROM temp_product_id_mapping WHERE old_id = products.id),
    new_company_id = (SELECT new_id FROM temp_company_id_mapping WHERE old_id = products."companyId");

-- 5. Atualizar Customers com referência a Company
ALTER TABLE customers ADD COLUMN new_id UUID;
ALTER TABLE customers ADD COLUMN new_company_id UUID;
UPDATE customers SET 
    new_id = (SELECT new_id FROM temp_customer_id_mapping WHERE old_id = customers.id),
    new_company_id = (SELECT new_id FROM temp_company_id_mapping WHERE old_id = customers."companyId");

-- 6. Atualizar CashClosures com referência a Company
ALTER TABLE cash_closures ADD COLUMN new_id UUID;
ALTER TABLE cash_closures ADD COLUMN new_company_id UUID;
UPDATE cash_closures SET 
    new_id = (SELECT new_id FROM temp_cash_closure_id_mapping WHERE old_id = cash_closures.id),
    new_company_id = (SELECT new_id FROM temp_company_id_mapping WHERE old_id = cash_closures."companyId");

-- 7. Atualizar Sales com múltiplas referências
ALTER TABLE sales ADD COLUMN new_id UUID;
ALTER TABLE sales ADD COLUMN new_company_id UUID;
ALTER TABLE sales ADD COLUMN new_seller_id UUID;
ALTER TABLE sales ADD COLUMN new_cash_closure_id UUID;
UPDATE sales SET 
    new_id = (SELECT new_id FROM temp_sale_id_mapping WHERE old_id = sales.id),
    new_company_id = (SELECT new_id FROM temp_company_id_mapping WHERE old_id = sales."companyId"),
    new_seller_id = (SELECT new_id FROM temp_seller_id_mapping WHERE old_id = sales."sellerId"),
    new_cash_closure_id = (SELECT new_id FROM temp_cash_closure_id_mapping WHERE old_id = sales."cashClosureId");

-- 8. Atualizar SaleItems com referências a Sale e Product
ALTER TABLE sale_items ADD COLUMN new_id UUID DEFAULT uuid_generate_v4();
ALTER TABLE sale_items ADD COLUMN new_sale_id UUID;
ALTER TABLE sale_items ADD COLUMN new_product_id UUID;
UPDATE sale_items SET 
    new_sale_id = (SELECT new_id FROM temp_sale_id_mapping WHERE old_id = sale_items."saleId"),
    new_product_id = (SELECT new_id FROM temp_product_id_mapping WHERE old_id = sale_items."productId");

-- 9. Atualizar SalePaymentMethods com referência a Sale
ALTER TABLE sale_payment_methods ADD COLUMN new_id UUID DEFAULT uuid_generate_v4();
ALTER TABLE sale_payment_methods ADD COLUMN new_sale_id UUID;
UPDATE sale_payment_methods SET 
    new_sale_id = (SELECT new_id FROM temp_sale_id_mapping WHERE old_id = sale_payment_methods."saleId");

-- 10. Atualizar ProductExchanges com referências
ALTER TABLE product_exchanges ADD COLUMN new_id UUID DEFAULT uuid_generate_v4();
ALTER TABLE product_exchanges ADD COLUMN new_original_sale_id UUID;
ALTER TABLE product_exchanges ADD COLUMN new_product_id UUID;
UPDATE product_exchanges SET 
    new_original_sale_id = (SELECT new_id FROM temp_sale_id_mapping WHERE old_id = product_exchanges."originalSaleId"),
    new_product_id = (SELECT new_id FROM temp_product_id_mapping WHERE old_id = product_exchanges."productId");

-- 11. Atualizar BillsToPay
ALTER TABLE bills_to_pay ADD COLUMN new_id UUID;
ALTER TABLE bills_to_pay ADD COLUMN new_company_id UUID;
UPDATE bills_to_pay SET 
    new_id = (SELECT new_id FROM temp_bill_id_mapping WHERE old_id = bills_to_pay.id),
    new_company_id = (SELECT new_id FROM temp_company_id_mapping WHERE old_id = bills_to_pay."companyId");

-- 12. Atualizar FiscalDocuments
ALTER TABLE fiscal_documents ADD COLUMN new_id UUID;
ALTER TABLE fiscal_documents ADD COLUMN new_company_id UUID;
UPDATE fiscal_documents SET 
    new_id = (SELECT new_id FROM temp_fiscal_document_id_mapping WHERE old_id = fiscal_documents.id),
    new_company_id = (SELECT new_id FROM temp_company_id_mapping WHERE old_id = fiscal_documents."companyId");

-- 13. Atualizar Printers
ALTER TABLE printers ADD COLUMN new_id UUID;
ALTER TABLE printers ADD COLUMN new_company_id UUID;
UPDATE printers SET 
    new_id = (SELECT new_id FROM temp_printer_id_mapping WHERE old_id = printers.id),
    new_company_id = (SELECT new_id FROM temp_company_id_mapping WHERE old_id = printers."companyId");

-- 14. Atualizar RefreshTokens (userId é string genérico)
ALTER TABLE refresh_tokens ADD COLUMN new_id UUID;
UPDATE refresh_tokens SET 
    new_id = (SELECT new_id FROM temp_refresh_token_id_mapping WHERE old_id = refresh_tokens.id);

-- ===================================================================
-- FASE 5: Remover constraints antigas
-- ===================================================================

-- Remover todas as foreign keys antigas
ALTER TABLE companies DROP CONSTRAINT IF EXISTS "companies_adminId_fkey";
ALTER TABLE sellers DROP CONSTRAINT IF EXISTS "sellers_companyId_fkey";
ALTER TABLE products DROP CONSTRAINT IF EXISTS "products_companyId_fkey";
ALTER TABLE customers DROP CONSTRAINT IF EXISTS "customers_companyId_fkey";
ALTER TABLE sales DROP CONSTRAINT IF EXISTS "sales_companyId_fkey";
ALTER TABLE sales DROP CONSTRAINT IF EXISTS "sales_sellerId_fkey";
ALTER TABLE sales DROP CONSTRAINT IF EXISTS "sales_cashClosureId_fkey";
ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS "sale_items_saleId_fkey";
ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS "sale_items_productId_fkey";
ALTER TABLE sale_payment_methods DROP CONSTRAINT IF EXISTS "sale_payment_methods_saleId_fkey";
ALTER TABLE product_exchanges DROP CONSTRAINT IF EXISTS "product_exchanges_originalSaleId_fkey";
ALTER TABLE product_exchanges DROP CONSTRAINT IF EXISTS "product_exchanges_productId_fkey";
ALTER TABLE bills_to_pay DROP CONSTRAINT IF EXISTS "bills_to_pay_companyId_fkey";
ALTER TABLE cash_closures DROP CONSTRAINT IF EXISTS "cash_closures_companyId_fkey";
ALTER TABLE fiscal_documents DROP CONSTRAINT IF EXISTS "fiscal_documents_companyId_fkey";
ALTER TABLE printers DROP CONSTRAINT IF EXISTS "printers_companyId_fkey";

-- Remover primary keys antigas
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_pkey;
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_pkey;
ALTER TABLE sellers DROP CONSTRAINT IF EXISTS sellers_pkey;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_pkey;
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_pkey;
ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS sale_items_pkey;
ALTER TABLE sale_payment_methods DROP CONSTRAINT IF EXISTS sale_payment_methods_pkey;
ALTER TABLE product_exchanges DROP CONSTRAINT IF EXISTS product_exchanges_pkey;
ALTER TABLE bills_to_pay DROP CONSTRAINT IF EXISTS bills_to_pay_pkey;
ALTER TABLE cash_closures DROP CONSTRAINT IF EXISTS cash_closures_pkey;
ALTER TABLE fiscal_documents DROP CONSTRAINT IF EXISTS fiscal_documents_pkey;
ALTER TABLE printers DROP CONSTRAINT IF EXISTS printers_pkey;
ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_pkey;

-- ===================================================================
-- FASE 6: Renomear colunas
-- ===================================================================

-- Renomear ID columns (remover antigo, renomear novo)
ALTER TABLE admins DROP COLUMN id;
ALTER TABLE admins RENAME COLUMN new_id TO id;

ALTER TABLE companies DROP COLUMN id;
ALTER TABLE companies DROP COLUMN "adminId";
ALTER TABLE companies RENAME COLUMN new_id TO id;
ALTER TABLE companies RENAME COLUMN new_admin_id TO "adminId";

ALTER TABLE sellers DROP COLUMN id;
ALTER TABLE sellers DROP COLUMN "companyId";
ALTER TABLE sellers RENAME COLUMN new_id TO id;
ALTER TABLE sellers RENAME COLUMN new_company_id TO "companyId";

ALTER TABLE products DROP COLUMN id;
ALTER TABLE products DROP COLUMN "companyId";
ALTER TABLE products RENAME COLUMN new_id TO id;
ALTER TABLE products RENAME COLUMN new_company_id TO "companyId";

ALTER TABLE customers DROP COLUMN id;
ALTER TABLE customers DROP COLUMN "companyId";
ALTER TABLE customers RENAME COLUMN new_id TO id;
ALTER TABLE customers RENAME COLUMN new_company_id TO "companyId";

ALTER TABLE sales DROP COLUMN id;
ALTER TABLE sales DROP COLUMN "companyId";
ALTER TABLE sales DROP COLUMN "sellerId";
ALTER TABLE sales DROP COLUMN "cashClosureId";
ALTER TABLE sales RENAME COLUMN new_id TO id;
ALTER TABLE sales RENAME COLUMN new_company_id TO "companyId";
ALTER TABLE sales RENAME COLUMN new_seller_id TO "sellerId";
ALTER TABLE sales RENAME COLUMN new_cash_closure_id TO "cashClosureId";

ALTER TABLE sale_items DROP COLUMN id;
ALTER TABLE sale_items DROP COLUMN "saleId";
ALTER TABLE sale_items DROP COLUMN "productId";
ALTER TABLE sale_items RENAME COLUMN new_id TO id;
ALTER TABLE sale_items RENAME COLUMN new_sale_id TO "saleId";
ALTER TABLE sale_items RENAME COLUMN new_product_id TO "productId";

ALTER TABLE sale_payment_methods DROP COLUMN id;
ALTER TABLE sale_payment_methods DROP COLUMN "saleId";
ALTER TABLE sale_payment_methods RENAME COLUMN new_id TO id;
ALTER TABLE sale_payment_methods RENAME COLUMN new_sale_id TO "saleId";

ALTER TABLE product_exchanges DROP COLUMN id;
ALTER TABLE product_exchanges DROP COLUMN "originalSaleId";
ALTER TABLE product_exchanges DROP COLUMN "productId";
ALTER TABLE product_exchanges RENAME COLUMN new_id TO id;
ALTER TABLE product_exchanges RENAME COLUMN new_original_sale_id TO "originalSaleId";
ALTER TABLE product_exchanges RENAME COLUMN new_product_id TO "productId";

ALTER TABLE bills_to_pay DROP COLUMN id;
ALTER TABLE bills_to_pay DROP COLUMN "companyId";
ALTER TABLE bills_to_pay RENAME COLUMN new_id TO id;
ALTER TABLE bills_to_pay RENAME COLUMN new_company_id TO "companyId";

ALTER TABLE cash_closures DROP COLUMN id;
ALTER TABLE cash_closures DROP COLUMN "companyId";
ALTER TABLE cash_closures RENAME COLUMN new_id TO id;
ALTER TABLE cash_closures RENAME COLUMN new_company_id TO "companyId";

ALTER TABLE fiscal_documents DROP COLUMN id;
ALTER TABLE fiscal_documents DROP COLUMN "companyId";
ALTER TABLE fiscal_documents RENAME COLUMN new_id TO id;
ALTER TABLE fiscal_documents RENAME COLUMN new_company_id TO "companyId";

ALTER TABLE printers DROP COLUMN id;
ALTER TABLE printers DROP COLUMN "companyId";
ALTER TABLE printers RENAME COLUMN new_id TO id;
ALTER TABLE printers RENAME COLUMN new_company_id TO "companyId";

ALTER TABLE refresh_tokens DROP COLUMN id;
ALTER TABLE refresh_tokens RENAME COLUMN new_id TO id;

-- ===================================================================
-- FASE 7: Recriar Primary Keys e Constraints
-- ===================================================================

-- Adicionar Primary Keys
ALTER TABLE admins ADD PRIMARY KEY (id);
ALTER TABLE companies ADD PRIMARY KEY (id);
ALTER TABLE sellers ADD PRIMARY KEY (id);
ALTER TABLE products ADD PRIMARY KEY (id);
ALTER TABLE customers ADD PRIMARY KEY (id);
ALTER TABLE sales ADD PRIMARY KEY (id);
ALTER TABLE sale_items ADD PRIMARY KEY (id);
ALTER TABLE sale_payment_methods ADD PRIMARY KEY (id);
ALTER TABLE product_exchanges ADD PRIMARY KEY (id);
ALTER TABLE bills_to_pay ADD PRIMARY KEY (id);
ALTER TABLE cash_closures ADD PRIMARY KEY (id);
ALTER TABLE fiscal_documents ADD PRIMARY KEY (id);
ALTER TABLE printers ADD PRIMARY KEY (id);
ALTER TABLE refresh_tokens ADD PRIMARY KEY (id);

-- Adicionar Foreign Keys com ON DELETE CASCADE
ALTER TABLE companies ADD CONSTRAINT "companies_adminId_fkey" 
    FOREIGN KEY ("adminId") REFERENCES admins(id) ON DELETE CASCADE;

ALTER TABLE sellers ADD CONSTRAINT "sellers_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE products ADD CONSTRAINT "products_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE customers ADD CONSTRAINT "customers_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE sales ADD CONSTRAINT "sales_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE sales ADD CONSTRAINT "sales_sellerId_fkey" 
    FOREIGN KEY ("sellerId") REFERENCES sellers(id);

ALTER TABLE sales ADD CONSTRAINT "sales_cashClosureId_fkey" 
    FOREIGN KEY ("cashClosureId") REFERENCES cash_closures(id);

ALTER TABLE sale_items ADD CONSTRAINT "sale_items_saleId_fkey" 
    FOREIGN KEY ("saleId") REFERENCES sales(id) ON DELETE CASCADE;

ALTER TABLE sale_items ADD CONSTRAINT "sale_items_productId_fkey" 
    FOREIGN KEY ("productId") REFERENCES products(id);

ALTER TABLE sale_payment_methods ADD CONSTRAINT "sale_payment_methods_saleId_fkey" 
    FOREIGN KEY ("saleId") REFERENCES sales(id) ON DELETE CASCADE;

ALTER TABLE product_exchanges ADD CONSTRAINT "product_exchanges_originalSaleId_fkey" 
    FOREIGN KEY ("originalSaleId") REFERENCES sales(id) ON DELETE CASCADE;

ALTER TABLE product_exchanges ADD CONSTRAINT "product_exchanges_productId_fkey" 
    FOREIGN KEY ("productId") REFERENCES products(id);

ALTER TABLE bills_to_pay ADD CONSTRAINT "bills_to_pay_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE cash_closures ADD CONSTRAINT "cash_closures_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE fiscal_documents ADD CONSTRAINT "fiscal_documents_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE printers ADD CONSTRAINT "printers_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE;

-- ===================================================================
-- FASE 8: Limpar tabelas temporárias
-- ===================================================================

DROP TABLE IF EXISTS temp_admin_id_mapping;
DROP TABLE IF EXISTS temp_company_id_mapping;
DROP TABLE IF EXISTS temp_seller_id_mapping;
DROP TABLE IF EXISTS temp_product_id_mapping;
DROP TABLE IF EXISTS temp_sale_id_mapping;
DROP TABLE IF EXISTS temp_customer_id_mapping;
DROP TABLE IF EXISTS temp_bill_id_mapping;
DROP TABLE IF EXISTS temp_cash_closure_id_mapping;
DROP TABLE IF EXISTS temp_fiscal_document_id_mapping;
DROP TABLE IF EXISTS temp_printer_id_mapping;
DROP TABLE IF EXISTS temp_refresh_token_id_mapping;

-- ===================================================================
-- FASE 9: Atualizar defaults para uuid_generate_v4()
-- ===================================================================

ALTER TABLE admins ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE companies ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE sellers ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE products ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE customers ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE sales ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE sale_items ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE sale_payment_methods ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE product_exchanges ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE bills_to_pay ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE cash_closures ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE fiscal_documents ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE printers ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE refresh_tokens ALTER COLUMN id SET DEFAULT uuid_generate_v4();

COMMIT;

-- ===================================================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO
-- ===================================================================

-- Verificar contagem de registros em cada tabela
SELECT 'admins' as tabela, COUNT(*) as total FROM admins
UNION ALL
SELECT 'companies', COUNT(*) FROM companies
UNION ALL
SELECT 'sellers', COUNT(*) FROM sellers
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'sales', COUNT(*) FROM sales
UNION ALL
SELECT 'sale_items', COUNT(*) FROM sale_items
UNION ALL
SELECT 'sale_payment_methods', COUNT(*) FROM sale_payment_methods
UNION ALL
SELECT 'product_exchanges', COUNT(*) FROM product_exchanges
UNION ALL
SELECT 'bills_to_pay', COUNT(*) FROM bills_to_pay
UNION ALL
SELECT 'cash_closures', COUNT(*) FROM cash_closures
UNION ALL
SELECT 'fiscal_documents', COUNT(*) FROM fiscal_documents
UNION ALL
SELECT 'printers', COUNT(*) FROM printers
UNION ALL
SELECT 'refresh_tokens', COUNT(*) FROM refresh_tokens
ORDER BY tabela;


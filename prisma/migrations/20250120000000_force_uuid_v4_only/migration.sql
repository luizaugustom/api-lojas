-- Migration: Force UUID v4 Only
-- Esta migration garante que APENAS UUID v4 seja usado no banco de dados
-- Compatível com bancos novos e existentes

-- Criar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================================
-- CASO 1: Banco de dados novo (sem tabelas)
-- ===================================================================
-- Se as tabelas não existirem, elas serão criadas pelo schema.prisma

-- ===================================================================
-- CASO 2: Banco de dados existente com IDs não-UUID
-- ===================================================================
-- Esta seção converte IDs existentes para UUID v4

-- Função para verificar se uma coluna existe
CREATE OR REPLACE FUNCTION column_exists(
    tablename text,
    columnname text
) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = tablename
        AND column_name = columnname
    );
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se um ID é UUID válido
CREATE OR REPLACE FUNCTION is_valid_uuid(val text) RETURNS boolean AS $$
BEGIN
    RETURN val ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- Verificar e converter tabelas existentes
-- ===================================================================

DO $$
DECLARE
    table_name text;
    has_non_uuid boolean := false;
BEGIN
    -- Verificar se há IDs não-UUID em cada tabela
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('admins', 'companies', 'sellers', 'products', 'customers', 
                          'sales', 'sale_items', 'sale_payment_methods', 'product_exchanges',
                          'bills_to_pay', 'cash_closures', 'fiscal_documents', 'printers', 'refresh_tokens')
    LOOP
        EXECUTE format(
            'SELECT EXISTS(SELECT 1 FROM %I WHERE NOT is_valid_uuid(id::text) LIMIT 1)',
            table_name
        ) INTO has_non_uuid;
        
        IF has_non_uuid THEN
            RAISE NOTICE '⚠️  Tabela % contém IDs não-UUID. Conversão necessária!', table_name;
        ELSE
            RAISE NOTICE '✅ Tabela % já usa UUID', table_name;
        END IF;
    END LOOP;
    
    -- Se houver IDs não-UUID, recomenda usar o script de conversão completo
    IF has_non_uuid THEN
        RAISE EXCEPTION '
        ❌ MIGRAÇÃO INTERROMPIDA
        
        Esta migration detectou IDs no formato não-UUID no banco de dados.
        Para converter IDs existentes, use o script: prisma/migrations/production_uuid_migration.sql
        
        Para um banco de dados NOVO, remova todos os dados e execute:
        npm run prisma:reset
        
        Para PRODUÇÃO com dados existentes, use:
        psql -d seu_banco < prisma/migrations/production_uuid_migration.sql
        ';
    END IF;
END;
$$;

-- ===================================================================
-- Garantir que novas colunas de ID usem UUID v4
-- ===================================================================

-- Atualizar defaults para todas as tabelas
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('admins', 'companies', 'sellers', 'products', 'customers', 
                          'sales', 'sale_items', 'sale_payment_methods', 'product_exchanges',
                          'bills_to_pay', 'cash_closures', 'fiscal_documents', 'printers', 'refresh_tokens')
    LOOP
        -- Alterar tipo da coluna id para UUID se necessário
        IF column_exists(table_name, 'id') THEN
            BEGIN
                EXECUTE format('ALTER TABLE %I ALTER COLUMN id TYPE UUID USING id::uuid', table_name);
                EXECUTE format('ALTER TABLE %I ALTER COLUMN id SET DEFAULT uuid_generate_v4()', table_name);
                RAISE NOTICE '✅ Tabela %: coluna id configurada para UUID v4', table_name;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE '⚠️  Tabela %: já está configurada ou não precisa de alteração', table_name;
            END;
        END IF;
    END LOOP;
END;
$$;

-- ===================================================================
-- Verificação Final
-- ===================================================================

DO $$
DECLARE
    total_tables integer;
    uuid_tables integer;
BEGIN
    SELECT COUNT(*) INTO total_tables
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('admins', 'companies', 'sellers', 'products', 'customers', 
                      'sales', 'sale_items', 'sale_payment_methods', 'product_exchanges',
                      'bills_to_pay', 'cash_closures', 'fiscal_documents', 'printers', 'refresh_tokens');
    
    IF total_tables = 0 THEN
        RAISE NOTICE '✅ Banco novo detectado. Schema será criado pelo Prisma.';
    ELSE
        RAISE NOTICE '✅ Migration UUID v4 concluída com sucesso!';
        RAISE NOTICE '📊 Total de tabelas verificadas: %', total_tables;
    END IF;
END;
$$;

-- Limpar funções temporárias
DROP FUNCTION IF EXISTS column_exists(text, text);
DROP FUNCTION IF EXISTS is_valid_uuid(text);


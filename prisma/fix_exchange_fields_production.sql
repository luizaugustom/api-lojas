-- ===================================================================
-- Script SQL para CORRIGIR campos antigos na tabela product_exchanges
-- Execute este script DIRETAMENTE no banco de dados de PRODUÇÃO
-- Data: 2025-11-24
-- ===================================================================
-- 
-- Este script remove os campos antigos que não existem mais no schema:
-- - originalQuantity / original_quantity
-- - exchangedQuantity / exchanged_quantity  
-- - product_id / productId
--
-- O script é IDEMPOTENTE e pode ser executado múltiplas vezes com segurança
-- ===================================================================

BEGIN;

-- Remove originalQuantity (camelCase)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'originalQuantity'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "originalQuantity";
    RAISE NOTICE '✅ Coluna originalQuantity removida';
  ELSE
    RAISE NOTICE 'ℹ️  Coluna originalQuantity não existe (já foi removida)';
  END IF;
END $$;

-- Remove original_quantity (snake_case)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'original_quantity'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "original_quantity";
    RAISE NOTICE '✅ Coluna original_quantity removida';
  ELSE
    RAISE NOTICE 'ℹ️  Coluna original_quantity não existe (já foi removida)';
  END IF;
END $$;

-- Remove exchangedQuantity (camelCase) - ESTE É O CAMPO QUE ESTÁ CAUSANDO O ERRO
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'exchangedQuantity'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "exchangedQuantity";
    RAISE NOTICE '✅ Coluna exchangedQuantity removida (ERRO CORRIGIDO)';
  ELSE
    RAISE NOTICE 'ℹ️  Coluna exchangedQuantity não existe (já foi removida)';
  END IF;
END $$;

-- Remove exchanged_quantity (snake_case)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'exchanged_quantity'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "exchanged_quantity";
    RAISE NOTICE '✅ Coluna exchanged_quantity removida';
  ELSE
    RAISE NOTICE 'ℹ️  Coluna exchanged_quantity não existe (já foi removida)';
  END IF;
END $$;

-- Remove product_id (campo antigo)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'product_id'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "product_id";
    RAISE NOTICE '✅ Coluna product_id removida';
  ELSE
    RAISE NOTICE 'ℹ️  Coluna product_id não existe (já foi removida)';
  END IF;
END $$;

-- Remove productId (camelCase)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'productId'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "productId";
    RAISE NOTICE '✅ Coluna productId removida';
  ELSE
    RAISE NOTICE 'ℹ️  Coluna productId não existe (já foi removida)';
  END IF;
END $$;

COMMIT;

-- ===================================================================
-- VERIFICAÇÃO: Lista todas as colunas da tabela product_exchanges
-- ===================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'product_exchanges'
ORDER BY ordinal_position;

-- ===================================================================
-- VERIFICAÇÃO ESPECÍFICA: Confirma que os campos problemáticos foram removidos
-- ===================================================================
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ SUCESSO: Todos os campos antigos foram removidos!'
    ELSE '⚠️  ATENÇÃO: Ainda existem campos antigos: ' || string_agg(column_name, ', ')
  END as status
FROM information_schema.columns
WHERE table_name = 'product_exchanges'
  AND column_name IN ('originalQuantity', 'original_quantity', 'exchangedQuantity', 'exchanged_quantity', 'product_id', 'productId');


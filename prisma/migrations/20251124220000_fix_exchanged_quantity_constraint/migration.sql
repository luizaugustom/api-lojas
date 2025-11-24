-- Migration: Fix exchangedQuantity constraint violation
-- Data de criacao: 2025-11-24 22:00:00
-- Descricao: Remove campo exchangedQuantity que está causando erro de constraint violation
-- 
-- Este campo foi removido do schema do Prisma mas ainda existe no banco de dados
-- causando erro: Null constraint violation on the fields: (exchangedQuantity)

-- Esta migração é idempotente e pode ser executada múltiplas vezes

BEGIN;

-- Remove exchangedQuantity (camelCase) - ESTE É O CAMPO QUE ESTÁ CAUSANDO O ERRO
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_exchanges'
      AND column_name = 'exchangedQuantity'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "exchangedQuantity";
    RAISE NOTICE '✅ Coluna exchangedQuantity removida com sucesso';
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
    WHERE table_schema = 'public'
      AND table_name = 'product_exchanges'
      AND column_name = 'exchanged_quantity'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "exchanged_quantity";
    RAISE NOTICE '✅ Coluna exchanged_quantity removida com sucesso';
  ELSE
    RAISE NOTICE 'ℹ️  Coluna exchanged_quantity não existe (já foi removida)';
  END IF;
END $$;

-- Remove originalQuantity (camelCase) - também pode causar problemas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_exchanges'
      AND column_name = 'originalQuantity'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "originalQuantity";
    RAISE NOTICE '✅ Coluna originalQuantity removida com sucesso';
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
    WHERE table_schema = 'public'
      AND table_name = 'product_exchanges'
      AND column_name = 'original_quantity'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "original_quantity";
    RAISE NOTICE '✅ Coluna original_quantity removida com sucesso';
  ELSE
    RAISE NOTICE 'ℹ️  Coluna original_quantity não existe (já foi removida)';
  END IF;
END $$;

-- Remove product_id (campo antigo que não existe mais no schema)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_exchanges'
      AND column_name = 'product_id'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "product_id";
    RAISE NOTICE '✅ Coluna product_id removida com sucesso';
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
    WHERE table_schema = 'public'
      AND table_name = 'product_exchanges'
      AND column_name = 'productId'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "productId";
    RAISE NOTICE '✅ Coluna productId removida com sucesso';
  ELSE
    RAISE NOTICE 'ℹ️  Coluna productId não existe (já foi removida)';
  END IF;
END $$;

COMMIT;

-- Verificação: Listar todas as colunas para confirmar
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'product_exchanges'
    AND column_name IN ('originalQuantity', 'original_quantity', 'exchangedQuantity', 'exchanged_quantity', 'product_id', 'productId');
  
  IF remaining_count = 0 THEN
    RAISE NOTICE '✅ SUCESSO: Todos os campos problemáticos foram removidos!';
  ELSE
    RAISE WARNING '⚠️  ATENÇÃO: Ainda existem % campos antigos na tabela', remaining_count;
  END IF;
END $$;


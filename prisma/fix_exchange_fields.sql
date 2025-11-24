-- Script SQL para corrigir campos antigos na tabela product_exchanges
-- Execute este script diretamente no banco de dados se a migração não puder ser aplicada
-- Data: 2025-11-24

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
    RAISE NOTICE 'Coluna originalQuantity removida';
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
    RAISE NOTICE 'Coluna original_quantity removida';
  END IF;
END $$;

-- Remove exchangedQuantity (camelCase)
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
    RAISE NOTICE 'Coluna exchangedQuantity removida';
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
    RAISE NOTICE 'Coluna exchanged_quantity removida';
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
    RAISE NOTICE 'Coluna product_id removida';
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
    RAISE NOTICE 'Coluna productId removida';
  END IF;
END $$;

-- Verifica se todas as colunas foram removidas
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'product_exchanges'
  AND column_name IN ('originalQuantity', 'original_quantity', 'exchangedQuantity', 'exchanged_quantity', 'product_id', 'productId')
ORDER BY column_name;


-- Migration: Remove campos antigos (originalQuantity e exchangedQuantity) da tabela product_exchanges
-- Data de criacao: 2025-11-24
-- Descricao: Remove campos que foram removidos do schema mas ainda existem no banco

DO $$
BEGIN
  -- Remove originalQuantity (camelCase)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'originalQuantity'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "originalQuantity";
  END IF;

  -- Remove original_quantity (snake_case)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'original_quantity'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "original_quantity";
  END IF;

  -- Remove exchangedQuantity (camelCase)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'exchangedQuantity'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "exchangedQuantity";
  END IF;

  -- Remove exchanged_quantity (snake_case)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'exchanged_quantity'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "exchanged_quantity";
  END IF;

  -- Remove product_id (campo antigo que não existe mais no schema)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'product_id'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "product_id";
  END IF;

  -- Remove productId (camelCase)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'productId'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "productId";
  END IF;
END $$;


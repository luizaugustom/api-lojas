-- Migration: Remove originalQuantity field from product_exchanges table
-- Data de criacao: 2025-11-24
-- Descricao: Remove o campo originalQuantity que foi removido do schema mas ainda existe no banco

DO $$
BEGIN
  -- Verifica se a coluna existe e a remove
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'originalQuantity'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "originalQuantity";
  END IF;

  -- Também verifica se existe com snake_case (original_quantity)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'original_quantity'
  ) THEN
    ALTER TABLE "product_exchanges"
      DROP COLUMN "original_quantity";
  END IF;
END $$;


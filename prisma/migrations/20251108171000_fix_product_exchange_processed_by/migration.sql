DO $migration$
BEGIN
  -- Renomeia coluna antiga, se existir
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'processed_by_id'
  ) THEN
    ALTER TABLE "product_exchanges"
      RENAME COLUMN "processed_by_id" TO "processedById";
  END IF;

  -- Garante a existência da coluna camelCase
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'processedById'
  ) THEN
    ALTER TABLE "product_exchanges"
      ADD COLUMN "processedById" UUID;
  END IF;

  -- Cria constraint de FK se ainda não existir
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'product_exchanges'
      AND constraint_name = 'product_exchanges_processedById_fkey'
  ) THEN
    ALTER TABLE "product_exchanges"
      ADD CONSTRAINT "product_exchanges_processedById_fkey"
      FOREIGN KEY ("processedById") REFERENCES "sellers"("id") ON DELETE SET NULL;
  END IF;
END;
$migration$;


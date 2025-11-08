DO $migration$
BEGIN
  -- Renomeia coluna antiga snake_case, se existir
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchange_items'
      AND column_name = 'exchange_id'
  ) THEN
    ALTER TABLE "product_exchange_items"
      RENAME COLUMN "exchange_id" TO "exchangeId";
  END IF;

  -- Garante que a coluna camelCase exista
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchange_items'
      AND column_name = 'exchangeId'
  ) THEN
    ALTER TABLE "product_exchange_items"
      ADD COLUMN "exchangeId" UUID;
  END IF;

  -- Popula dados faltantes usando chave estrangeira antiga, se houver
  -- Assegura que a coluna não fique nula
  IF EXISTS (
    SELECT 1 FROM "product_exchange_items" WHERE "exchangeId" IS NULL
  ) THEN
    RAISE NOTICE 'Existem product_exchange_items sem exchangeId após a migração. Verifique manualmente.';
  END IF;

  -- Adiciona constraint de FK se ainda não existir
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'product_exchange_items'
      AND constraint_name = 'product_exchange_items_exchangeId_fkey'
  ) THEN
    ALTER TABLE "product_exchange_items"
      ADD CONSTRAINT "product_exchange_items_exchangeId_fkey"
      FOREIGN KEY ("exchangeId") REFERENCES "product_exchanges"("id") ON DELETE CASCADE;
  END IF;
END;
$migration$;


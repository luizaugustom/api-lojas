DO $migration$
DECLARE
  company_id_exists BOOLEAN;
  companyId_exists BOOLEAN;
  originalSaleId_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'company_id'
  ) INTO company_id_exists;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'companyId'
  ) INTO companyId_exists;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'originalSaleId'
  ) INTO originalSaleId_exists;

  -- Se ainda estiver usando snake_case, renomeia para o padrão camelCase
  IF company_id_exists AND NOT companyId_exists THEN
    ALTER TABLE "product_exchanges" RENAME COLUMN "company_id" TO "companyId";
    companyId_exists := TRUE;
  END IF;

  -- Garante a existência da coluna camelCase
  IF NOT companyId_exists THEN
    ALTER TABLE "product_exchanges"
      ADD COLUMN "companyId" UUID;
  END IF;

  -- Popular valores faltantes usando a venda original como referência
  IF originalSaleId_exists THEN
    UPDATE "product_exchanges" pe
    SET "companyId" = s."companyId"
    FROM "sales" s
    WHERE pe."companyId" IS NULL
      AND pe."originalSaleId" = s."id";
  END IF;

  -- Caso a coluna esteja vazia e exista company_id legado com dados, copiar antes de remover
  -- Assegura que não fiquem linhas sem companyId
  IF EXISTS (
    SELECT 1 FROM "product_exchanges" WHERE "companyId" IS NULL
  ) THEN
    RAISE NOTICE 'Existem trocas sem companyId após a migração. Verifique manualmente.';
  END IF;

  -- Configura constraint de chave estrangeira se ainda não existir
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'product_exchanges'
      AND constraint_name = 'product_exchanges_companyId_fkey'
  ) THEN
    ALTER TABLE "product_exchanges"
      ADD CONSTRAINT "product_exchanges_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  END IF;
END;
$migration$;


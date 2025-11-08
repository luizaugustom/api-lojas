-- Corrigir nomes de colunas adicionadas manualmente em snake_case
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'fiscal_documents'
      AND column_name = 'sale_id'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'fiscal_documents'
      AND column_name = 'saleId'
  ) THEN
    EXECUTE 'ALTER TABLE "fiscal_documents" RENAME COLUMN "sale_id" TO "saleId";';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'fiscal_documents'
      AND column_name = 'product_exchange_id'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'fiscal_documents'
      AND column_name = 'productExchangeId'
  ) THEN
    EXECUTE 'ALTER TABLE "fiscal_documents" RENAME COLUMN "product_exchange_id" TO "productExchangeId";';
  END IF;
END $$;

-- Garantir que índices usem os novos nomes de colunas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'fiscal_documents_sale_id_idx'
  ) THEN
    EXECUTE 'ALTER INDEX "fiscal_documents_sale_id_idx" RENAME TO "fiscal_documents_saleId_idx";';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fiscal_documents_sale_id_fkey'
      AND table_name = 'fiscal_documents'
  ) THEN
    EXECUTE 'ALTER TABLE "fiscal_documents" RENAME CONSTRAINT "fiscal_documents_sale_id_fkey" TO "fiscal_documents_saleId_fkey";';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fiscal_documents_product_exchange_id_fkey'
      AND table_name = 'fiscal_documents'
  ) THEN
    EXECUTE 'ALTER TABLE "fiscal_documents" RENAME CONSTRAINT "fiscal_documents_product_exchange_id_fkey" TO "fiscal_documents_productExchangeId_fkey";';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'fiscal_documents_product_exchange_id_idx'
  ) THEN
    EXECUTE 'ALTER INDEX "fiscal_documents_product_exchange_id_idx" RENAME TO "fiscal_documents_productExchangeId_idx";';
  END IF;
END $$;



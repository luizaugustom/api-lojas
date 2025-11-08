-- Migration: Full product exchange refactor
-- Data de criacao: 2025-11-08

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExchangeStatus') THEN
    CREATE TYPE "ExchangeStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExchangeItemType') THEN
    CREATE TYPE "ExchangeItemType" AS ENUM ('RETURNED', 'DELIVERED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExchangePaymentType') THEN
    CREATE TYPE "ExchangePaymentType" AS ENUM ('PAYMENT', 'REFUND');
  END IF;
END $$;

-- Adicionar novas colunas para cabecalho de trocas
ALTER TABLE "product_exchanges" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "product_exchanges" ADD COLUMN IF NOT EXISTS "returned_total" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "product_exchanges" ADD COLUMN IF NOT EXISTS "delivered_total" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "product_exchanges" ADD COLUMN IF NOT EXISTS "difference" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "product_exchanges" ADD COLUMN IF NOT EXISTS "store_credit_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "product_exchanges" ADD COLUMN IF NOT EXISTS "status" "ExchangeStatus" NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE "product_exchanges" ADD COLUMN IF NOT EXISTS "company_id" TEXT;
ALTER TABLE "product_exchanges" ADD COLUMN IF NOT EXISTS "processed_by_id" TEXT;

-- Preencher company_id com base na venda original (compatibilidade com colunas antigas)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_exchanges' AND column_name = 'original_sale_id'
  ) THEN
    EXECUTE '
      UPDATE "product_exchanges" pe
      SET "company_id" = s."company_id"
      FROM "sales" s
      WHERE pe."original_sale_id" = s."id" AND pe."company_id" IS NULL
    ';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_exchanges' AND column_name = 'sale_id'
  ) THEN
    EXECUTE '
      UPDATE "product_exchanges" pe
      SET "company_id" = s."company_id"
      FROM "sales" s
      WHERE pe."sale_id" = s."id" AND pe."company_id" IS NULL
    ';
  END IF;
END $$;

ALTER TABLE "product_exchanges" ALTER COLUMN "company_id" SET NOT NULL;

-- Ajustar chaves estrangeiras
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'product_exchanges_company_id_fkey'
      AND table_name = 'product_exchanges'
  ) THEN
    ALTER TABLE "product_exchanges"
      ADD CONSTRAINT "product_exchanges_company_id_fkey"
      FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'product_exchanges_processed_by_id_fkey'
      AND table_name = 'product_exchanges'
  ) THEN
    ALTER TABLE "product_exchanges"
      ADD CONSTRAINT "product_exchanges_processed_by_id_fkey"
      FOREIGN KEY ("processed_by_id") REFERENCES "sellers"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- Remover colunas antigas que nao fazem mais sentido
ALTER TABLE "product_exchanges" DROP COLUMN IF EXISTS "product_id";
ALTER TABLE "product_exchanges" DROP COLUMN IF EXISTS "original_quantity";
ALTER TABLE "product_exchanges" DROP COLUMN IF EXISTS "exchanged_quantity";

-- Criar tabela de itens da troca
CREATE TABLE IF NOT EXISTS "product_exchange_items" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "type" "ExchangeItemType" NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unit_price" DECIMAL(10,2) NOT NULL,
  "total_price" DECIMAL(10,2) NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "exchange_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "sale_item_id" TEXT,
  CONSTRAINT "product_exchange_items_exchange_id_fkey"
    FOREIGN KEY ("exchange_id") REFERENCES "product_exchanges"("id") ON DELETE CASCADE,
  CONSTRAINT "product_exchange_items_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE,
  CONSTRAINT "product_exchange_items_sale_item_id_fkey"
    FOREIGN KEY ("sale_item_id") REFERENCES "sale_items"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "product_exchange_items_exchange_id_idx" ON "product_exchange_items" ("exchange_id");
CREATE INDEX IF NOT EXISTS "product_exchange_items_product_id_idx" ON "product_exchange_items" ("product_id");
CREATE INDEX IF NOT EXISTS "product_exchange_items_sale_item_id_idx" ON "product_exchange_items" ("sale_item_id");

-- Criar tabela de pagamentos/refundos relacionados a troca
CREATE TABLE IF NOT EXISTS "product_exchange_payments" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "type" "ExchangePaymentType" NOT NULL,
  "method" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "additional_info" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "exchange_id" TEXT NOT NULL,
  CONSTRAINT "product_exchange_payments_exchange_id_fkey"
    FOREIGN KEY ("exchange_id") REFERENCES "product_exchanges"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "product_exchange_payments_exchange_id_idx" ON "product_exchange_payments" ("exchange_id");
CREATE INDEX IF NOT EXISTS "product_exchange_payments_type_idx" ON "product_exchange_payments" ("type");

-- Ajustes na tabela de documentos fiscais para vincular vendas e trocas
ALTER TABLE "fiscal_documents" ADD COLUMN IF NOT EXISTS "origin" TEXT NOT NULL DEFAULT 'GENERIC';
ALTER TABLE "fiscal_documents" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "fiscal_documents" ADD COLUMN IF NOT EXISTS "sale_id" TEXT;
ALTER TABLE "fiscal_documents" ADD COLUMN IF NOT EXISTS "product_exchange_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fiscal_documents_sale_id_fkey'
      AND table_name = 'fiscal_documents'
  ) THEN
    ALTER TABLE "fiscal_documents"
      ADD CONSTRAINT "fiscal_documents_sale_id_fkey"
      FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fiscal_documents_product_exchange_id_fkey'
      AND table_name = 'fiscal_documents'
  ) THEN
    ALTER TABLE "fiscal_documents"
      ADD CONSTRAINT "fiscal_documents_product_exchange_id_fkey"
      FOREIGN KEY ("product_exchange_id") REFERENCES "product_exchanges"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "fiscal_documents_sale_id_idx" ON "fiscal_documents" ("sale_id");
CREATE INDEX IF NOT EXISTS "fiscal_documents_product_exchange_id_idx" ON "fiscal_documents" ("product_exchange_id");

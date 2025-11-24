-- Migration: Add Store Credit System
-- Data de criação: 2025-01-31
-- Descrição: Adiciona sistema de gerenciamento de créditos em loja

DO $migration$
BEGIN
  -- Adicionar coluna storeCreditBalance na tabela customers
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'customers'
      AND column_name = 'storeCreditBalance'
  ) THEN
    ALTER TABLE "customers"
      ADD COLUMN "storeCreditBalance" NUMERIC(10, 2) NOT NULL DEFAULT 0;
  END IF;

  -- Criar tabela store_credit_transactions
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'store_credit_transactions'
  ) THEN
    CREATE TABLE "store_credit_transactions" (
      "id" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "amount" NUMERIC(10, 2) NOT NULL,
      "balanceBefore" NUMERIC(10, 2) NOT NULL,
      "balanceAfter" NUMERIC(10, 2) NOT NULL,
      "description" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "customerId" TEXT NOT NULL,
      "companyId" TEXT NOT NULL,
      "exchangeId" TEXT,
      "saleId" TEXT,
      "createdById" TEXT,

      CONSTRAINT "store_credit_transactions_pkey" PRIMARY KEY ("id")
    );

    -- Criar índices
    CREATE INDEX "store_credit_transactions_customerId_createdAt_idx" ON "store_credit_transactions"("customerId", "createdAt");
    CREATE INDEX "store_credit_transactions_companyId_createdAt_idx" ON "store_credit_transactions"("companyId", "createdAt");

    -- Adicionar foreign keys
    ALTER TABLE "store_credit_transactions"
      ADD CONSTRAINT "store_credit_transactions_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

    ALTER TABLE "store_credit_transactions"
      ADD CONSTRAINT "store_credit_transactions_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $migration$;


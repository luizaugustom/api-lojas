-- Migration: Add Cost Price and Product Losses
-- Data de criação: 2025-02-10
-- Descrição: Adiciona campo costPrice aos produtos e sistema de registro de perdas de produtos

DO $migration$
BEGIN
  -- Adicionar coluna costPrice na tabela products
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
      AND column_name = 'costPrice'
  ) THEN
    ALTER TABLE "products"
      ADD COLUMN "costPrice" NUMERIC(10, 2);
  END IF;

  -- Criar tabela product_losses
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'product_losses'
  ) THEN
    CREATE TABLE "product_losses" (
      "id" TEXT NOT NULL,
      "quantity" INTEGER NOT NULL,
      "unitCost" NUMERIC(10, 2) NOT NULL,
      "totalCost" NUMERIC(10, 2) NOT NULL,
      "reason" TEXT NOT NULL,
      "notes" TEXT,
      "lossDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      "companyId" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      "sellerId" TEXT,

      CONSTRAINT "product_losses_pkey" PRIMARY KEY ("id")
    );

    -- Adicionar foreign keys
    ALTER TABLE "product_losses"
      ADD CONSTRAINT "product_losses_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

    ALTER TABLE "product_losses"
      ADD CONSTRAINT "product_losses_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

    ALTER TABLE "product_losses"
      ADD CONSTRAINT "product_losses_sellerId_fkey"
      FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $migration$;


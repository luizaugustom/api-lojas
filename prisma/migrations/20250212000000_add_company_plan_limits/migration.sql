-- Migration: Add Company Plan Limits
-- Data de criação: 2025-02-12
-- Descrição: Adiciona campos de limite personalizáveis por empresa (produtos, clientes, fotos, emissão fiscal)

DO $migration$
BEGIN
  -- Adicionar coluna maxProducts
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'companies'
      AND column_name = 'maxProducts'
  ) THEN
    ALTER TABLE "companies"
      ADD COLUMN "maxProducts" INTEGER;
  END IF;

  -- Adicionar coluna maxCustomers
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'companies'
      AND column_name = 'maxCustomers'
  ) THEN
    ALTER TABLE "companies"
      ADD COLUMN "maxCustomers" INTEGER;
  END IF;

  -- Adicionar coluna maxSellers
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'companies'
      AND column_name = 'maxSellers'
  ) THEN
    ALTER TABLE "companies"
      ADD COLUMN "maxSellers" INTEGER;
  END IF;

  -- Adicionar coluna photoUploadEnabled
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'companies'
      AND column_name = 'photoUploadEnabled'
  ) THEN
    ALTER TABLE "companies"
      ADD COLUMN "photoUploadEnabled" BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- Adicionar coluna maxPhotosPerProduct
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'companies'
      AND column_name = 'maxPhotosPerProduct'
  ) THEN
    ALTER TABLE "companies"
      ADD COLUMN "maxPhotosPerProduct" INTEGER;
  END IF;

  -- Adicionar coluna nfceEmissionEnabled
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'companies'
      AND column_name = 'nfceEmissionEnabled'
  ) THEN
    ALTER TABLE "companies"
      ADD COLUMN "nfceEmissionEnabled" BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- Adicionar coluna nfeEmissionEnabled
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'companies'
      AND column_name = 'nfeEmissionEnabled'
  ) THEN
    ALTER TABLE "companies"
      ADD COLUMN "nfeEmissionEnabled" BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $migration$;


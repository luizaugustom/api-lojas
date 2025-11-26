-- Migration: Add company catalog flags and autoMessageAllowed
-- Created at: 2025-11-26 18:40
-- Description: Adds missing feature flag columns used by Prisma schema

DO $migration$
BEGIN
  -- Add autoMessageAllowed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'autoMessageAllowed'
  ) THEN
    ALTER TABLE "companies"
      ADD COLUMN "autoMessageAllowed" BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- Add catalogPageAllowed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'catalogPageAllowed'
  ) THEN
    ALTER TABLE "companies"
      ADD COLUMN "catalogPageAllowed" BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- Add catalogPageUrl
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'catalogPageUrl'
  ) THEN
    ALTER TABLE "companies"
      ADD COLUMN "catalogPageUrl" TEXT;
  END IF;

  -- Add catalogPageEnabled
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'catalogPageEnabled'
  ) THEN
    ALTER TABLE "companies"
      ADD COLUMN "catalogPageEnabled" BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $migration$;

-- AlterTable
-- Adiciona campos de configuração do Focus NFe na tabela companies
DO $migration$
BEGIN
  -- Adicionar coluna focusNfeApiKey se não existir
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'companies'
      AND column_name = 'focusNfeApiKey'
  ) THEN
    ALTER TABLE "companies"
      ADD COLUMN "focusNfeApiKey" TEXT;
  END IF;

  -- Adicionar coluna focusNfeEnvironment se não existir
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'companies'
      AND column_name = 'focusNfeEnvironment'
  ) THEN
    ALTER TABLE "companies"
      ADD COLUMN "focusNfeEnvironment" TEXT DEFAULT 'sandbox';
  END IF;

  -- Adicionar coluna ibptToken se não existir
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'companies'
      AND column_name = 'ibptToken'
  ) THEN
    ALTER TABLE "companies"
      ADD COLUMN "ibptToken" TEXT;
  END IF;
END;
$migration$;


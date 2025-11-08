DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'returnedTotal'
  ) THEN
    ALTER TABLE "product_exchanges"
      ADD COLUMN "returnedTotal" NUMERIC(10, 2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'deliveredTotal'
  ) THEN
    ALTER TABLE "product_exchanges"
      ADD COLUMN "deliveredTotal" NUMERIC(10, 2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'difference'
  ) THEN
    ALTER TABLE "product_exchanges"
      ADD COLUMN "difference" NUMERIC(10, 2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'storeCreditAmount'
  ) THEN
    ALTER TABLE "product_exchanges"
      ADD COLUMN "storeCreditAmount" NUMERIC(10, 2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE "product_exchanges"
      ADD COLUMN "status" TEXT NOT NULL DEFAULT 'COMPLETED';
  END IF;
END;
$migration$;


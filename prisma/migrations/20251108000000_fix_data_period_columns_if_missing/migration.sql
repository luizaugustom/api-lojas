DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'DataPeriodFilter'
  ) THEN
    CREATE TYPE "DataPeriodFilter" AS ENUM (
      'ALL',
      'THIS_YEAR',
      'LAST_6_MONTHS',
      'LAST_3_MONTHS',
      'LAST_1_MONTH',
      'LAST_15_DAYS',
      'THIS_WEEK'
    );
  END IF;
END
$$;

ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "defaultDataPeriod" "DataPeriodFilter" NOT NULL DEFAULT 'THIS_YEAR';

ALTER TABLE "sellers"
  ADD COLUMN IF NOT EXISTS "defaultDataPeriod" "DataPeriodFilter" NOT NULL DEFAULT 'LAST_1_MONTH';


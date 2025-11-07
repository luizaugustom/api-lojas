-- CreateEnum
CREATE TYPE "DataPeriodFilter" AS ENUM ('ALL', 'THIS_YEAR', 'LAST_6_MONTHS', 'LAST_3_MONTHS', 'LAST_1_MONTH', 'LAST_15_DAYS', 'THIS_WEEK');

-- AlterTable companies
ALTER TABLE "companies"
ADD COLUMN     "default_data_period" "DataPeriodFilter" NOT NULL DEFAULT 'THIS_YEAR';

-- AlterTable sellers
ALTER TABLE "sellers"
ADD COLUMN     "default_data_period" "DataPeriodFilter" NOT NULL DEFAULT 'LAST_1_MONTH';


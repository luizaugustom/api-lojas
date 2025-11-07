-- Enum usado para armazenar o período padrão exibido nas telas
CREATE TYPE "DataPeriodFilter" AS ENUM (
  'ALL',
  'THIS_YEAR',
  'LAST_6_MONTHS',
  'LAST_3_MONTHS',
  'LAST_1_MONTH',
  'LAST_15_DAYS',
  'THIS_WEEK'
);

-- Campo padrão para empresas (padrão: ESTE ANO)
ALTER TABLE "companies"
ADD COLUMN "defaultDataPeriod" "DataPeriodFilter" NOT NULL DEFAULT 'THIS_YEAR';

-- Campo padrão para vendedores (restrito via aplicação)
ALTER TABLE "sellers"
ADD COLUMN "defaultDataPeriod" "DataPeriodFilter" NOT NULL DEFAULT 'LAST_1_MONTH';

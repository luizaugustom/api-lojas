DO $migration$
BEGIN
  -- Ajusta colunas da tabela product_exchange_items para camelCase
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchange_items'
      AND column_name = 'product_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchange_items'
      AND column_name = 'productId'
  ) THEN
    ALTER TABLE "product_exchange_items"
      RENAME COLUMN "product_id" TO "productId";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchange_items'
      AND column_name = 'sale_item_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchange_items'
      AND column_name = 'saleItemId'
  ) THEN
    ALTER TABLE "product_exchange_items"
      RENAME COLUMN "sale_item_id" TO "saleItemId";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchange_items'
      AND column_name = 'unit_price'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchange_items'
      AND column_name = 'unitPrice'
  ) THEN
    ALTER TABLE "product_exchange_items"
      RENAME COLUMN "unit_price" TO "unitPrice";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchange_items'
      AND column_name = 'total_price'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchange_items'
      AND column_name = 'totalPrice'
  ) THEN
    ALTER TABLE "product_exchange_items"
      RENAME COLUMN "total_price" TO "totalPrice";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchange_items'
      AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchange_items'
      AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE "product_exchange_items"
      RENAME COLUMN "created_at" TO "createdAt";
  END IF;
END;
$migration$;

DO $migration$
BEGIN
  -- Ajusta colunas da tabela product_exchange_payments para camelCase
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchange_payments'
      AND column_name = 'additional_info'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchange_payments'
      AND column_name = 'additionalInfo'
  ) THEN
    ALTER TABLE "product_exchange_payments"
      RENAME COLUMN "additional_info" TO "additionalInfo";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchange_payments'
      AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchange_payments'
      AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE "product_exchange_payments"
      RENAME COLUMN "created_at" TO "createdAt";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchange_payments'
      AND column_name = 'exchange_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchange_payments'
      AND column_name = 'exchangeId'
  ) THEN
    ALTER TABLE "product_exchange_payments"
      RENAME COLUMN "exchange_id" TO "exchangeId";
  END IF;
END;
$migration$;

DO $migration$
BEGIN
  -- Ajusta colunas adicionadas na tabela product_exchanges para camelCase
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'returned_total'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'returnedTotal'
  ) THEN
    ALTER TABLE "product_exchanges"
      RENAME COLUMN "returned_total" TO "returnedTotal";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'delivered_total'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'deliveredTotal'
  ) THEN
    ALTER TABLE "product_exchanges"
      RENAME COLUMN "delivered_total" TO "deliveredTotal";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'store_credit_amount'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_exchanges'
      AND column_name = 'storeCreditAmount'
  ) THEN
    ALTER TABLE "product_exchanges"
      RENAME COLUMN "store_credit_amount" TO "storeCreditAmount";
  END IF;
END;
$migration$;



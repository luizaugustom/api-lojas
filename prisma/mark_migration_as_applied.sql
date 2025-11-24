-- ===================================================================
-- Script para marcar a migração como aplicada na tabela _prisma_migrations
-- Execute este script APÓS executar o fix_exchange_fields_production.sql
-- ===================================================================
-- 
-- Este script registra a migração 20251124190000_remove_original_quantity_from_exchanges
-- na tabela _prisma_migrations do Prisma, para que o Prisma reconheça que ela já foi aplicada
-- ===================================================================

-- Verifica se a migração já está registrada
DO $$
DECLARE
  migration_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM "_prisma_migrations" 
    WHERE migration_name = '20251124190000_remove_original_quantity_from_exchanges'
  ) INTO migration_exists;

  IF NOT migration_exists THEN
    -- Insere o registro da migração como aplicada
    INSERT INTO "_prisma_migrations" (
      id,
      checksum,
      finished_at,
      migration_name,
      logs,
      rolled_back_at,
      started_at,
      applied_steps_count
    ) VALUES (
      gen_random_uuid(),
      '', -- checksum vazio (não crítico para migrações manuais)
      NOW(),
      '20251124190000_remove_original_quantity_from_exchanges',
      NULL,
      NULL,
      NOW(),
      1
    );
    
    RAISE NOTICE '✅ Migração registrada na tabela _prisma_migrations';
  ELSE
    RAISE NOTICE 'ℹ️  Migração já está registrada';
  END IF;
END $$;

-- Verifica o registro
SELECT 
  migration_name,
  finished_at,
  started_at
FROM "_prisma_migrations"
WHERE migration_name = '20251124190000_remove_original_quantity_from_exchanges';


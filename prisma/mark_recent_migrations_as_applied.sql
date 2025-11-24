-- ===================================================================
-- Script para marcar as migrations recentes como aplicadas
-- Execute este script APÓS executar as migrations manualmente em produção
-- =================================================================== 
-- 
-- Este script registra as migrations recentes na tabela _prisma_migrations
-- do Prisma, para que o Prisma reconheça que elas já foram aplicadas
-- ===================================================================

-- Lista de migrations recentes que precisam ser registradas
-- Adicione aqui as migrations que foram aplicadas manualmente mas não estão registradas

DO $$
DECLARE
  migration_name TEXT;
  migration_exists BOOLEAN;
  migration_id UUID;
BEGIN
  -- Lista de migrations para registrar
  FOR migration_name IN 
    SELECT unnest(ARRAY[
      '20251124190000_remove_original_quantity_from_exchanges',
      '20251124220000_fix_exchanged_quantity_constraint'
    ])
  LOOP
    -- Verifica se a migração já está registrada
    SELECT EXISTS(
      SELECT 1 
      FROM "_prisma_migrations" 
      WHERE "_prisma_migrations"."migration_name" = migration_name
    ) INTO migration_exists;

    IF NOT migration_exists THEN
      -- Gera um novo UUID para a migration
      migration_id := gen_random_uuid();
      
      -- Insere o registro da migração como aplicada
      INSERT INTO "_prisma_migrations" (
        "id",
        "checksum",
        "finished_at",
        "migration_name",
        "logs",
        "rolled_back_at",
        "started_at",
        "applied_steps_count"
      ) VALUES (
        migration_id,
        '', -- checksum vazio (não crítico para migrações manuais)
        NOW(),
        migration_name,
        NULL,
        NULL,
        NOW(),
        1
      );
      
      RAISE NOTICE '✅ Migração % registrada na tabela _prisma_migrations', migration_name;
    ELSE
      RAISE NOTICE 'ℹ️  Migração % já está registrada', migration_name;
    END IF;
  END LOOP;
END $$;

-- Verifica os registros das migrations
SELECT 
  "migration_name",
  "finished_at",
  "started_at",
  "applied_steps_count"
FROM "_prisma_migrations"
WHERE "migration_name" IN (
  '20251124190000_remove_original_quantity_from_exchanges',
  '20251124220000_fix_exchanged_quantity_constraint'
)
ORDER BY "finished_at" DESC;


-- SQL Script para adicionar a coluna unitOfMeasure à tabela products
-- Execute este script diretamente no banco de dados PostgreSQL

-- Verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'unitOfMeasure'
    ) THEN
        -- Adicionar a coluna com valor padrão 'un'
        ALTER TABLE products ADD COLUMN "unitOfMeasure" TEXT DEFAULT 'un';
        -- Atualizar produtos existentes com o valor padrão
        UPDATE products SET "unitOfMeasure" = 'un' WHERE "unitOfMeasure" IS NULL;
        RAISE NOTICE 'Coluna unitOfMeasure adicionada com sucesso com valor padrão "un".';
    ELSE
        -- Se a coluna já existe, apenas atualizar produtos NULL com o valor padrão
        UPDATE products SET "unitOfMeasure" = 'un' WHERE "unitOfMeasure" IS NULL;
        -- Definir valor padrão para novas inserções
        ALTER TABLE products ALTER COLUMN "unitOfMeasure" SET DEFAULT 'un';
        RAISE NOTICE 'Coluna unitOfMeasure já existe. Valor padrão definido e registros existentes atualizados.';
    END IF;
END $$;


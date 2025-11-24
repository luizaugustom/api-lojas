-- Script de verificação da migration add_focus_nfe_to_company
-- Execute este script após aplicar a migration para verificar se tudo está correto

-- Verificar se as colunas foram criadas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'companies'
  AND column_name IN ('focusNfeApiKey', 'focusNfeEnvironment', 'ibptToken')
ORDER BY column_name;

-- Verificar quantas empresas já têm configuração do Focus NFe
SELECT 
    COUNT(*) as total_empresas,
    COUNT("focusNfeApiKey") as empresas_com_api_key,
    COUNT("focusNfeEnvironment") as empresas_com_ambiente,
    COUNT("ibptToken") as empresas_com_ibpt_token
FROM companies;

-- Listar empresas com configuração do Focus NFe
SELECT 
    id,
    name,
    cnpj,
    CASE 
        WHEN "focusNfeApiKey" IS NOT NULL THEN 'Configurado'
        ELSE 'Não configurado'
    END as status_api_key,
    "focusNfeEnvironment" as ambiente,
    CASE 
        WHEN "ibptToken" IS NOT NULL THEN 'Configurado'
        ELSE 'Não configurado'
    END as status_ibpt_token
FROM companies
WHERE "focusNfeApiKey" IS NOT NULL
   OR "focusNfeEnvironment" IS NOT NULL
   OR "ibptToken" IS NOT NULL
ORDER BY name;


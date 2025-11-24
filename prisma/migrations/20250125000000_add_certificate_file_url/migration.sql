-- Migration: Adiciona campo certificateFileUrl na tabela companies
-- Data de criacao: 2025-01-25
-- Descricao: Adiciona campo para armazenar a URL do arquivo do certificado digital

-- AlterTable
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "certificateFileUrl" TEXT;


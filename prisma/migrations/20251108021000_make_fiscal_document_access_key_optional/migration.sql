-- Permitir accessKey nula em fiscal_documents para documentos de entrada sem chave
ALTER TABLE "fiscal_documents"
  ALTER COLUMN "accessKey" DROP NOT NULL;



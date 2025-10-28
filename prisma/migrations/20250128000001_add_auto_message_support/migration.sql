-- AlterTable
ALTER TABLE "companies" ADD COLUMN "autoMessageEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "installments" ADD COLUMN "lastMessageSentAt" TIMESTAMP(3),
ADD COLUMN "messageCount" INTEGER NOT NULL DEFAULT 0;


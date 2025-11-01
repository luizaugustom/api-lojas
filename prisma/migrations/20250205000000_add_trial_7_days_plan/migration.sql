-- AlterEnum
-- Adiciona o novo valor TRIAL_7_DAYS ao enum PlanType
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'TRIAL_7_DAYS';


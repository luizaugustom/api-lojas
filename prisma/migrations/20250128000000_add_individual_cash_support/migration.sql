-- AddColumn: hasIndividualCash to sellers table
ALTER TABLE "sellers" ADD COLUMN "hasIndividualCash" BOOLEAN NOT NULL DEFAULT false;

-- AddColumn: sellerId to cash_closures table (nullable)
ALTER TABLE "cash_closures" ADD COLUMN "sellerId" TEXT;

-- AddForeignKey
ALTER TABLE "cash_closures" ADD CONSTRAINT "cash_closures_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex (optional, for better query performance)
CREATE INDEX "cash_closures_sellerId_idx" ON "cash_closures"("sellerId");
CREATE INDEX "cash_closures_companyId_isClosed_idx" ON "cash_closures"("companyId", "isClosed");
CREATE INDEX "cash_closures_sellerId_isClosed_idx" ON "cash_closures"("sellerId", "isClosed");


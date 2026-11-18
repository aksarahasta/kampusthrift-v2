-- CreateEnum
CREATE TYPE "MarketplaceTransactionStatus" AS ENUM (
  'PENDING_SELLER',
  'RESERVED',
  'DECLINED',
  'CANCELLED',
  'COMPLETED',
  'EXPIRED'
);

-- CreateTable
CREATE TABLE "marketplace_transactions" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "buyer_id" TEXT NOT NULL,
  "seller_id" TEXT NOT NULL,
  "cod_zone_id" TEXT NOT NULL,
  "status" "MarketplaceTransactionStatus" NOT NULL DEFAULT 'PENDING_SELLER',
  "expires_at" TIMESTAMP(3),
  "buyer_confirmed_at" TIMESTAMP(3),
  "seller_confirmed_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "marketplace_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketplace_transactions_product_id_status_created_at_idx"
  ON "marketplace_transactions"("product_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "marketplace_transactions_buyer_id_status_created_at_idx"
  ON "marketplace_transactions"("buyer_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "marketplace_transactions_seller_id_status_created_at_idx"
  ON "marketplace_transactions"("seller_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "marketplace_transactions_status_expires_at_idx"
  ON "marketplace_transactions"("status", "expires_at");

-- AddForeignKey
ALTER TABLE "marketplace_transactions"
  ADD CONSTRAINT "marketplace_transactions_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_transactions"
  ADD CONSTRAINT "marketplace_transactions_buyer_id_fkey"
  FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_transactions"
  ADD CONSTRAINT "marketplace_transactions_seller_id_fkey"
  FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_transactions"
  ADD CONSTRAINT "marketplace_transactions_cod_zone_id_fkey"
  FOREIGN KEY ("cod_zone_id") REFERENCES "cod_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

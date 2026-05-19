-- AlterTable
ALTER TABLE "orders" ADD COLUMN "payment_method" TEXT NULL,
ADD COLUMN "change_for" DOUBLE PRECISION NULL,
ADD COLUMN "subtotal" DOUBLE PRECISION NULL,
ADD COLUMN "delivery_fee" DOUBLE PRECISION NULL,
ADD COLUMN "discount" DOUBLE PRECISION NULL,
ADD COLUMN "coupon_code" TEXT NULL,
ADD COLUMN "estimated_delivery" TEXT NULL;

-- AddRelation: Restaurant.reviews <-> Review.restaurant
-- (No schema change needed – relation already exists via restaurant_id FK)

-- AlterTable: Add CNPJ to restaurants
ALTER TABLE "restaurants" ADD COLUMN "cnpj" TEXT NULL;

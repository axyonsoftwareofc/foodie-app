-- Add payment gateway tracking columns (applied via prisma db execute due to migration history drift)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_intent_id" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_provider" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_status" TEXT;

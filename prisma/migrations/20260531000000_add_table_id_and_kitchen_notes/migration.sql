ALTER TABLE "orders" ADD COLUMN "table_id" TEXT;
ALTER TABLE "orders" ADD COLUMN "kitchen_notes" JSONB;

CREATE INDEX "orders_table_id_idx" ON "orders"("table_id");

ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "restaurant_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

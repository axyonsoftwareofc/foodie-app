-- Migration: add_location_to_restaurant_tables
-- Add optional location field to restaurant_tables for better table organization in large restaurants

ALTER TABLE "restaurant_tables" ADD COLUMN "location" VARCHAR(100);

CREATE INDEX "idx_restaurant_tables_location" ON "restaurant_tables"("location");

COMMENT ON COLUMN "restaurant_tables"."location" IS 'Optional location description (e.g., Area Externa, Perto do Bar, Terraza)';

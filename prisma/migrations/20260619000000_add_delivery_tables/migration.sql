-- Migration: Add delivery tables (DeliveryDriver, DeliveryZone, Delivery)
-- Created: 2026-06-19

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP', 'DELIVERING', 'DELIVERED');
CREATE TYPE "VehicleType" AS ENUM ('MOTO', 'BIKE', 'CAR');
CREATE TYPE "DeliveryZoneType" AS ENUM ('RADIUS', 'POLYGON', 'AREAS');

-- Create delivery_drivers table
CREATE TABLE "delivery_drivers" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::TEXT,
    "user_id" TEXT,
    "restaurant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL DEFAULT 'MOTO',
    "vehicle_plate" TEXT,
    "photo_url" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "total_deliveries" INTEGER NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "delivery_drivers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "delivery_drivers_user_id_key" UNIQUE ("user_id")
);

CREATE INDEX "delivery_drivers_restaurant_id_idx" ON "delivery_drivers"("restaurant_id");
CREATE INDEX "delivery_drivers_user_id_idx" ON "delivery_drivers"("user_id");

-- Create delivery_zones table
CREATE TABLE "delivery_zones" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::TEXT,
    "restaurant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DeliveryZoneType" NOT NULL DEFAULT 'RADIUS',
    "center_latitude" DOUBLE PRECISION,
    "center_longitude" DOUBLE PRECISION,
    "radius_km" DOUBLE PRECISION,
    "delivery_fee" DOUBLE PRECISION NOT NULL,
    "fee_per_km" DOUBLE PRECISION,
    "min_order_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimated_time_minutes" INTEGER NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "delivery_zones_restaurant_id_idx" ON "delivery_zones"("restaurant_id");

-- Create deliveries table
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::TEXT,
    "order_id" TEXT NOT NULL UNIQUE,
    "restaurant_id" TEXT NOT NULL,
    "driver_id" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "pickup_address" TEXT NOT NULL,
    "delivery_address" TEXT NOT NULL,
    "pickup_latitude" DOUBLE PRECISION,
    "pickup_longitude" DOUBLE PRECISION,
    "delivery_latitude" DOUBLE PRECISION,
    "delivery_longitude" DOUBLE PRECISION,
    "current_latitude" DOUBLE PRECISION,
    "current_longitude" DOUBLE PRECISION,
    "distance_km" DOUBLE PRECISION,
    "delivery_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimated_pickup_time" TEXT,
    "estimated_delivery_time" TEXT,
    "actual_pickup_time" TEXT,
    "actual_delivery_time" TEXT,
    "proof_photo_url" TEXT,
    "proof_notes" TEXT,
    "proof_signed_by" TEXT,
    "proof_timestamp" TEXT,
    "timeline" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deliveries_restaurant_id_idx" ON "deliveries"("restaurant_id");
CREATE INDEX "deliveries_driver_id_idx" ON "deliveries"("driver_id");
CREATE INDEX "deliveries_status_idx" ON "deliveries"("status");

-- Add foreign keys
ALTER TABLE "delivery_drivers" ADD CONSTRAINT "delivery_drivers_restaurant_id_fkey"
    FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE;

ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_restaurant_id_fkey"
    FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE;

ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;

ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_restaurant_id_fkey"
    FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE;

ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_driver_id_fkey"
    FOREIGN KEY ("driver_id") REFERENCES "delivery_drivers"("id") ON DELETE SET NULL;

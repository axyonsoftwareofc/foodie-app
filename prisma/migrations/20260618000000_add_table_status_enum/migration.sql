-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED');

-- Drop the existing text default before altering column type
ALTER TABLE "restaurant_tables" ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "restaurant_tables" ALTER COLUMN "status" SET DATA TYPE "TableStatus" USING "status"::text::"TableStatus";

-- Set the new enum default
ALTER TABLE "restaurant_tables" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';

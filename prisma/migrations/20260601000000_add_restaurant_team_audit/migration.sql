-- Team membership and audit trail for restaurant operations.

CREATE TYPE "RestaurantMemberRole" AS ENUM ('OWNER', 'MANAGER', 'KITCHEN', 'WAITER', 'DRIVER');
CREATE TYPE "RestaurantMemberStatus" AS ENUM ('INVITED', 'ACTIVE', 'DISABLED');
CREATE TYPE "RestaurantInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'CANCELLED', 'EXPIRED');

ALTER TABLE "orders"
  ADD COLUMN "created_by_user_id" TEXT,
  ADD COLUMN "created_by_member_id" TEXT;

CREATE TABLE "restaurant_members" (
  "id" TEXT NOT NULL,
  "restaurant_id" TEXT NOT NULL,
  "user_id" TEXT,
  "email" TEXT NOT NULL,
  "full_name" TEXT,
  "phone" TEXT,
  "role" "RestaurantMemberRole" NOT NULL,
  "status" "RestaurantMemberStatus" NOT NULL DEFAULT 'INVITED',
  "invited_by" TEXT,
  "joined_at" TIMESTAMP(3),
  "disabled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "restaurant_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "restaurant_invitations" (
  "id" TEXT NOT NULL,
  "restaurant_id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "full_name" TEXT,
  "phone" TEXT,
  "role" "RestaurantMemberRole" NOT NULL,
  "token_hash" TEXT NOT NULL,
  "status" "RestaurantInvitationStatus" NOT NULL DEFAULT 'PENDING',
  "invited_by" TEXT NOT NULL,
  "accepted_by" TEXT,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "accepted_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "restaurant_invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "restaurant_id" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "actor_member_id" TEXT,
  "action" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT,
  "metadata" JSONB,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "restaurant_members_restaurant_id_email_key"
  ON "restaurant_members"("restaurant_id", "email");
CREATE UNIQUE INDEX "restaurant_members_restaurant_id_user_id_key"
  ON "restaurant_members"("restaurant_id", "user_id");
CREATE INDEX "restaurant_members_restaurant_id_idx" ON "restaurant_members"("restaurant_id");
CREATE INDEX "restaurant_members_user_id_idx" ON "restaurant_members"("user_id");
CREATE INDEX "restaurant_members_role_idx" ON "restaurant_members"("role");
CREATE INDEX "restaurant_members_status_idx" ON "restaurant_members"("status");

CREATE UNIQUE INDEX "restaurant_invitations_token_hash_key"
  ON "restaurant_invitations"("token_hash");
CREATE INDEX "restaurant_invitations_restaurant_id_idx" ON "restaurant_invitations"("restaurant_id");
CREATE INDEX "restaurant_invitations_email_idx" ON "restaurant_invitations"("email");
CREATE INDEX "restaurant_invitations_status_idx" ON "restaurant_invitations"("status");
CREATE INDEX "restaurant_invitations_expires_at_idx" ON "restaurant_invitations"("expires_at");

CREATE INDEX "audit_logs_restaurant_id_idx" ON "audit_logs"("restaurant_id");
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");
CREATE INDEX "audit_logs_actor_member_id_idx" ON "audit_logs"("actor_member_id");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

CREATE INDEX "orders_created_by_user_id_idx" ON "orders"("created_by_user_id");
CREATE INDEX "orders_created_by_member_id_idx" ON "orders"("created_by_member_id");

ALTER TABLE "restaurant_members"
  ADD CONSTRAINT "restaurant_members_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "restaurant_invitations"
  ADD CONSTRAINT "restaurant_invitations_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_created_by_member_id_fkey"
  FOREIGN KEY ("created_by_member_id") REFERENCES "restaurant_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

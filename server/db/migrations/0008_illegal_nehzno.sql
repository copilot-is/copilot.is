ALTER TABLE "chat" ADD COLUMN "model" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "chat" DROP COLUMN IF EXISTS "usage";
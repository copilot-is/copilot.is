ALTER TABLE "message" ALTER COLUMN "content" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "parts" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "attachments" jsonb DEFAULT '[]'::jsonb;
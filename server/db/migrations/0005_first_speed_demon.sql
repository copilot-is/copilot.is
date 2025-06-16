ALTER TABLE "message" ADD COLUMN "parent_id" varchar(255) DEFAULT '';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_parentId_idx" ON "message" USING btree ("parent_id");
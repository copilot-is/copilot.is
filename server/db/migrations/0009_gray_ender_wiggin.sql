CREATE TABLE IF NOT EXISTS "share" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"chat_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX IF EXISTS "chat_shared_idx";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "share" ADD CONSTRAINT "share_chat_id_user_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "share" ADD CONSTRAINT "share_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "share_chatId_idx" ON "share" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "share_userId_idx" ON "share" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "chat" DROP COLUMN IF EXISTS "shared";
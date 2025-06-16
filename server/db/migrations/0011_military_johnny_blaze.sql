ALTER TABLE "share" DROP CONSTRAINT "share_chat_id_user_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "share" ADD CONSTRAINT "share_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

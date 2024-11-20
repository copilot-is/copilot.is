CREATE TABLE IF NOT EXISTS "dev_account" (
	"userId" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "dev_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dev_chat" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"usage" jsonb NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"shared" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dev_message" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"role" varchar(32) NOT NULL,
	"content" jsonb NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"chat_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dev_session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dev_user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp DEFAULT CURRENT_TIMESTAMP,
	"image" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dev_verificationToken" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "dev_verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dev_account" ADD CONSTRAINT "dev_account_userId_dev_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."dev_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dev_chat" ADD CONSTRAINT "dev_chat_user_id_dev_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."dev_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dev_message" ADD CONSTRAINT "dev_message_chat_id_dev_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."dev_chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dev_session" ADD CONSTRAINT "dev_session_userId_dev_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."dev_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "dev_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_userId_idx" ON "dev_chat" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_createdAt_idx" ON "dev_chat" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_userId_idx" ON "dev_message" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_chatId_idx" ON "dev_message" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_createdAt_idx" ON "dev_message" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "dev_session" USING btree ("userId");
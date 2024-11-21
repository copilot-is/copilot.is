ALTER TABLE "dev_user" RENAME COLUMN "emailVerified" TO "email_verified";--> statement-breakpoint
ALTER TABLE "dev_session" ALTER COLUMN "expires" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dev_verificationToken" ALTER COLUMN "expires" SET DATA TYPE timestamp with time zone;
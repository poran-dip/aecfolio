ALTER TABLE "cv_exports" ADD COLUMN "options" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "cv_preferences" ADD COLUMN "options" jsonb DEFAULT '{}'::jsonb NOT NULL;
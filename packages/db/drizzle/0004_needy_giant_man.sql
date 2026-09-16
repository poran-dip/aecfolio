CREATE TYPE "public"."cv_export_job_status" AS ENUM('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."cv_export_kind" AS ENUM('SELF', 'STANDARD');--> statement-breakpoint
CREATE TABLE "cv_export_job_items" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"position" integer NOT NULL,
	"student_id" text NOT NULL,
	"export_id" text,
	"error" text,
	"finished_at" timestamp,
	CONSTRAINT "cv_export_job_items_job_student_unique" UNIQUE("job_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "cv_export_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"requested_by" text NOT NULL,
	"status" "cv_export_job_status" DEFAULT 'QUEUED' NOT NULL,
	"total" integer NOT NULL,
	"completed" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"finished_at" timestamp,
	CONSTRAINT "cv_export_job_progress" CHECK ("cv_export_jobs"."completed" >= 0 AND "cv_export_jobs"."failed" >= 0 AND "cv_export_jobs"."completed" + "cv_export_jobs"."failed" <= "cv_export_jobs"."total")
);
--> statement-breakpoint
ALTER TABLE "cv_exports" ADD COLUMN "kind" "cv_export_kind" NOT NULL;--> statement-breakpoint
ALTER TABLE "cv_exports" ADD COLUMN "checksum" text NOT NULL;--> statement-breakpoint
ALTER TABLE "cv_exports" ADD COLUMN "size_bytes" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "cv_exports" ADD COLUMN "requested_by" text;--> statement-breakpoint
ALTER TABLE "cv_export_job_items" ADD CONSTRAINT "cv_export_job_items_job_id_cv_export_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."cv_export_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_export_job_items" ADD CONSTRAINT "cv_export_job_items_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_export_job_items" ADD CONSTRAINT "cv_export_job_items_export_id_cv_exports_id_fk" FOREIGN KEY ("export_id") REFERENCES "public"."cv_exports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_export_jobs" ADD CONSTRAINT "cv_export_jobs_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cv_export_job_items_job_position_idx" ON "cv_export_job_items" USING btree ("job_id","position");--> statement-breakpoint
CREATE INDEX "cv_export_jobs_requested_by_idx" ON "cv_export_jobs" USING btree ("requested_by","created_at");--> statement-breakpoint
CREATE INDEX "cv_export_jobs_status_idx" ON "cv_export_jobs" USING btree ("status","created_at");--> statement-breakpoint
ALTER TABLE "cv_exports" ADD CONSTRAINT "cv_exports_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cv_exports_student_checksum_idx" ON "cv_exports" USING btree ("student_id","checksum");
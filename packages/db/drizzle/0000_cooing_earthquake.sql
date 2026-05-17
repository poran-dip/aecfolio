CREATE TYPE "public"."branch" AS ENUM('CSE', 'ETE', 'EE', 'IE', 'ME', 'CE', 'IPE', 'CHE', 'CA');--> statement-breakpoint
CREATE TYPE "public"."course" AS ENUM('BTECH', 'MTECH', 'BCA', 'MCA');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('STUDENT', 'FACULTY', 'ADMIN', 'PENDING');--> statement-breakpoint
CREATE TYPE "public"."experience_type" AS ENUM('INTERNSHIP', 'VOLUNTEER', 'CLUB', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."social_type" AS ENUM('LINKEDIN', 'GITHUB', 'LEETCODE', 'CODEFORCES', 'OTHER');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auditlog_metadata_shape" CHECK ("audit_logs"."metadata" IS NULL OR jsonb_typeof("audit_logs"."metadata") = 'object')
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"phone" text,
	"role" "role" DEFAULT 'PENDING' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "user_deletedat_past" CHECK ("users"."deleted_at" IS NULL OR "users"."deleted_at" <= now())
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faculty" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"designation" text,
	"department" "branch",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "faculty_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "faculty_employee_id_unique" UNIQUE("employee_id"),
	CONSTRAINT "faculty_deletedat_past" CHECK ("faculty"."deleted_at" IS NULL OR "faculty"."deleted_at" <= now())
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"proof_image" text,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_by" text,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "achievement_verified_consistency" CHECK (
      ("achievements"."verified" = false AND "achievements"."verified_by" IS NULL AND "achievements"."verified_at" IS NULL) OR
      ("achievements"."verified" = true AND "achievements"."verified_by" IS NOT NULL AND "achievements"."verified_at" IS NOT NULL)
    ),
	CONSTRAINT "achievement_deletedat_past" CHECK ("achievements"."deleted_at" IS NULL OR "achievements"."deleted_at" <= now())
);
--> statement-breakpoint
CREATE TABLE "certifications" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"name" text NOT NULL,
	"issuer" text NOT NULL,
	"issue_date" timestamp,
	"proof_image" text,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_by" text,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "certification_verified_consistency" CHECK (
      ("certifications"."verified" = false AND "certifications"."verified_by" IS NULL AND "certifications"."verified_at" IS NULL) OR
      ("certifications"."verified" = true AND "certifications"."verified_by" IS NOT NULL AND "certifications"."verified_at" IS NOT NULL)
    ),
	CONSTRAINT "certification_deletedat_past" CHECK ("certifications"."deleted_at" IS NULL OR "certifications"."deleted_at" <= now())
);
--> statement-breakpoint
CREATE TABLE "experiences" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"type" "experience_type" NOT NULL,
	"title" text NOT NULL,
	"organization" text NOT NULL,
	"description" text NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "experience_date_order" CHECK ("experiences"."end_date" IS NULL OR "experiences"."start_date" IS NULL OR "experiences"."end_date" >= "experiences"."start_date"),
	CONSTRAINT "experience_deletedat_past" CHECK ("experiences"."deleted_at" IS NULL OR "experiences"."deleted_at" <= now())
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"tech_stack" text[] DEFAULT '{}' NOT NULL,
	"link" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "project_deletedat_past" CHECK ("projects"."deleted_at" IS NULL OR "projects"."deleted_at" <= now())
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"semester" integer NOT NULL,
	"sgpa" real,
	"pending_sgpa" real,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_by" text,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "results_student_semester_unique" UNIQUE("student_id","semester"),
	CONSTRAINT "result_semester_range" CHECK ("results"."semester" >= 1 AND "results"."semester" <= 8),
	CONSTRAINT "result_sgpa_range" CHECK ("results"."sgpa" >= 0.0 AND "results"."sgpa" <= 10.0),
	CONSTRAINT "result_pending_sgpa_range" CHECK ("results"."pending_sgpa" IS NULL OR ("results"."pending_sgpa" >= 0.0 AND "results"."pending_sgpa" <= 10.0)),
	CONSTRAINT "result_verified_consistency" CHECK (
      ("results"."verified" = false AND "results"."verified_by" IS NULL AND "results"."verified_at" IS NULL) OR
      ("results"."verified" = true AND "results"."verified_by" IS NOT NULL AND "results"."verified_at" IS NOT NULL)
    )
);
--> statement-breakpoint
CREATE TABLE "socials" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"type" "social_type" NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "socials_student_type_unique" UNIQUE("student_id","type"),
	CONSTRAINT "social_url_format" CHECK ("socials"."url" ~ '^https?://')
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"roll_no" text NOT NULL,
	"course" "course" NOT NULL,
	"branch" "branch" NOT NULL,
	"semester" integer NOT NULL,
	"bio" text,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"cgpa" real,
	"mother_name" text,
	"father_name" text,
	"location" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "students_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "students_roll_no_unique" UNIQUE("roll_no"),
	CONSTRAINT "student_semester_range" CHECK ("students"."semester" >= 1 AND "students"."semester" <= 8),
	CONSTRAINT "student_cgpa_range" CHECK ("students"."cgpa" >= 0.0 AND "students"."cgpa" <= 10.0),
	CONSTRAINT "student_deletedat_past" CHECK ("students"."deleted_at" IS NULL OR "students"."deleted_at" <= now())
);
--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "achievements_student_id_idx" ON "achievements" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "achievements_verified_idx" ON "achievements" USING btree ("verified");--> statement-breakpoint
CREATE INDEX "certifications_student_id_idx" ON "certifications" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "certifications_verified_idx" ON "certifications" USING btree ("verified");--> statement-breakpoint
CREATE INDEX "experiences_student_id_idx" ON "experiences" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "experiences_student_type_idx" ON "experiences" USING btree ("student_id","type");--> statement-breakpoint
CREATE INDEX "projects_student_id_idx" ON "projects" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "results_verified_idx" ON "results" USING btree ("verified");--> statement-breakpoint
CREATE INDEX "socials_student_id_idx" ON "socials" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "students_course_idx" ON "students" USING btree ("course");--> statement-breakpoint
CREATE INDEX "students_branch_idx" ON "students" USING btree ("branch");--> statement-breakpoint
CREATE INDEX "students_course_branch_idx" ON "students" USING btree ("course","branch");--> statement-breakpoint
CREATE INDEX "students_semester_idx" ON "students" USING btree ("semester");
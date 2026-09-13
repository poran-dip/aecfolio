CREATE TYPE "public"."branch" AS ENUM('CSE', 'ETE', 'EE', 'IE', 'ME', 'CE', 'IPE', 'CHE', 'CA');--> statement-breakpoint
CREATE TYPE "public"."course" AS ENUM('BTECH', 'MTECH', 'BCA', 'MCA');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('STUDENT', 'FACULTY', 'MOD', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('ACTIVE', 'ALUMNI', 'SUSPENDED', 'LEFT');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"proof_key" text,
	"status" "verification_status" DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "achievement_status_consistency" CHECK (
      ("achievements"."status" = 'PENDING' AND "achievements"."reviewed_by" IS NULL AND "achievements"."reviewed_at" IS NULL) OR
      ("achievements"."status" = 'VERIFIED' AND "achievements"."reviewed_by" IS NOT NULL AND "achievements"."reviewed_at" IS NOT NULL AND "achievements"."rejection_reason" IS NULL) OR
      ("achievements"."status" = 'REJECTED' AND "achievements"."reviewed_by" IS NOT NULL AND "achievements"."reviewed_at" IS NOT NULL AND "achievements"."rejection_reason" IS NOT NULL)
    ),
	CONSTRAINT "achievement_deletedat_past" CHECK ("achievements"."deleted_at" IS NULL OR "achievements"."deleted_at" <= now())
);
--> statement-breakpoint
CREATE TABLE "certifications" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"name" text NOT NULL,
	"issuer" text NOT NULL,
	"issue_date" text,
	"expiry_date" text,
	"credential_link" text,
	"proof_key" text,
	"status" "verification_status" DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "certification_status_consistency" CHECK (
      ("certifications"."status" = 'PENDING' AND "certifications"."reviewed_by" IS NULL AND "certifications"."reviewed_at" IS NULL) OR
      ("certifications"."status" = 'VERIFIED' AND "certifications"."reviewed_by" IS NOT NULL AND "certifications"."reviewed_at" IS NOT NULL AND "certifications"."rejection_reason" IS NULL) OR
      ("certifications"."status" = 'REJECTED' AND "certifications"."reviewed_by" IS NOT NULL AND "certifications"."reviewed_at" IS NOT NULL AND "certifications"."rejection_reason" IS NOT NULL)
    ),
	CONSTRAINT "certification_deletedat_past" CHECK ("certifications"."deleted_at" IS NULL OR "certifications"."deleted_at" <= now())
);
--> statement-breakpoint
CREATE TABLE "custom_section_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"custom_section_id" text NOT NULL,
	"title" text NOT NULL,
	"org" text,
	"date" text,
	"body" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "custom_section_entry_deletedat_past" CHECK ("custom_section_entries"."deleted_at" IS NULL OR "custom_section_entries"."deleted_at" <= now())
);
--> statement-breakpoint
CREATE TABLE "custom_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "custom_section_deletedat_past" CHECK ("custom_sections"."deleted_at" IS NULL OR "custom_sections"."deleted_at" <= now())
);
--> statement-breakpoint
CREATE TABLE "interests" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "interest_deletedat_past" CHECK ("interests"."deleted_at" IS NULL OR "interests"."deleted_at" <= now())
);
--> statement-breakpoint
CREATE TABLE "socials" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "social_url_format" CHECK ("socials"."url" ~ '^https?://'),
	CONSTRAINT "social_deletedat_past" CHECK ("socials"."deleted_at" IS NULL OR "socials"."deleted_at" <= now())
);
--> statement-breakpoint
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
	"impersonated_by" text,
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
	"role" "role" NOT NULL,
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
CREATE TABLE "experiences" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"organization" text NOT NULL,
	"description" text NOT NULL,
	"date" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "experience_deletedat_past" CHECK ("experiences"."deleted_at" IS NULL OR "experiences"."deleted_at" <= now())
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"link" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "project_deletedat_past" CHECK ("projects"."deleted_at" IS NULL OR "projects"."deleted_at" <= now())
);
--> statement-breakpoint
CREATE TABLE "cv_exports" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"template_id" text NOT NULL,
	"config" jsonb NOT NULL,
	"object_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cv_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"template_id" text NOT NULL,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cv_preferences_student_template_unique" UNIQUE("student_id","template_id")
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
CREATE TABLE "results" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"semester" integer NOT NULL,
	"scheme_id" text NOT NULL,
	"sgpa" real,
	"pending_sgpa" real,
	"status" "verification_status" DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "results_student_semester_unique" UNIQUE("student_id","semester"),
	CONSTRAINT "result_semester_range" CHECK ("results"."semester" >= 1 AND "results"."semester" <= 8),
	CONSTRAINT "result_sgpa_range" CHECK ("results"."sgpa" IS NULL OR ("results"."sgpa" >= 0.0 AND "results"."sgpa" <= 10.0)),
	CONSTRAINT "result_pending_sgpa_range" CHECK ("results"."pending_sgpa" IS NULL OR ("results"."pending_sgpa" >= 0.0 AND "results"."pending_sgpa" <= 10.0)),
	CONSTRAINT "result_status_consistency" CHECK (
      ("results"."status" = 'PENDING' AND "results"."reviewed_by" IS NULL AND "results"."reviewed_at" IS NULL) OR
      ("results"."status" = 'VERIFIED' AND "results"."reviewed_by" IS NOT NULL AND "results"."reviewed_at" IS NOT NULL AND "results"."sgpa" IS NOT NULL AND "results"."rejection_reason" IS NULL) OR
      ("results"."status" = 'REJECTED' AND "results"."reviewed_by" IS NOT NULL AND "results"."reviewed_at" IS NOT NULL AND "results"."rejection_reason" IS NOT NULL)
    ),
	CONSTRAINT "result_deletedat_past" CHECK ("results"."deleted_at" IS NULL OR "results"."deleted_at" <= now())
);
--> statement-breakpoint
CREATE TABLE "semester_credit_schemes" (
	"id" text PRIMARY KEY NOT NULL,
	"branch" "branch" NOT NULL,
	"admission_year" integer NOT NULL,
	"semester" integer NOT NULL,
	"total_credits" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scheme_branch_year_semester_unique" UNIQUE("branch","admission_year","semester"),
	CONSTRAINT "scheme_semester_range" CHECK ("semester_credit_schemes"."semester" >= 1 AND "semester_credit_schemes"."semester" <= 8),
	CONSTRAINT "scheme_total_credits_positive" CHECK ("semester_credit_schemes"."total_credits" > 0)
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"roll_no" text NOT NULL,
	"course" "course" NOT NULL,
	"branch" "branch" NOT NULL,
	"semester" integer NOT NULL,
	"status" "student_status" DEFAULT 'ACTIVE' NOT NULL,
	"admission_year" integer NOT NULL,
	"bio" text,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"cgpa" real,
	"title_sought" text,
	"dob" text,
	"gender" text,
	"caste" text,
	"religion" text,
	"spoken_languages" text[] DEFAULT '{}' NOT NULL,
	"mother_name" text,
	"mother_contact" text,
	"father_name" text,
	"father_contact" text,
	"location" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "students_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "students_roll_no_unique" UNIQUE("roll_no"),
	CONSTRAINT "student_semester_range" CHECK ("students"."semester" >= 1 AND "students"."semester" <= 8),
	CONSTRAINT "student_cgpa_range" CHECK ("students"."cgpa" IS NULL OR ("students"."cgpa" >= 0.0 AND "students"."cgpa" <= 10.0)),
	CONSTRAINT "student_deletedat_past" CHECK ("students"."deleted_at" IS NULL OR "students"."deleted_at" <= now())
);
--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_section_entries" ADD CONSTRAINT "custom_section_entries_custom_section_id_custom_sections_id_fk" FOREIGN KEY ("custom_section_id") REFERENCES "public"."custom_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_sections" ADD CONSTRAINT "custom_sections_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interests" ADD CONSTRAINT "interests_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "socials" ADD CONSTRAINT "socials_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_exports" ADD CONSTRAINT "cv_exports_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_preferences" ADD CONSTRAINT "cv_preferences_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_scheme_id_semester_credit_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."semester_credit_schemes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "achievements_student_id_idx" ON "achievements" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "achievements_status_idx" ON "achievements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "certifications_student_id_idx" ON "certifications" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "certifications_status_idx" ON "certifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "custom_section_entries_section_id_idx" ON "custom_section_entries" USING btree ("custom_section_id");--> statement-breakpoint
CREATE INDEX "custom_sections_student_id_idx" ON "custom_sections" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "interests_student_id_idx" ON "interests" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "socials_student_id_idx" ON "socials" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "experiences_student_id_idx" ON "experiences" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "experiences_student_type_idx" ON "experiences" USING btree ("student_id","type");--> statement-breakpoint
CREATE INDEX "projects_student_id_idx" ON "projects" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "cv_exports_student_id_idx" ON "cv_exports" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "cv_exports_student_created_idx" ON "cv_exports" USING btree ("student_id","created_at");--> statement-breakpoint
CREATE INDEX "results_status_idx" ON "results" USING btree ("status");--> statement-breakpoint
CREATE INDEX "students_course_idx" ON "students" USING btree ("course");--> statement-breakpoint
CREATE INDEX "students_branch_idx" ON "students" USING btree ("branch");--> statement-breakpoint
CREATE INDEX "students_course_branch_idx" ON "students" USING btree ("course","branch");--> statement-breakpoint
CREATE INDEX "students_semester_idx" ON "students" USING btree ("semester");--> statement-breakpoint
CREATE INDEX "students_admission_year_idx" ON "students" USING btree ("admission_year");--> statement-breakpoint
CREATE INDEX "students_status_idx" ON "students" USING btree ("status");
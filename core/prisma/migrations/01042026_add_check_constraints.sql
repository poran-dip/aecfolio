ALTER TABLE "Student" ADD CONSTRAINT "student_semester_range" CHECK (semester >= 1 AND semester <= 8);
ALTER TABLE "Result" ADD CONSTRAINT "result_semester_range" CHECK (semester >= 1 AND semester <= 8);

ALTER TABLE "Result" ADD CONSTRAINT "result_sgpa_range" CHECK (sgpa >= 0.0 AND sgpa <= 10.0);
ALTER TABLE "Student" ADD CONSTRAINT "student_cgpa_range" CHECK (cgpa >= 0.0 AND cgpa <= 10.0);

ALTER TABLE "Experience" ADD CONSTRAINT "experience_date_order" CHECK (
  "endDate" IS NULL OR "startDate" IS NULL OR "endDate" >= "startDate"
);

ALTER TABLE "Result" ADD CONSTRAINT "result_verified_consistency" CHECK (
  (verified = false AND "verifiedBy" IS NULL AND "verifiedAt" IS NULL) OR
  (verified = true AND "verifiedBy" IS NOT NULL AND "verifiedAt" IS NOT NULL)
);

ALTER TABLE "Achievement" ADD CONSTRAINT "achievement_verified_consistency" CHECK (
  (verified = false AND "verifiedBy" IS NULL AND "verifiedAt" IS NULL) OR
  (verified = true AND "verifiedBy" IS NOT NULL AND "verifiedAt" IS NOT NULL)
);

ALTER TABLE "Certification" ADD CONSTRAINT "certification_verified_consistency" CHECK (
  (verified = false AND "verifiedBy" IS NULL AND "verifiedAt" IS NULL) OR
  (verified = true AND "verifiedBy" IS NOT NULL AND "verifiedAt" IS NOT NULL)
);

ALTER TABLE "User" ADD CONSTRAINT "user_deletedat_past" CHECK ("deletedAt" IS NULL OR "deletedAt" <= now());
ALTER TABLE "Student" ADD CONSTRAINT "student_deletedat_past" CHECK ("deletedAt" IS NULL OR "deletedAt" <= now());
ALTER TABLE "Faculty" ADD CONSTRAINT "faculty_deletedat_past" CHECK ("deletedAt" IS NULL OR "deletedAt" <= now());
ALTER TABLE "Experience" ADD CONSTRAINT "experience_deletedat_past" CHECK ("deletedAt" IS NULL OR "deletedAt" <= now());
ALTER TABLE "Project" ADD CONSTRAINT "project_deletedat_past" CHECK ("deletedAt" IS NULL OR "deletedAt" <= now());
ALTER TABLE "Achievement" ADD CONSTRAINT "achievement_deletedat_past" CHECK ("deletedAt" IS NULL OR "deletedAt" <= now());
ALTER TABLE "Certification" ADD CONSTRAINT "certification_deletedat_past" CHECK ("deletedAt" IS NULL OR "deletedAt" <= now());

ALTER TABLE "AuditLog" ADD CONSTRAINT "auditlog_metadata_shape" CHECK (
  metadata IS NULL OR (
    jsonb_typeof(metadata) = 'object'
  )
);

ALTER TABLE "Social" ADD CONSTRAINT "social_url_format" CHECK (url ~ '^https?://');

CREATE FUNCTION prevent_auditlog_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog records are immutable and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auditlog_immutable
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_auditlog_mutation();

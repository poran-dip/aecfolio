ALTER TABLE "Result"
ADD CONSTRAINT "result_pending_sgpa_range" CHECK (
  "pendingSgpa" IS NULL OR ("pendingSgpa" >= 0.0 AND "pendingSgpa" <= 10.0)
);

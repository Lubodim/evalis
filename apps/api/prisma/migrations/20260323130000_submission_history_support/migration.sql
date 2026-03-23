DROP INDEX IF EXISTS "Submission_assessmentId_studentProfileId_key";
CREATE INDEX IF NOT EXISTS "Submission_assessmentId_studentProfileId_idx" ON "Submission"("assessmentId", "studentProfileId");
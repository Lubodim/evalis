ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "examSessionId" TEXT;

ALTER TABLE "Submission"
ADD CONSTRAINT "Submission_examSessionId_fkey"
FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Submission_assessmentId_studentProfileId_examSessionId_status_idx"
ON "Submission"("assessmentId", "studentProfileId", "examSessionId", "status");
ALTER TABLE "Assessment"
ADD COLUMN "teachingAssignmentId" TEXT;

CREATE INDEX "Assessment_teachingAssignmentId_idx"
ON "Assessment"("teachingAssignmentId");

ALTER TABLE "Assessment"
ADD CONSTRAINT "Assessment_teachingAssignmentId_fkey"
FOREIGN KEY ("teachingAssignmentId") REFERENCES "TeachingAssignment"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

UPDATE "Assessment" a
SET "teachingAssignmentId" = ta."id"
FROM "SchoolClass" sc
INNER JOIN "Subject" s
  ON s."name" = sc."subject"
INNER JOIN "TeachingAssignment" ta
  ON ta."schoolClassId" = sc."id"
 AND ta."subjectId" = s."id"
WHERE a."schoolClassId" = sc."id"
  AND a."teacherId" = ta."teacherUserId"
  AND a."teachingAssignmentId" IS NULL;

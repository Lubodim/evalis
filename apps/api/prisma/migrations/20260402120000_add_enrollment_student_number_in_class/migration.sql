ALTER TABLE "Enrollment"
ADD COLUMN "studentNumberInClass" INTEGER;

ALTER TABLE "Enrollment"
ADD CONSTRAINT "Enrollment_studentNumberInClass_positive"
CHECK ("studentNumberInClass" IS NULL OR "studentNumberInClass" > 0);

CREATE UNIQUE INDEX "Enrollment_schoolClassId_studentNumberInClass_key"
ON "Enrollment"("schoolClassId", "studentNumberInClass");

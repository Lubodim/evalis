ALTER TABLE "SchoolClass"
ADD COLUMN "gradeLevel" INTEGER,
ADD COLUMN "classCode" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

UPDATE "SchoolClass"
SET
  "gradeLevel" = 7,
  "classCode" = '251',
  "isActive" = true
WHERE "id" = 'seed-school-class';

UPDATE "SchoolClass"
SET
  "gradeLevel" = 8,
  "classCode" = '252',
  "isActive" = true
WHERE "id" = 'seed-school-class-teacher-2';

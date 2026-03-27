CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeachingAssignment" (
    "id" TEXT NOT NULL,
    "schoolClassId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");
CREATE UNIQUE INDEX "TeachingAssignment_schoolClassId_subjectId_teacherUserId_key"
ON "TeachingAssignment"("schoolClassId", "subjectId", "teacherUserId");

ALTER TABLE "TeachingAssignment"
ADD CONSTRAINT "TeachingAssignment_schoolClassId_fkey"
FOREIGN KEY ("schoolClassId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TeachingAssignment"
ADD CONSTRAINT "TeachingAssignment_subjectId_fkey"
FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TeachingAssignment"
ADD CONSTRAINT "TeachingAssignment_teacherUserId_fkey"
FOREIGN KEY ("teacherUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "Subject" ("id", "name", "createdAt", "updatedAt")
SELECT
    CONCAT('legacy-subject-', md5(legacy_subjects."subject")),
    legacy_subjects."subject",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT "subject"
    FROM "SchoolClass"
) AS legacy_subjects
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "TeachingAssignment" (
    "id",
    "schoolClassId",
    "subjectId",
    "teacherUserId",
    "createdAt",
    "updatedAt"
)
SELECT
    CONCAT(
        'legacy-teaching-assignment-',
        md5(CONCAT(sc."id", '|', s."id", '|', sc."teacherId"))
    ),
    sc."id",
    s."id",
    sc."teacherId",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "SchoolClass" sc
INNER JOIN "Subject" s ON s."name" = sc."subject"
ON CONFLICT ("schoolClassId", "subjectId", "teacherUserId") DO NOTHING;

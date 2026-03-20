-- CreateEnum
CREATE TYPE "AssessmentReviewMode" AS ENUM ('NONE', 'SCORE_ONLY', 'ANSWERS_NO_EXPLANATIONS', 'ANSWERS_WITH_EXPLANATIONS');

-- AlterTable
ALTER TABLE "Assessment"
ADD COLUMN "reviewMode" "AssessmentReviewMode" NOT NULL DEFAULT 'NONE',
ADD COLUMN "reviewAvailableAt" TIMESTAMP(3);

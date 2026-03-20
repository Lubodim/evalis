import { AssessmentReviewMode } from "@prisma/client";

export type UpdateAssessmentReviewSettingsDto = {
  reviewMode?: AssessmentReviewMode;
  reviewAvailableAt?: string | null;
};

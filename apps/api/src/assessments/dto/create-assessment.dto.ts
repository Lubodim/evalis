import { AssessmentType } from "@prisma/client";

export type CreateAssessmentDto = {
  title?: string;
  description?: string;
  type?: AssessmentType;
  totalPoints?: number;
  dueAt?: string;
  publishedAt?: string;
};

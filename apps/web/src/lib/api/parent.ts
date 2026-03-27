import { apiRequest } from "./client";
import type { ParentSubmissionReview } from "../../types/parent";

const PARENT_HEADERS = {
  "x-user-role": "PARENT"
} as const;

export async function getParentSubmissionReview(
  studentProfileId: string,
  submissionId: string,
  parentId: string
) {
  return apiRequest<ParentSubmissionReview>(
    `/parent/students/${studentProfileId}/submissions/${submissionId}/review`,
    {
      method: "GET",
      headers: {
        ...PARENT_HEADERS,
        "x-user-id": parentId
      }
    }
  );
}
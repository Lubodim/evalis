import { apiRequest } from "./client";
import type {
  StudentAssessmentListItem,
  StudentExamContext,
  StudentExamDeviceState,
  StudentExamSessionState,
  StudentSubmissionDetail,
  StudentSubmissionReview,
  SubmitStudentAnswersInput
} from "../../types/student";

export async function getStudentAssessments(studentId: string) {
  return apiRequest<StudentAssessmentListItem[]>("/student/assessments", {
    method: "GET",
    studentId
  });
}

export async function getAssessmentExamContext(assessmentId: string, studentId: string) {
  return apiRequest<StudentExamContext>(`/student/assessments/${assessmentId}/exam-context`, {
    method: "GET",
    studentId
  });
}

export async function joinExamSession(examSessionId: string, studentId: string) {
  return apiRequest<StudentExamSessionState>(`/student/exam-sessions/${examSessionId}/join`, {
    method: "POST",
    studentId
  });
}

export async function getStudentExamSession(examSessionId: string, studentId: string) {
  return apiRequest<StudentExamSessionState>(`/student/exam-sessions/${examSessionId}`, {
    method: "GET",
    studentId
  });
}

export async function createOrGetStudentDevice(examSessionId: string, studentId: string) {
  return apiRequest<StudentExamDeviceState>(`/student/exam-sessions/${examSessionId}/device`, {
    method: "POST",
    studentId
  });
}

export async function getStudentDevice(examSessionId: string, studentId: string) {
  return apiRequest<StudentExamDeviceState>(`/student/exam-sessions/${examSessionId}/device`, {
    method: "GET",
    studentId
  });
}

export async function createOrReuseSubmission(assessmentId: string, studentId: string) {
  return apiRequest<StudentSubmissionDetail>(`/student/assessments/${assessmentId}/submissions`, {
    method: "POST",
    studentId
  });
}

export async function getStudentSubmission(submissionId: string, studentId: string) {
  return apiRequest<StudentSubmissionDetail>(`/student/submissions/${submissionId}`, {
    method: "GET",
    studentId
  });
}

export async function submitStudentAnswers(
  submissionId: string,
  studentId: string,
  input: SubmitStudentAnswersInput
) {
  return apiRequest<StudentSubmissionDetail>(`/student/submissions/${submissionId}/answers`, {
    method: "POST",
    studentId,
    body: JSON.stringify(input)
  });
}

export async function getStudentSubmissionReview(submissionId: string, studentId: string) {
  return apiRequest<StudentSubmissionReview>(`/student/submissions/${submissionId}/review`, {
    method: "GET",
    studentId
  });
}

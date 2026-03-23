import { apiRequest } from "./client";
import type { TeacherExamSessionDetail } from "../../types/teacher";

const TEACHER_HEADERS = {
  "x-user-role": "TEACHER"
} as const;

export async function createTeacherExamSession(assessmentId: string, teacherId: string) {
  return apiRequest<TeacherExamSessionDetail>(`/teacher/assessments/${assessmentId}/exam-sessions`, {
    method: "POST",
    headers: {
      ...TEACHER_HEADERS,
      "x-user-id": teacherId
    }
  });
}

export async function getTeacherExamSession(examSessionId: string, teacherId: string) {
  return apiRequest<TeacherExamSessionDetail>(`/teacher/exam-sessions/${examSessionId}`, {
    method: "GET",
    headers: {
      ...TEACHER_HEADERS,
      "x-user-id": teacherId
    }
  });
}

export async function startTeacherExamSession(examSessionId: string, teacherId: string) {
  return apiRequest<TeacherExamSessionDetail>(`/teacher/exam-sessions/${examSessionId}/start`, {
    method: "POST",
    headers: {
      ...TEACHER_HEADERS,
      "x-user-id": teacherId
    }
  });
}

export async function endTeacherExamSession(examSessionId: string, teacherId: string) {
  return apiRequest<TeacherExamSessionDetail>(`/teacher/exam-sessions/${examSessionId}/end`, {
    method: "POST",
    headers: {
      ...TEACHER_HEADERS,
      "x-user-id": teacherId
    }
  });
}
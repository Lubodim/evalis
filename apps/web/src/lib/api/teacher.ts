import { apiRequest } from "./client";
import type {
  TeacherAssessmentReviewSettings,
  TeacherAssessmentSubmissionListItem,
  TeacherClassListItem,
  TeacherClassOperationsDetail,
  TeacherExamSessionDetail,
  TeacherExamSessionDevicesDetail,
  TeacherGradeSubmissionInput,
  TeacherStudentOperationsDetail,
  TeacherSubmissionDetail
} from "../../types/teacher";

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

export async function getTeacherClasses(teacherId: string) {
  return apiRequest<TeacherClassListItem[]>("/classes", {
    method: "GET",
    headers: {
      ...TEACHER_HEADERS,
      "x-user-id": teacherId
    }
  });
}

export async function getTeacherClassOperations(classId: string, teacherId: string) {
  return apiRequest<TeacherClassOperationsDetail>(`/teacher/classes/${classId}/operations`, {
    method: "GET",
    headers: {
      ...TEACHER_HEADERS,
      "x-user-id": teacherId
    }
  });
}

export async function getTeacherStudentOperations(
  classId: string,
  studentProfileId: string,
  teacherId: string
) {
  return apiRequest<TeacherStudentOperationsDetail>(
    `/teacher/classes/${classId}/students/${studentProfileId}/operations`,
    {
      method: "GET",
      headers: {
        ...TEACHER_HEADERS,
        "x-user-id": teacherId
      }
    }
  );
}

export async function getCurrentTeacherExamSession(assessmentId: string, teacherId: string) {
  return apiRequest<TeacherExamSessionDetail | null>(
    `/teacher/assessments/${assessmentId}/exam-sessions/current`,
    {
      method: "GET",
      headers: {
        ...TEACHER_HEADERS,
        "x-user-id": teacherId
      }
    }
  );
}

export async function getTeacherAssessmentReviewSettings(assessmentId: string, teacherId: string) {
  return apiRequest<TeacherAssessmentReviewSettings>(
    `/teacher/assessments/${assessmentId}/review-settings`,
    {
      method: "GET",
      headers: {
        ...TEACHER_HEADERS,
        "x-user-id": teacherId
      }
    }
  );
}

export async function updateTeacherAssessmentReviewSettings(
  assessmentId: string,
  teacherId: string,
  reviewMode: TeacherAssessmentReviewSettings["reviewMode"]
) {
  return apiRequest<TeacherAssessmentReviewSettings>(
    `/teacher/assessments/${assessmentId}/review-settings`,
    {
      method: "PATCH",
      headers: {
        ...TEACHER_HEADERS,
        "x-user-id": teacherId
      },
      body: JSON.stringify({ reviewMode })
    }
  );
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

export async function getTeacherExamSessionDevices(examSessionId: string, teacherId: string) {
  return apiRequest<TeacherExamSessionDevicesDetail>(`/teacher/exam-sessions/${examSessionId}/devices`, {
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

export async function approveTeacherExamParticipant(
  examSessionId: string,
  studentProfileId: string,
  teacherId: string
) {
  return apiRequest<TeacherExamSessionDetail>(
    `/teacher/exam-sessions/${examSessionId}/participants/${studentProfileId}/approve`,
    {
      method: "POST",
      headers: {
        ...TEACHER_HEADERS,
        "x-user-id": teacherId
      }
    }
  );
}

export async function approveTeacherExamParticipantDevice(
  examSessionId: string,
  studentProfileId: string,
  teacherId: string
) {
  return apiRequest<TeacherExamSessionDevicesDetail>(
    `/teacher/exam-sessions/${examSessionId}/participants/${studentProfileId}/device/approve`,
    {
      method: "POST",
      headers: {
        ...TEACHER_HEADERS,
        "x-user-id": teacherId
      }
    }
  );
}

export async function getTeacherAssessmentSubmissions(assessmentId: string, teacherId: string) {
  return apiRequest<TeacherAssessmentSubmissionListItem[]>(
    `/teacher/assessments/${assessmentId}/submissions`,
    {
      method: "GET",
      headers: {
        ...TEACHER_HEADERS,
        "x-user-id": teacherId
      }
    }
  );
}

export async function getTeacherSubmission(submissionId: string, teacherId: string) {
  return apiRequest<TeacherSubmissionDetail>(`/teacher/submissions/${submissionId}`, {
    method: "GET",
    headers: {
      ...TEACHER_HEADERS,
      "x-user-id": teacherId
    }
  });
}

export async function gradeTeacherSubmission(
  submissionId: string,
  teacherId: string,
  body: TeacherGradeSubmissionInput
) {
  return apiRequest<TeacherSubmissionDetail>(`/teacher/submissions/${submissionId}/grade`, {
    method: "POST",
    headers: {
      ...TEACHER_HEADERS,
      "x-user-id": teacherId
    },
    body: JSON.stringify(body)
  });
}

export async function finalizeTeacherSubmission(submissionId: string, teacherId: string) {
  return apiRequest<TeacherSubmissionDetail>(`/teacher/submissions/${submissionId}/finalize`, {
    method: "POST",
    headers: {
      ...TEACHER_HEADERS,
      "x-user-id": teacherId
    }
  });
}

export type StudentAssessmentType = "QUIZ" | "ASSIGNMENT" | "TEST";
export type StudentSubmissionStatus = "DRAFT" | "SUBMITTED" | "GRADED";
export type StudentExamSessionStatus = "WAITING" | "ACTIVE" | "ENDED";
export type StudentParticipantStatus = "JOINED" | "APPROVED";
export type StudentDeviceStatus = "PENDING" | "APPROVED";
export type AssessmentReviewMode =
  | "NONE"
  | "SCORE_ONLY"
  | "ANSWERS_NO_EXPLANATIONS"
  | "ANSWERS_WITH_EXPLANATIONS";

export interface StudentSchoolClassSummary {
  id: string;
  name: string;
  subject: string;
  schoolYear: string;
}

export interface StudentTeacherSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export interface StudentQuestionSummary {
  id: string;
  prompt: string;
  type: string;
  maxPoints: number;
  orderIndex: number;
}

export interface StudentSubmissionSummary {
  id: string;
  status: StudentSubmissionStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAssessmentListItem {
  id: string;
  title: string;
  description: string | null;
  type: StudentAssessmentType;
  totalPoints: number;
  publishedAt: string | null;
  dueAt: string | null;
  createdAt: string;
  schoolClass: StudentSchoolClassSummary;
  teacher?: StudentTeacherSummary | null;
  questions?: StudentQuestionSummary[];
  submissions?: StudentSubmissionSummary[];
}

export interface StudentExamContext {
  assessmentId: string;
  hasExamSession: boolean;
  examSessionId: string | null;
  examSessionStatus: Extract<StudentExamSessionStatus, "WAITING" | "ACTIVE"> | null;
  participantStatus: StudentParticipantStatus | null;
  hasDevice: boolean;
  deviceStatus: StudentDeviceStatus | null;
}

export interface StudentExamSessionParticipant {
  id: string;
  status: StudentParticipantStatus;
  joinedAt: string;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  device?: StudentExamSessionDevice | null;
}

export interface StudentExamSessionDevice {
  id: string;
  status: StudentDeviceStatus;
  deviceCode: string;
  joinedAt: string;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentExamSessionState {
  id: string;
  status: StudentExamSessionStatus;
  startsAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assessment: {
    id: string;
    title: string;
    description: string | null;
    type: StudentAssessmentType;
    totalPoints: number;
    publishedAt: string | null;
    dueAt: string | null;
    schoolClass: StudentSchoolClassSummary;
  };
  participant: StudentExamSessionParticipant | null;
}

export interface StudentExamDeviceState {
  examSessionId: string;
  examSessionStatus: StudentExamSessionStatus;
  startsAt: string | null;
  endedAt: string | null;
  assessment: StudentExamSessionState["assessment"];
  participant: StudentExamSessionParticipant | null;
  device: StudentExamSessionDevice | null;
}

export interface StudentSubmissionResult {
  totalScore: number;
  maxScore: number;
  percentage: number | null;
  gradeLabel: string | null;
  publishedAt: string | null;
}

export interface StudentSubmissionAnswer {
  id: string;
  questionId: string;
  answerText: string | null;
  selectedOption: string | null;
  pointsAwarded: number | null;
  teacherFeedback?: string | null;
  createdAt?: string;
  updatedAt: string;
  question?: StudentQuestionSummary;
}

export interface StudentSubmissionDetail {
  id: string;
  status: StudentSubmissionStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assessment: {
    id: string;
    title: string;
    description: string | null;
    type: StudentAssessmentType;
    totalPoints: number;
    publishedAt: string | null;
    dueAt: string | null;
    schoolClass: StudentSchoolClassSummary;
    questions?: StudentQuestionSummary[];
    reviewMode?: AssessmentReviewMode;
    reviewAvailableAt?: string | null;
  };
  answers: StudentSubmissionAnswer[];
  result: StudentSubmissionResult | null;
}

export interface StudentSubmissionReviewAnswer {
  id: string;
  questionId: string;
  answerText: string | null;
  selectedOption: string | null;
  pointsAwarded: number | null;
  updatedAt: string;
  teacherFeedback?: string | null;
  question?: StudentQuestionSummary;
}

export interface StudentSubmissionReview {
  id: string;
  status: StudentSubmissionStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assessment: {
    id: string;
    title: string;
    description: string | null;
    type: StudentAssessmentType;
    totalPoints: number;
    publishedAt: string | null;
    dueAt: string | null;
    reviewMode?: AssessmentReviewMode;
    reviewAvailableAt?: string | null;
    schoolClass: StudentSchoolClassSummary;
  };
  result: StudentSubmissionResult | null;
  answers: StudentSubmissionReviewAnswer[];
}

export interface SubmitStudentAnswersInput {
  answers: Array<{
    questionId: string;
    answerText?: string;
    selectedOption?: string;
  }>;
}

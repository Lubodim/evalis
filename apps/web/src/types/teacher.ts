export type TeacherExamSessionStatus = "WAITING" | "ACTIVE" | "ENDED";
export type TeacherExamSessionParticipantStatus = "JOINED" | "APPROVED";
export type TeacherExamSessionDeviceStatus = "PENDING" | "APPROVED";
export type TeacherSubmissionStatus = "DRAFT" | "SUBMITTED" | "GRADED";
export type TeacherAssessmentType = "QUIZ" | "ASSIGNMENT" | "TEST";
export type TeacherAssessmentReviewMode =
  | "NONE"
  | "SCORE_ONLY"
  | "ANSWERS_NO_EXPLANATIONS"
  | "ANSWERS_WITH_EXPLANATIONS";

export interface TeacherClassListItem {
  id: string;
  name: string;
  subject: string;
  schoolYear: string;
  gradeLevel: number | null;
  classCode: string | null;
  displayLabel: string | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count: {
    enrollments: number;
    assessments: number;
  };
}

export interface TeacherClassSummary {
  id: string;
  name: string;
  subject: string;
  schoolYear: string;
  gradeLevel: number | null;
  classCode: string | null;
  displayLabel: string | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherOperationsStudentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface TeacherClassOperationsStudentSummary {
  studentProfileId: string;
  studentNumber: string | null;
  studentNumberInClass: number | null;
  enrolledAt: string;
  displayIdentifier: string | null;
  user: TeacherOperationsStudentUser;
}

export interface TeacherOperationsAssessmentSummary {
  assessmentId: string;
  title: string;
  type: TeacherAssessmentType;
  totalPoints: number;
  publishedAt: string | null;
  dueAt: string | null;
  reviewMode: TeacherAssessmentReviewMode;
  reviewAvailableAt: string | null;
  createdAt: string;
}

export interface TeacherOperationsResultSummary {
  totalScore: number;
  maxScore: number;
  percentage: number | null;
  gradeLabel: string | null;
  publishedAt: string | null;
}

export interface TeacherClassSubmissionSummary {
  studentProfileId: string;
  assessmentId: string;
  submissionCount: number;
  latestSubmissionStatus: TeacherSubmissionStatus;
  latestSubmittedAt: string | null;
  latestUpdatedAt: string;
  latestResult: TeacherOperationsResultSummary | null;
}

export interface TeacherStudentSubmissionSummary {
  assessmentId: string;
  submissionCount: number;
  latestSubmissionStatus: TeacherSubmissionStatus;
  latestSubmittedAt: string | null;
  latestUpdatedAt: string;
  latestResult: TeacherOperationsResultSummary | null;
}

export interface TeacherClassOperationsDetail {
  class: TeacherClassSummary;
  students: TeacherClassOperationsStudentSummary[];
  assessments: TeacherOperationsAssessmentSummary[];
  submissionSummaries: TeacherClassSubmissionSummary[];
}

export interface TeacherStudentOperationsDetail {
  class: TeacherClassSummary;
  student: TeacherClassOperationsStudentSummary;
  assessments: TeacherOperationsAssessmentSummary[];
  submissionSummaries: TeacherStudentSubmissionSummary[];
}

export interface TeacherExamSessionAssessmentSummary {
  id: string;
  title: string;
  description: string | null;
  type: string;
  totalPoints: number;
  publishedAt: string | null;
  dueAt: string | null;
  schoolClass: {
    id: string;
    name: string;
    subject: string;
    schoolYear: string;
  };
}

export interface TeacherExamSessionParticipantSummary {
  id: string;
  status: TeacherExamSessionParticipantStatus;
  studentProfileId: string;
  joinedAt: string;
  approvedAt: string | null;
}

export interface TeacherExamSessionDetail {
  id: string;
  status: TeacherExamSessionStatus;
  startsAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assessment: TeacherExamSessionAssessmentSummary;
  participants: TeacherExamSessionParticipantSummary[];
}

export interface TeacherExamSessionDeviceSummary {
  id: string;
  status: TeacherExamSessionDeviceStatus;
  deviceCode: string;
  joinedAt: string;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherExamSessionDevicesParticipantSummary {
  id: string;
  status: TeacherExamSessionParticipantStatus;
  joinedAt: string;
  approvedAt: string | null;
  studentProfileId: string;
  device: TeacherExamSessionDeviceSummary | null;
}

export interface TeacherExamSessionDevicesDetail {
  id: string;
  status: TeacherExamSessionStatus;
  startsAt: string | null;
  endedAt: string | null;
  assessment: TeacherExamSessionAssessmentSummary;
  participants: TeacherExamSessionDevicesParticipantSummary[];
}

export interface TeacherAssessmentReviewSettings {
  id: string;
  title: string | null;
  reviewMode: TeacherAssessmentReviewMode;
  reviewAvailableAt: string | null;
  updatedAt: string;
}

export interface TeacherSubmissionStudentUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export interface TeacherSubmissionStudentProfile {
  id: string;
  studentNumber: string | null;
  user: TeacherSubmissionStudentUser;
}

export interface TeacherSubmissionResultSummary {
  totalScore: number;
  maxScore: number;
  percentage: number | null;
  publishedAt: string | null;
  gradeLabel?: string | null;
}

export interface TeacherAssessmentSubmissionListItem {
  id: string;
  status: TeacherSubmissionStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  studentProfile: TeacherSubmissionStudentProfile;
  _count: {
    answers: number;
  };
  result: TeacherSubmissionResultSummary | null;
}

export interface TeacherSubmissionQuestion {
  id: string;
  prompt: string;
  type: string;
  maxPoints: number;
  orderIndex: number;
}

export interface TeacherSubmissionAssessmentDetail {
  id: string;
  title: string | null;
  description: string | null;
  type: string;
  totalPoints: number;
  publishedAt: string | null;
  dueAt: string | null;
  reviewMode?: string;
  reviewAvailableAt?: string | null;
  schoolClass: {
    id: string;
    name: string;
    subject: string;
    schoolYear: string;
  };
  questions: TeacherSubmissionQuestion[];
}

export interface TeacherSubmissionAnswerDetail {
  id: string;
  questionId: string;
  answerText: string | null;
  selectedOption: string | null;
  pointsAwarded: number | null;
  teacherFeedback: string | null;
  createdAt: string;
  updatedAt: string;
  question?: TeacherSubmissionQuestion;
}

export interface TeacherSubmissionDetail {
  id: string;
  status: TeacherSubmissionStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  studentProfile: TeacherSubmissionStudentProfile;
  assessment: TeacherSubmissionAssessmentDetail;
  answers: TeacherSubmissionAnswerDetail[];
  result: (TeacherSubmissionResultSummary & { gradeLabel: string | null }) | null;
}

export interface TeacherGradeSubmissionAnswerInput {
  questionId: string;
  pointsAwarded: number;
  teacherFeedback?: string | null;
}

export interface TeacherGradeSubmissionInput {
  answers: TeacherGradeSubmissionAnswerInput[];
}


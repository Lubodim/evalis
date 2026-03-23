export type TeacherExamSessionStatus = "WAITING" | "ACTIVE" | "ENDED";
export type TeacherExamSessionParticipantStatus = "JOINED" | "APPROVED";
export type TeacherExamSessionDeviceStatus = "PENDING" | "APPROVED";
export type TeacherSubmissionStatus = "DRAFT" | "SUBMITTED" | "GRADED";

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
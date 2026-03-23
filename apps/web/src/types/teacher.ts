export type TeacherExamSessionStatus = "WAITING" | "ACTIVE" | "ENDED";

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
  status: string;
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
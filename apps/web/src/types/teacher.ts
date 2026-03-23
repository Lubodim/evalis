export type TeacherExamSessionStatus = "WAITING" | "ACTIVE" | "ENDED";
export type TeacherExamSessionParticipantStatus = "JOINED" | "APPROVED";
export type TeacherExamSessionDeviceStatus = "PENDING" | "APPROVED";

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
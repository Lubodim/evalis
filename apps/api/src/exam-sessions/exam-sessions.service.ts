import { randomUUID } from "crypto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  ExamSessionDeviceStatus,
  ExamSessionParticipantStatus,
  ExamSessionStatus,
  Prisma
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const examSessionDeviceSelect = Prisma.validator<Prisma.ExamSessionDeviceSelect>()({
  id: true,
  status: true,
  deviceCode: true,
  joinedAt: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true
});

const teacherExamSessionSelect = Prisma.validator<Prisma.ExamSessionSelect>()({
  id: true,
  status: true,
  startsAt: true,
  endedAt: true,
  createdAt: true,
  updatedAt: true,
  assessment: {
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      totalPoints: true,
      publishedAt: true,
      dueAt: true,
      schoolClass: {
        select: {
          id: true,
          name: true,
          subject: true,
          schoolYear: true
        }
      }
    }
  },
  participants: {
    orderBy: {
      joinedAt: "asc"
    },
    select: {
      id: true,
      status: true,
      joinedAt: true,
      approvedAt: true,
      createdAt: true,
      updatedAt: true,
      studentProfileId: true,
      studentProfile: {
        select: {
          id: true,
          studentNumber: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      },
      device: {
        select: examSessionDeviceSelect
      }
    }
  }
});

const studentExamSessionSelect = Prisma.validator<Prisma.ExamSessionSelect>()({
  id: true,
  status: true,
  startsAt: true,
  endedAt: true,
  createdAt: true,
  updatedAt: true,
  assessment: {
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      totalPoints: true,
      publishedAt: true,
      dueAt: true,
      schoolClass: {
        select: {
          id: true,
          name: true,
          subject: true,
          schoolYear: true
        }
      }
    }
  },
  participants: {
    select: {
      id: true,
      status: true,
      joinedAt: true,
      approvedAt: true,
      createdAt: true,
      updatedAt: true,
      studentProfileId: true,
      device: {
        select: examSessionDeviceSelect
      }
    }
  }
});

type StudentExamSessionView = Prisma.ExamSessionGetPayload<{
  select: typeof studentExamSessionSelect;
}>;

type StudentExamSessionParticipantView = StudentExamSessionView["participants"][number];

@Injectable()
export class ExamSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForAssessment(assessmentId: string, teacherId: string) {
    const assessment = await this.ensureTeacherAssessmentExists(assessmentId, teacherId);

    const existingSession = await this.prisma.examSession.findFirst({
      where: {
        assessmentId,
        status: {
          in: [ExamSessionStatus.WAITING, ExamSessionStatus.ACTIVE]
        }
      },
      select: {
        id: true,
        status: true
      }
    });

    if (existingSession) {
      throw new BadRequestException(
        `Assessment ${assessmentId} already has an open exam session in ${existingSession.status} state.`
      );
    }

    const examSession = await this.prisma.examSession.create({
      data: {
        assessmentId: assessment.id,
        teacherId
      },
      select: {
        id: true
      }
    });

    return this.findOneForTeacher(examSession.id, teacherId);
  }

  async findOneForTeacher(examSessionId: string, teacherId: string) {
    const examSession = await this.prisma.examSession.findFirst({
      where: {
        id: examSessionId,
        teacherId
      },
      select: teacherExamSessionSelect
    });

    if (!examSession) {
      throw new NotFoundException(`Exam session ${examSessionId} was not found for this teacher.`);
    }

    return examSession;
  }

  async findDevicesForTeacher(examSessionId: string, teacherId: string) {
    const examSession = await this.findOneForTeacher(examSessionId, teacherId);

    return {
      id: examSession.id,
      status: examSession.status,
      startsAt: examSession.startsAt,
      endedAt: examSession.endedAt,
      assessment: examSession.assessment,
      participants: examSession.participants.map((participant) => ({
        id: participant.id,
        status: participant.status,
        joinedAt: participant.joinedAt,
        approvedAt: participant.approvedAt,
        studentProfileId: participant.studentProfileId,
        studentProfile: participant.studentProfile,
        device: participant.device
      }))
    };
  }

  async approveParticipant(examSessionId: string, studentProfileId: string, teacherId: string) {
    const examSession = await this.prisma.examSession.findFirst({
      where: {
        id: examSessionId,
        teacherId
      },
      select: {
        id: true,
        status: true
      }
    });

    if (!examSession) {
      throw new NotFoundException(`Exam session ${examSessionId} was not found for this teacher.`);
    }

    if (examSession.status !== ExamSessionStatus.WAITING) {
      throw new BadRequestException("Participants can only be approved while the exam session is WAITING.");
    }

    const participant = await this.prisma.examSessionParticipant.findUnique({
      where: {
        examSessionId_studentProfileId: {
          examSessionId,
          studentProfileId
        }
      },
      select: {
        id: true
      }
    });

    if (!participant) {
      throw new NotFoundException(
        `Student ${studentProfileId} has not joined exam session ${examSessionId}.`
      );
    }

    await this.prisma.examSessionParticipant.update({
      where: {
        examSessionId_studentProfileId: {
          examSessionId,
          studentProfileId
        }
      },
      data: {
        status: ExamSessionParticipantStatus.APPROVED,
        approvedAt: new Date()
      }
    });

    return this.findOneForTeacher(examSessionId, teacherId);
  }

  async approveParticipantDevice(examSessionId: string, studentProfileId: string, teacherId: string) {
    const examSession = await this.prisma.examSession.findFirst({
      where: {
        id: examSessionId,
        teacherId
      },
      select: {
        id: true,
        status: true
      }
    });

    if (!examSession) {
      throw new NotFoundException(`Exam session ${examSessionId} was not found for this teacher.`);
    }

    if (examSession.status !== ExamSessionStatus.WAITING) {
      throw new BadRequestException("Devices can only be approved while the exam session is WAITING.");
    }

    const participant = await this.prisma.examSessionParticipant.findUnique({
      where: {
        examSessionId_studentProfileId: {
          examSessionId,
          studentProfileId
        }
      },
      select: {
        id: true
      }
    });

    if (!participant) {
      throw new NotFoundException(
        `Student ${studentProfileId} has not joined exam session ${examSessionId}.`
      );
    }

    const device = await this.prisma.examSessionDevice.findUnique({
      where: {
        examSessionParticipantId: participant.id
      },
      select: {
        id: true
      }
    });

    if (!device) {
      throw new NotFoundException(
        `Student ${studentProfileId} has not registered a device for exam session ${examSessionId}.`
      );
    }

    await this.prisma.examSessionDevice.update({
      where: {
        examSessionParticipantId: participant.id
      },
      data: {
        status: ExamSessionDeviceStatus.APPROVED,
        approvedAt: new Date()
      }
    });

    return this.findDevicesForTeacher(examSessionId, teacherId);
  }

  async start(examSessionId: string, teacherId: string) {
    const examSession = await this.prisma.examSession.findFirst({
      where: {
        id: examSessionId,
        teacherId
      },
      select: {
        id: true,
        status: true
      }
    });

    if (!examSession) {
      throw new NotFoundException(`Exam session ${examSessionId} was not found for this teacher.`);
    }

    if (examSession.status !== ExamSessionStatus.WAITING) {
      throw new BadRequestException("Only WAITING exam sessions can be started.");
    }

    await this.prisma.examSession.update({
      where: {
        id: examSessionId
      },
      data: {
        status: ExamSessionStatus.ACTIVE,
        startsAt: new Date()
      }
    });

    return this.findOneForTeacher(examSessionId, teacherId);
  }

  async end(examSessionId: string, teacherId: string) {
    const examSession = await this.prisma.examSession.findFirst({
      where: {
        id: examSessionId,
        teacherId
      },
      select: {
        id: true,
        status: true
      }
    });

    if (!examSession) {
      throw new NotFoundException(`Exam session ${examSessionId} was not found for this teacher.`);
    }

    if (examSession.status !== ExamSessionStatus.ACTIVE) {
      throw new BadRequestException("Only ACTIVE exam sessions can be ended.");
    }

    await this.prisma.examSession.update({
      where: {
        id: examSessionId
      },
      data: {
        status: ExamSessionStatus.ENDED,
        endedAt: new Date()
      }
    });

    return this.findOneForTeacher(examSessionId, teacherId);
  }

  async join(examSessionId: string, studentIdentity: string) {
    const studentProfile = await this.getStudentProfile(studentIdentity);
    const examSession = await this.findStudentJoinableSession(examSessionId, studentProfile.id);

    const existingParticipant = this.findStudentParticipant(examSession, studentProfile.id);

    if (existingParticipant) {
      return this.buildStudentSessionResponse(examSession, studentProfile.id);
    }

    if (examSession.status !== ExamSessionStatus.WAITING) {
      throw new BadRequestException("This exam session is not open for joining.");
    }

    await this.prisma.examSessionParticipant.create({
      data: {
        examSessionId,
        studentProfileId: studentProfile.id
      }
    });

    return this.findOneForStudent(examSessionId, studentProfile.id);
  }

  async createOrGetDevice(examSessionId: string, studentIdentity: string) {
    const studentProfile = await this.getStudentProfile(studentIdentity);
    let examSession = await this.findStudentJoinableSession(examSessionId, studentProfile.id);
    let participant = this.findStudentParticipant(examSession, studentProfile.id);

    if (!participant) {
      if (examSession.status !== ExamSessionStatus.WAITING) {
        throw new BadRequestException("This exam session is not open for joining.");
      }

      await this.prisma.examSessionParticipant.create({
        data: {
          examSessionId,
          studentProfileId: studentProfile.id
        }
      });

      examSession = await this.findStudentJoinedSession(examSessionId, studentProfile.id);
      participant = this.findStudentParticipant(examSession, studentProfile.id);
    }

    if (!participant) {
      throw new NotFoundException(`Student ${studentProfile.id} could not join exam session ${examSessionId}.`);
    }

    if (participant.device) {
      return this.buildStudentDeviceResponse(examSession, participant);
    }

    if (examSession.status !== ExamSessionStatus.WAITING) {
      throw new BadRequestException("Devices can only be registered while the exam session is WAITING.");
    }

    await this.prisma.examSessionDevice.create({
      data: {
        examSessionParticipantId: participant.id,
        deviceCode: `device-${randomUUID()}`
      }
    });

    return this.findDeviceForStudent(examSessionId, studentProfile.id);
  }

  async findDeviceForStudent(examSessionId: string, studentIdentity: string) {
    const studentProfile = await this.getStudentProfile(studentIdentity);
    const examSession = await this.findStudentJoinedSession(examSessionId, studentProfile.id);
    const participant = this.findStudentParticipant(examSession, studentProfile.id);

    return this.buildStudentDeviceResponse(examSession, participant);
  }

  async findOneForStudent(examSessionId: string, studentIdentity: string) {
    const studentProfile = await this.getStudentProfile(studentIdentity);
    const examSession = await this.findStudentJoinedSession(examSessionId, studentProfile.id);

    return this.buildStudentSessionResponse(examSession, studentProfile.id);
  }

  private buildStudentSessionResponse(
    examSession: StudentExamSessionView,
    studentProfileId: string
  ) {
    const participant = this.findStudentParticipant(examSession, studentProfileId);

    return {
      id: examSession.id,
      status: examSession.status,
      startsAt: examSession.startsAt,
      endedAt: examSession.endedAt,
      createdAt: examSession.createdAt,
      updatedAt: examSession.updatedAt,
      assessment: examSession.assessment,
      participant: participant ? this.buildStudentParticipantResponse(participant) : null
    };
  }

  private buildStudentDeviceResponse(
    examSession: StudentExamSessionView,
    participant: StudentExamSessionParticipantView | null
  ) {
    return {
      examSessionId: examSession.id,
      examSessionStatus: examSession.status,
      startsAt: examSession.startsAt,
      endedAt: examSession.endedAt,
      assessment: examSession.assessment,
      participant: participant ? this.buildStudentParticipantResponse(participant) : null,
      device: participant?.device ?? null
    };
  }

  private buildStudentParticipantResponse(participant: StudentExamSessionParticipantView) {
    return {
      id: participant.id,
      status: participant.status,
      joinedAt: participant.joinedAt,
      approvedAt: participant.approvedAt,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
      device: participant.device
    };
  }

  private findStudentParticipant(
    examSession: StudentExamSessionView,
    studentProfileId: string
  ) {
    return examSession.participants.find((participant) => participant.studentProfileId === studentProfileId) ?? null;
  }

  private async ensureTeacherAssessmentExists(assessmentId: string, teacherId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        teacherId
      },
      select: {
        id: true
      }
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${assessmentId} was not found for this teacher.`);
    }

    return assessment;
  }

  private async getStudentProfile(studentIdentity: string) {
    const studentProfile = await this.prisma.studentProfile.findFirst({
      where: {
        OR: [{ id: studentIdentity }, { userId: studentIdentity }]
      },
      select: {
        id: true,
        userId: true,
        studentNumber: true
      }
    });

    if (!studentProfile) {
      throw new NotFoundException(`Student profile was not found for identifier ${studentIdentity}.`);
    }

    return studentProfile;
  }

  private async findStudentJoinableSession(examSessionId: string, studentProfileId: string) {
    const examSession = await this.findExamSessionById(examSessionId);

    await this.ensureStudentEnrollment(
      examSession.assessment.schoolClass.id,
      examSessionId,
      studentProfileId
    );

    return examSession;
  }

  private async findStudentJoinedSession(examSessionId: string, studentProfileId: string) {
    const examSession = await this.findStudentJoinableSession(examSessionId, studentProfileId);
    const participant = this.findStudentParticipant(examSession, studentProfileId);

    if (!participant) {
      throw new NotFoundException(`Exam session ${examSessionId} was not found for this student.`);
    }

    return examSession;
  }

  private async findExamSessionById(examSessionId: string) {
    const examSession = await this.prisma.examSession.findUnique({
      where: {
        id: examSessionId
      },
      select: studentExamSessionSelect
    });

    if (!examSession) {
      throw new NotFoundException(`Exam session ${examSessionId} was not found.`);
    }

    return examSession;
  }

  private async ensureStudentEnrollment(
    schoolClassId: string,
    examSessionId: string,
    studentProfileId: string
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        schoolClassId_studentProfileId: {
          schoolClassId,
          studentProfileId
        }
      },
      select: {
        id: true
      }
    });

    if (!enrollment) {
      throw new NotFoundException(`Exam session ${examSessionId} was not found for this student.`);
    }
  }
}
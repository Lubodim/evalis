import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  ExamSessionParticipantStatus,
  ExamSessionStatus,
  Prisma
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

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
      studentProfileId: true
    }
  }
});

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
    const examSession = await this.findStudentAccessibleSession(examSessionId, studentProfile.id);

    const existingParticipant = examSession.participants.find(
      (participant) => participant.studentProfileId === studentProfile.id
    );

    if (existingParticipant) {
      return this.findOneForStudent(examSessionId, studentProfile.id);
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

  async findOneForStudent(examSessionId: string, studentIdentity: string) {
    const studentProfile = await this.getStudentProfile(studentIdentity);
    const examSession = await this.findStudentAccessibleSession(examSessionId, studentProfile.id);
    const participant =
      examSession.participants.find((item) => item.studentProfileId === studentProfile.id) ?? null;

    return {
      id: examSession.id,
      status: examSession.status,
      startsAt: examSession.startsAt,
      endedAt: examSession.endedAt,
      createdAt: examSession.createdAt,
      updatedAt: examSession.updatedAt,
      assessment: examSession.assessment,
      participant: participant
        ? {
            id: participant.id,
            status: participant.status,
            joinedAt: participant.joinedAt,
            approvedAt: participant.approvedAt,
            createdAt: participant.createdAt,
            updatedAt: participant.updatedAt
          }
        : null
    };
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

  private async findStudentAccessibleSession(examSessionId: string, studentProfileId: string) {
    const examSession = await this.prisma.examSession.findFirst({
      where: {
        id: examSessionId,
        assessment: {
          schoolClass: {
            enrollments: {
              some: {
                studentProfileId
              }
            }
          }
        }
      },
      select: studentExamSessionSelect
    });

    if (!examSession) {
      throw new NotFoundException(`Exam session ${examSessionId} was not found for this student.`);
    }

    return examSession;
  }
}

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AssessmentReviewMode, AssessmentType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAssessmentDto } from "./dto/create-assessment.dto";
import { UpdateAssessmentReviewSettingsDto } from "./dto/update-assessment-review-settings.dto";

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForClass(classId: string, teacherId: string) {
    await this.ensureTeacherClassExists(classId, teacherId);

    return this.prisma.assessment.findMany({
      where: {
        schoolClassId: classId,
        teacherId
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        totalPoints: true,
        publishedAt: true,
        dueAt: true,
        createdAt: true,
        schoolClass: {
          select: {
            id: true,
            name: true,
            subject: true,
            schoolYear: true
          }
        },
        _count: {
          select: {
            questions: true,
            submissions: true
          }
        }
      }
    });
  }

  async createForClass(classId: string, teacherId: string, body: CreateAssessmentDto) {
    const schoolClass = await this.ensureTeacherClassExists(classId, teacherId);

    const title = body.title?.trim();

    if (!title) {
      throw new BadRequestException("Assessment title is required.");
    }

    if (!body.type || !Object.values(AssessmentType).includes(body.type)) {
      throw new BadRequestException("Assessment type must be QUIZ, ASSIGNMENT, or TEST.");
    }

    if (typeof body.totalPoints !== "number" || Number.isNaN(body.totalPoints) || body.totalPoints <= 0) {
      throw new BadRequestException("totalPoints must be a positive number.");
    }

    const dueAt = this.parseOptionalDate(body.dueAt, "dueAt");
    const publishedAt = this.parseOptionalDate(body.publishedAt, "publishedAt");
    const teachingAssignmentId = await this.resolveTeachingAssignmentId(
      classId,
      teacherId,
      schoolClass.subject
    );

    return this.prisma.assessment.create({
      data: {
        schoolClassId: classId,
        teacherId,
        teachingAssignmentId,
        title,
        description: body.description?.trim() || null,
        type: body.type,
        totalPoints: body.totalPoints,
        dueAt,
        publishedAt
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        totalPoints: true,
        publishedAt: true,
        dueAt: true,
        createdAt: true,
        schoolClass: {
          select: {
            id: true,
            name: true,
            subject: true,
            schoolYear: true
          }
        }
      }
    });
  }

  async getReviewSettings(assessmentId: string, teacherId: string) {
    await this.ensureTeacherAssessmentExists(assessmentId, teacherId);

    return this.prisma.assessment.findUnique({
      where: {
        id: assessmentId
      },
      select: {
        id: true,
        title: true,
        reviewMode: true,
        reviewAvailableAt: true,
        updatedAt: true
      }
    });
  }

  async updateReviewSettings(
    assessmentId: string,
    teacherId: string,
    body: UpdateAssessmentReviewSettingsDto
  ) {
    await this.ensureTeacherAssessmentExists(assessmentId, teacherId);

    if (body.reviewMode === undefined && body.reviewAvailableAt === undefined) {
      throw new BadRequestException("At least one review setting must be provided.");
    }

    if (
      body.reviewMode !== undefined &&
      !Object.values(AssessmentReviewMode).includes(body.reviewMode)
    ) {
      throw new BadRequestException("reviewMode is invalid.");
    }

    const reviewAvailableAt = this.parseReviewAvailableAt(body.reviewAvailableAt);

    return this.prisma.assessment.update({
      where: {
        id: assessmentId
      },
      data: {
        reviewMode: body.reviewMode,
        reviewAvailableAt
      },
      select: {
        id: true,
        title: true,
        reviewMode: true,
        reviewAvailableAt: true,
        updatedAt: true
      }
    });
  }

  private async ensureTeacherClassExists(classId: string, teacherId: string) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: {
        id: classId
      },
      select: {
        id: true,
        teacherId: true,
        subject: true
      }
    });

    if (!schoolClass || schoolClass.teacherId !== teacherId) {
      throw new NotFoundException(`Class ${classId} was not found for this teacher.`);
    }

    return schoolClass;
  }

  private async ensureTeacherAssessmentExists(assessmentId: string, teacherId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        OR: [
          {
            teachingAssignment: {
              is: {
                teacherUserId: teacherId
              }
            }
          },
          {
            teachingAssignmentId: null,
            teacherId
          }
        ]
      },
      select: {
        id: true
      }
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${assessmentId} was not found for this teacher.`);
    }
  }

  private async resolveTeachingAssignmentId(
    classId: string,
    teacherId: string,
    subjectName: string
  ) {
    const teachingAssignment = await this.prisma.teachingAssignment.findFirst({
      where: {
        schoolClassId: classId,
        teacherUserId: teacherId,
        subject: {
          name: subjectName
        }
      },
      select: {
        id: true
      }
    });

    if (!teachingAssignment) {
      throw new NotFoundException(`Teaching assignment for class ${classId} was not found for this teacher.`);
    }

    return teachingAssignment.id;
  }

  private parseOptionalDate(value: string | undefined, fieldName: string) {
    if (!value) {
      return null;
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid date string.`);
    }

    return parsedDate;
  }

  private parseReviewAvailableAt(value: string | null | undefined) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException("reviewAvailableAt must be a valid date string or null.");
    }

    return parsedDate;
  }
}
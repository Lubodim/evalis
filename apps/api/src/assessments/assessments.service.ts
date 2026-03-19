import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AssessmentType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAssessmentDto } from "./dto/create-assessment.dto";

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
    await this.ensureTeacherClassExists(classId, teacherId);

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

    return this.prisma.assessment.create({
      data: {
        schoolClassId: classId,
        teacherId,
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

  private async ensureTeacherClassExists(classId: string, teacherId: string) {
    const schoolClass = await this.prisma.schoolClass.findFirst({
      where: {
        id: classId,
        teacherId
      },
      select: {
        id: true
      }
    });

    if (!schoolClass) {
      throw new NotFoundException(`Class ${classId} was not found for this teacher.`);
    }
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
}

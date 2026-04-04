import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTeachingAssignmentDto } from "./dto/create-teaching-assignment.dto";

const teacherSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isActive: true,
  role: true
} satisfies Prisma.UserSelect;

const teachingAssignmentSelect = {
  id: true,
  schoolClassId: true,
  teacherUserId: true,
  teacher: {
    select: teacherSelect
  },
  subject: {
    select: {
      id: true,
      name: true
    }
  }
} satisfies Prisma.TeachingAssignmentSelect;

@Injectable()
export class TeachingAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(classId: string, body: CreateTeachingAssignmentDto) {
    const normalizedClassId = this.parseRequiredId(classId, "classId");
    const teacherUserId = this.parseRequiredId(body.teacherUserId, "teacherUserId");

    const schoolClass = await this.ensureClassExists(normalizedClassId);
    const subject = await this.resolveSubjectForClass(schoolClass.subject, normalizedClassId);
    await this.ensureTeacherUserExists(teacherUserId);

    try {
      const assignment = await this.prisma.teachingAssignment.create({
        data: {
          schoolClassId: normalizedClassId,
          teacherUserId,
          subjectId: subject.id
        },
        select: teachingAssignmentSelect
      });

      return this.serializeAssignment(assignment);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException(
          `Teaching assignment for class ${normalizedClassId}, subject ${subject.id}, and teacher ${teacherUserId} already exists.`
        );
      }

      throw error;
    }
  }

  async findForClass(classId: string) {
    const normalizedClassId = this.parseRequiredId(classId, "classId");

    await this.ensureClassExists(normalizedClassId);

    const assignments = await this.prisma.teachingAssignment.findMany({
      where: {
        schoolClassId: normalizedClassId
      },
      orderBy: [
        {
          subject: {
            name: "asc"
          }
        },
        {
          teacher: {
            firstName: "asc"
          }
        },
        {
          teacher: {
            lastName: "asc"
          }
        },
        {
          createdAt: "asc"
        }
      ],
      select: teachingAssignmentSelect
    });

    return assignments.map((assignment) => this.serializeAssignment(assignment));
  }

  async remove(classId: string, assignmentId: string) {
    const normalizedClassId = this.parseRequiredId(classId, "classId");
    const normalizedAssignmentId = this.parseRequiredId(assignmentId, "assignmentId");

    await this.ensureClassExists(normalizedClassId);

    const assignment = await this.prisma.teachingAssignment.findFirst({
      where: {
        id: normalizedAssignmentId,
        schoolClassId: normalizedClassId
      },
      select: {
        id: true
      }
    });

    if (!assignment) {
      throw new NotFoundException(
        `Teaching assignment ${normalizedAssignmentId} was not found for class ${normalizedClassId}.`
      );
    }

    await this.prisma.teachingAssignment.delete({
      where: {
        id: normalizedAssignmentId
      }
    });
  }

  private serializeAssignment(assignment: Prisma.TeachingAssignmentGetPayload<{ select: typeof teachingAssignmentSelect }>) {
    const { role: _, ...teacher } = assignment.teacher;

    return {
      assignmentId: assignment.id,
      teacherUserId: assignment.teacherUserId,
      teacher,
      classId: assignment.schoolClassId,
      subject: assignment.subject
    };
  }

  private parseRequiredId(
    value: string | undefined,
    fieldName: "classId" | "teacherUserId" | "assignmentId"
  ) {
    const normalizedValue = value?.trim();

    if (!normalizedValue) {
      throw new BadRequestException(`${fieldName} is required.`);
    }

    return normalizedValue;
  }

  private async ensureClassExists(classId: string) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: {
        id: classId
      },
      select: {
        id: true,
        subject: true
      }
    });

    if (!schoolClass) {
      throw new NotFoundException(`Class ${classId} was not found.`);
    }

    return schoolClass;
  }

  private async resolveSubjectForClass(subjectName: string, classId: string) {
    const normalizedSubjectName = subjectName.trim();

    if (!normalizedSubjectName) {
      throw new NotFoundException(`Subject could not be derived for class ${classId}.`);
    }

    const subject = await this.prisma.subject.findUnique({
      where: {
        name: normalizedSubjectName
      },
      select: {
        id: true,
        name: true
      }
    });

    if (!subject) {
      throw new NotFoundException(
        `Subject could not be resolved for class ${classId} from SchoolClass.subject '${normalizedSubjectName}'.`
      );
    }

    return subject;
  }

  private async ensureTeacherUserExists(teacherUserId: string) {
    const teacher = await this.prisma.user.findUnique({
      where: {
        id: teacherUserId
      },
      select: teacherSelect
    });

    if (!teacher || teacher.role !== UserRole.TEACHER) {
      throw new NotFoundException(`Teacher user ${teacherUserId} was not found.`);
    }

    return teacher;
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateParentStudentLinkDto } from "./dto/create-parent-student-link.dto";

const parentListSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isActive: true,
  role: true
} satisfies Prisma.UserSelect;

@Injectable()
export class ParentStudentLinksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(studentProfileId: string, body: CreateParentStudentLinkDto) {
    const normalizedStudentProfileId = this.parseRequiredId(studentProfileId, "studentProfileId");
    const parentUserId = this.parseRequiredId(body.parentUserId, "parentUserId");

    await this.ensureStudentExists(normalizedStudentProfileId);
    const parent = await this.ensureParentUserExists(parentUserId);

    try {
      await this.prisma.parentStudentLink.create({
        data: {
          parentUserId,
          studentProfileId: normalizedStudentProfileId
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException(
          `Parent user ${parentUserId} is already linked to student ${normalizedStudentProfileId}.`
        );
      }

      throw error;
    }

    const { role: _, ...parentData } = parent;
    return parentData;
  }

  async findParentsForStudent(studentProfileId: string) {
    const normalizedStudentProfileId = this.parseRequiredId(studentProfileId, "studentProfileId");

    await this.ensureStudentExists(normalizedStudentProfileId);

    const links = await this.prisma.parentStudentLink.findMany({
      where: {
        studentProfileId: normalizedStudentProfileId
      },
      orderBy: [
        {
          parent: {
            firstName: "asc"
          }
        },
        {
          parent: {
            lastName: "asc"
          }
        },
        {
          createdAt: "asc"
        }
      ],
      select: {
        parent: {
          select: parentListSelect
        }
      }
    });

    return links.map(({ parent }) => {
      const { role: _, ...parentData } = parent;
      return parentData;
    });
  }

  async remove(studentProfileId: string, parentUserId: string) {
    const normalizedStudentProfileId = this.parseRequiredId(studentProfileId, "studentProfileId");
    const normalizedParentUserId = this.parseRequiredId(parentUserId, "parentUserId");

    await this.ensureStudentExists(normalizedStudentProfileId);
    await this.ensureParentUserExists(normalizedParentUserId);

    const link = await this.prisma.parentStudentLink.findUnique({
      where: {
        parentUserId_studentProfileId: {
          parentUserId: normalizedParentUserId,
          studentProfileId: normalizedStudentProfileId
        }
      },
      select: {
        id: true
      }
    });

    if (!link) {
      throw new NotFoundException(
        `Parent user ${normalizedParentUserId} is not linked to student ${normalizedStudentProfileId}.`
      );
    }

    await this.prisma.parentStudentLink.delete({
      where: {
        parentUserId_studentProfileId: {
          parentUserId: normalizedParentUserId,
          studentProfileId: normalizedStudentProfileId
        }
      }
    });
  }

  private parseRequiredId(value: string | undefined, fieldName: "studentProfileId" | "parentUserId") {
    const normalizedValue = value?.trim();

    if (!normalizedValue) {
      throw new BadRequestException(`${fieldName} is required.`);
    }

    return normalizedValue;
  }

  private async ensureStudentExists(studentProfileId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: {
        id: studentProfileId
      },
      select: {
        id: true
      }
    });

    if (!student) {
      throw new NotFoundException(`Student profile ${studentProfileId} was not found.`);
    }
  }

  private async ensureParentUserExists(parentUserId: string) {
    const parent = await this.prisma.user.findUnique({
      where: {
        id: parentUserId
      },
      select: parentListSelect
    });

    if (!parent || parent.role !== UserRole.PARENT) {
      throw new NotFoundException(`Parent user ${parentUserId} was not found.`);
    }

    return parent;
  }
}

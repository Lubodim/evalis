import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateClassDto } from "./dto/create-class.dto";
import { UpdateClassDto } from "./dto/update-class.dto";

type RequestUser = {
  role: UserRole;
  userId: string | null;
};

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateClassDto) {
    const name = body.name?.trim();
    const subject = body.subject?.trim();
    const schoolYear = body.schoolYear?.trim();
    const teacherId = body.teacherId?.trim();
    const description = this.normalizeOptionalDescription(body.description);

    if (!name) {
      throw new BadRequestException("Class name is required.");
    }

    if (!subject) {
      throw new BadRequestException("Class subject is required.");
    }

    if (!schoolYear) {
      throw new BadRequestException("Class schoolYear is required.");
    }

    if (!teacherId) {
      throw new BadRequestException("teacherId is required.");
    }

    await this.ensureTeacherUserExists(teacherId);

    try {
      return this.prisma.schoolClass.create({
        data: {
          name,
          subject,
          schoolYear,
          description,
          teacher: {
            connect: {
              id: teacherId
            }
          }
        },
        select: {
          id: true,
          name: true,
          subject: true,
          schoolYear: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          enrollments: {
            select: {
              id: true,
              enrolledAt: true,
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
          },
          assessments: {
            select: {
              id: true,
              title: true,
              type: true,
              totalPoints: true,
              dueAt: true,
              publishedAt: true
            },
            orderBy: {
              createdAt: "desc"
            }
          }
        }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2025" || error.code === "P2003")
      ) {
        throw new BadRequestException(`Teacher ${teacherId} was not found.`);
      }

      throw error;
    }
  }

  async findAllForUser(currentUser: RequestUser) {
    const where =
      currentUser.role === UserRole.SCHOOL_ADMIN
        ? {}
        : {
            teacherId: currentUser.userId ?? undefined
          };

    return this.prisma.schoolClass.findMany({
      where,
      orderBy: [{ schoolYear: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        subject: true,
        schoolYear: true,
        description: true,
        createdAt: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            assessments: true
          }
        }
      }
    });
  }

  async findOneForUser(id: string, currentUser: RequestUser) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        subject: true,
        schoolYear: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        teacherId: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        enrollments: {
          select: {
            id: true,
            enrolledAt: true,
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
        },
        assessments: {
          select: {
            id: true,
            title: true,
            type: true,
            totalPoints: true,
            dueAt: true,
            publishedAt: true
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    if (!schoolClass) {
      return null;
    }

    if (currentUser.role === UserRole.TEACHER && schoolClass.teacherId !== currentUser.userId) {
      return null;
    }

    const { teacherId: _, ...classData } = schoolClass;
    return classData;
  }

  async update(id: string, body: UpdateClassDto) {
    const existingClass = await this.prisma.schoolClass.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existingClass) {
      throw new NotFoundException(`Class ${id} was not found.`);
    }

    const data = this.buildUpdateData(body);

    if (Object.keys(data).length === 0) {
      throw new BadRequestException("At least one class field must be provided.");
    }

    return this.prisma.schoolClass.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        subject: true,
        schoolYear: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        enrollments: {
          select: {
            id: true,
            enrolledAt: true,
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
        },
        assessments: {
          select: {
            id: true,
            title: true,
            type: true,
            totalPoints: true,
            dueAt: true,
            publishedAt: true
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });
  }

  private buildUpdateData(body: UpdateClassDto) {
    const data: {
      name?: string;
      subject?: string;
      schoolYear?: string;
      description?: string | null;
    } = {};

    if (body.name !== undefined) {
      const name = body.name.trim();

      if (!name) {
        throw new BadRequestException("Class name cannot be empty.");
      }

      data.name = name;
    }

    if (body.subject !== undefined) {
      const subject = body.subject.trim();

      if (!subject) {
        throw new BadRequestException("Class subject cannot be empty.");
      }

      data.subject = subject;
    }

    if (body.schoolYear !== undefined) {
      const schoolYear = body.schoolYear.trim();

      if (!schoolYear) {
        throw new BadRequestException("Class schoolYear cannot be empty.");
      }

      data.schoolYear = schoolYear;
    }

    if (body.description !== undefined) {
      data.description = this.normalizeOptionalDescription(body.description);
    }

    return data;
  }

  private normalizeOptionalDescription(value: string | null | undefined) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const normalizedValue = value.trim();
    return normalizedValue ? normalizedValue : null;
  }

  private async ensureTeacherUserExists(teacherId: string) {
    const teacherUser = await this.prisma.user.findUnique({
      where: {
        id: teacherId
      },
      select: {
        id: true,
        role: true
      }
    });

    if (!teacherUser) {
      throw new BadRequestException(`Teacher ${teacherId} was not found.`);
    }

    if (teacherUser.role !== UserRole.TEACHER) {
      throw new BadRequestException(`User ${teacherId} is not a teacher.`);
    }
  }
}


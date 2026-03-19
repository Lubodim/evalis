import { Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type RequestUser = {
  role: UserRole;
  userId: string | null;
};

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(currentUser: RequestUser) {
    const where =
      currentUser.role === UserRole.SCHOOL_ADMIN
        ? {}
        : {
            teacherId: currentUser.userId ?? undefined
          };

    return this.prisma.schoolClass.findMany({
      where,
      orderBy: [
        { schoolYear: "desc" },
        { name: "asc" }
      ],
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
    const where =
      currentUser.role === UserRole.SCHOOL_ADMIN
        ? { id }
        : {
            id,
            teacherId: currentUser.userId ?? undefined
          };

    return this.prisma.schoolClass.findFirst({
      where,
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
}

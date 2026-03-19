import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        studentProfile: {
          select: {
            id: true,
            studentNumber: true
          }
        }
      }
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        studentProfile: {
          select: {
            id: true,
            studentNumber: true,
            dateOfBirth: true
          }
        },
        taughtClasses: {
          select: {
            id: true,
            name: true,
            subject: true,
            schoolYear: true
          }
        },
        createdAssessments: {
          select: {
            id: true,
            title: true,
            type: true,
            totalPoints: true,
            schoolClassId: true
          }
        }
      }
    });
  }
}

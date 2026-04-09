import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  AssessmentReviewMode,
  AssessmentType,
  Prisma,
  SubmissionStatus,
  UserRole
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AssignStudentToClassDto } from "./dto/assign-student-to-class.dto";
import { CreateClassDto } from "./dto/create-class.dto";
import { MoveStudentToClassDto } from "./dto/move-student-to-class.dto";
import { UpdateClassDto } from "./dto/update-class.dto";
import { UpdateClassEnrollmentDto } from "./dto/update-class-enrollment.dto";

type RequestUser = {
  role: UserRole;
  userId: string | null;
};

type ClassWithDisplayLabelFields = {
  gradeLevel: number | null;
  classCode: string | null;
};

type EnrollmentWithStudentNumberField = {
  studentNumberInClass: number | null;
};

type TeacherOwnedAssessmentSummary = {
  id: string;
  title: string;
  type: AssessmentType;
  totalPoints: number;
  publishedAt: Date | null;
  dueAt: Date | null;
  reviewMode: AssessmentReviewMode;
  reviewAvailableAt: Date | null;
  createdAt: Date;
};

type SubmissionSummaryRecord = {
  id: string;
  assessmentId: string;
  studentProfileId: string;
  status: SubmissionStatus;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  result: {
    totalScore: number;
    maxScore: number;
    percentage: number | null;
    gradeLabel: string | null;
    publishedAt: Date | null;
  } | null;
};

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateClassDto) {
    const name = body.name?.trim();
    const subject = body.subject?.trim();
    const schoolYear = body.schoolYear?.trim();
    const teacherId = body.teacherId?.trim();
    const gradeLevel = this.parseRequiredGradeLevel(body.gradeLevel);
    const classCode = this.parseRequiredClassCode(body.classCode);
    const isActive = this.parseOptionalIsActive(body.isActive) ?? true;
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
      const schoolClass = await this.prisma.schoolClass.create({
        data: {
          name,
          subject,
          schoolYear,
          gradeLevel,
          classCode,
          isActive,
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
          gradeLevel: true,
          classCode: true,
          isActive: true,
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
              studentNumberInClass: true,
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

      return this.attachEnrollmentDisplayIdentifiersToClass(schoolClass);
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
      currentUser.role === UserRole.SCHOOL_ADMIN || currentUser.role === UserRole.SUPER_ADMIN
        ? {}
        : {
            OR: [
              {
                teacherId: currentUser.userId ?? undefined
              },
              {
                teachingAssignments: {
                  some: {
                    teacherUserId: currentUser.userId ?? undefined
                  }
                }
              }
            ]
          };

    const classes = await this.prisma.schoolClass.findMany({
      where,
      orderBy: [{ schoolYear: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        subject: true,
        schoolYear: true,
        gradeLevel: true,
        classCode: true,
        isActive: true,
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

    return classes.map((schoolClass) => this.attachDisplayLabel(schoolClass));
  }

  async findOneForUser(id: string, currentUser: RequestUser) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        subject: true,
        schoolYear: true,
        gradeLevel: true,
        classCode: true,
        isActive: true,
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
        ...(currentUser.role === UserRole.TEACHER
          ? {
              teachingAssignments: {
                where: {
                  teacherUserId: currentUser.userId ?? undefined
                },
                select: {
                  id: true
                }
              }
            }
          : {}),
        enrollments: {
          select: {
            id: true,
            enrolledAt: true,
            studentNumberInClass: true,
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
          ...(currentUser.role === UserRole.TEACHER
            ? {
                where: this.buildTeacherOwnedAssessmentWhere(currentUser.userId ?? "")
              }
            : {}),
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

    if (currentUser.role === UserRole.TEACHER) {
      const hasLegacyAccess = schoolClass.teacherId === currentUser.userId;
      const hasTeachingAssignmentAccess = schoolClass.teachingAssignments.length > 0;

      if (!hasLegacyAccess && !hasTeachingAssignmentAccess) {
        return null;
      }
    }

    const { teacherId: _, teachingAssignments: __, ...classData } = schoolClass;
    return this.attachEnrollmentDisplayIdentifiersToClass(classData);
  }

  async findOperationsForTeacher(id: string, teacherId: string) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        name: true,
        subject: true,
        schoolYear: true,
        gradeLevel: true,
        classCode: true,
        isActive: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        teacherId: true,
        teachingAssignments: {
          where: {
            teacherUserId: teacherId
          },
          select: {
            id: true
          }
        },
        enrollments: {
          orderBy: [{ studentNumberInClass: "asc" }, { enrolledAt: "asc" }],
          select: {
            id: true,
            enrolledAt: true,
            studentNumberInClass: true,
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
          where: this.buildTeacherOwnedAssessmentWhere(teacherId),
          orderBy: {
            createdAt: "desc"
          },
          select: {
            id: true,
            title: true,
            type: true,
            totalPoints: true,
            publishedAt: true,
            dueAt: true,
            reviewMode: true,
            reviewAvailableAt: true,
            createdAt: true
          }
        }
      }
    });

    if (!schoolClass) {
      return null;
    }

    const hasLegacyAccess = schoolClass.teacherId === teacherId;
    const hasTeachingAssignmentAccess = schoolClass.teachingAssignments.length > 0;

    if (!hasLegacyAccess && !hasTeachingAssignmentAccess) {
      return null;
    }

    const studentProfileIds = schoolClass.enrollments.map((enrollment) => enrollment.studentProfile.id);
    const assessmentIds = schoolClass.assessments.map((assessment) => assessment.id);

    const submissions: SubmissionSummaryRecord[] =
      studentProfileIds.length > 0 && assessmentIds.length > 0
        ? await this.prisma.submission.findMany({
            where: {
              assessmentId: {
                in: assessmentIds
              },
              studentProfileId: {
                in: studentProfileIds
              },
              assessment: this.buildTeacherOwnedAssessmentWhere(teacherId)
            },
            orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
            select: {
              id: true,
              assessmentId: true,
              studentProfileId: true,
              status: true,
              submittedAt: true,
              createdAt: true,
              updatedAt: true,
              result: {
                select: {
                  totalScore: true,
                  maxScore: true,
                  percentage: true,
                  gradeLabel: true,
                  publishedAt: true
                }
              }
            }
          })
        : [];

    const { teacherId: _, teachingAssignments: __, ...classData } = schoolClass;

    return {
      class: this.attachDisplayLabel(classData),
      students: schoolClass.enrollments.map((enrollment) => ({
        studentProfileId: enrollment.studentProfile.id,
        studentNumber: enrollment.studentProfile.studentNumber,
        studentNumberInClass: enrollment.studentNumberInClass,
        enrolledAt: enrollment.enrolledAt,
        displayIdentifier: this.buildEnrollmentDisplayIdentifier(
          schoolClass.gradeLevel,
          schoolClass.classCode,
          enrollment.studentNumberInClass
        ),
        user: enrollment.studentProfile.user
      })),
      assessments: schoolClass.assessments.map((assessment) =>
        this.serializeTeacherOwnedAssessment(assessment)
      ),
      submissionSummaries: this.buildSubmissionSummaries(submissions)
    };
  }

  async findStudentOperationsForTeacher(
    classId: string,
    studentProfileId: string,
    teacherId: string
  ) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: {
        id: classId
      },
      select: {
        id: true,
        name: true,
        subject: true,
        schoolYear: true,
        gradeLevel: true,
        classCode: true,
        isActive: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        teacherId: true,
        teachingAssignments: {
          where: {
            teacherUserId: teacherId
          },
          select: {
            id: true
          }
        },
        enrollments: {
          where: {
            studentProfileId
          },
          select: {
            id: true,
            enrolledAt: true,
            studentNumberInClass: true,
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
          where: this.buildTeacherOwnedAssessmentWhere(teacherId),
          orderBy: {
            createdAt: "desc"
          },
          select: {
            id: true,
            title: true,
            type: true,
            totalPoints: true,
            publishedAt: true,
            dueAt: true,
            reviewMode: true,
            reviewAvailableAt: true,
            createdAt: true
          }
        }
      }
    });

    if (!schoolClass) {
      throw new NotFoundException(`Class ${classId} was not found for this teacher.`);
    }

    const hasLegacyAccess = schoolClass.teacherId === teacherId;
    const hasTeachingAssignmentAccess = schoolClass.teachingAssignments.length > 0;

    if (!hasLegacyAccess && !hasTeachingAssignmentAccess) {
      throw new NotFoundException(`Class ${classId} was not found for this teacher.`);
    }

    const enrollment = schoolClass.enrollments[0];

    if (!enrollment) {
      throw new NotFoundException(
        `Student profile ${studentProfileId} was not found in class ${classId}.`
      );
    }

    const assessmentIds = schoolClass.assessments.map((assessment) => assessment.id);
    const submissions: SubmissionSummaryRecord[] =
      assessmentIds.length > 0
        ? await this.prisma.submission.findMany({
            where: {
              assessmentId: {
                in: assessmentIds
              },
              studentProfileId,
              assessment: this.buildTeacherOwnedAssessmentWhere(teacherId)
            },
            orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
            select: {
              id: true,
              assessmentId: true,
              studentProfileId: true,
              status: true,
              submittedAt: true,
              createdAt: true,
              updatedAt: true,
              result: {
                select: {
                  totalScore: true,
                  maxScore: true,
                  percentage: true,
                  gradeLabel: true,
                  publishedAt: true
                }
              }
            }
          })
        : [];

    const { teacherId: _, teachingAssignments: __, enrollments: ___, ...classData } = schoolClass;

    return {
      class: this.attachDisplayLabel(classData),
      student: {
        studentProfileId: enrollment.studentProfile.id,
        studentNumber: enrollment.studentProfile.studentNumber,
        studentNumberInClass: enrollment.studentNumberInClass,
        enrolledAt: enrollment.enrolledAt,
        displayIdentifier: this.buildEnrollmentDisplayIdentifier(
          schoolClass.gradeLevel,
          schoolClass.classCode,
          enrollment.studentNumberInClass
        ),
        user: enrollment.studentProfile.user
      },
      assessments: schoolClass.assessments.map((assessment) =>
        this.serializeTeacherOwnedAssessment(assessment)
      ),
      submissionSummaries: this.buildStudentSubmissionSummaries(submissions)
    };
  }

  async findStudentMemberships(studentProfileId: string) {
    const normalizedStudentProfileId = this.parseRequiredStudentProfileId(studentProfileId);

    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: {
        id: normalizedStudentProfileId
      },
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
        },
        enrollments: {
          orderBy: {
            enrolledAt: "desc"
          },
          select: {
            id: true,
            enrolledAt: true,
            studentNumberInClass: true,
            schoolClass: {
              select: {
                id: true,
                name: true,
                subject: true,
                schoolYear: true,
                gradeLevel: true,
                classCode: true,
                isActive: true
              }
            }
          }
        }
      }
    });

    if (!studentProfile) {
      throw new NotFoundException(`Student profile ${normalizedStudentProfileId} was not found.`);
    }

    return {
      id: studentProfile.id,
      studentNumber: studentProfile.studentNumber,
      user: studentProfile.user,
      memberships: studentProfile.enrollments.map((enrollment) => ({
        id: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        studentNumberInClass: enrollment.studentNumberInClass,
        displayIdentifier: this.buildEnrollmentDisplayIdentifier(
          enrollment.schoolClass.gradeLevel,
          enrollment.schoolClass.classCode,
          enrollment.studentNumberInClass
        ),
        schoolClass: this.attachDisplayLabel(enrollment.schoolClass)
      }))
    };
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

    const schoolClass = await this.prisma.schoolClass.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        subject: true,
        schoolYear: true,
        gradeLevel: true,
        classCode: true,
        isActive: true,
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
            studentNumberInClass: true,
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

    return this.attachEnrollmentDisplayIdentifiersToClass(schoolClass);
  }

  async assignStudentToClass(id: string, body: AssignStudentToClassDto) {
    const schoolClass = await this.getClassForEnrollmentDisplay(id);
    const studentProfileId = this.parseRequiredStudentProfileId(body.studentProfileId);
    const studentNumberInClass = this.parseRequiredStudentNumberInClass(body.studentNumberInClass);

    await this.ensureStudentProfileExists(studentProfileId);

    try {
      const enrollment = await this.prisma.enrollment.create({
        data: {
          schoolClassId: id,
          studentProfileId,
          studentNumberInClass
        },
        select: {
          id: true,
          enrolledAt: true,
          studentNumberInClass: true,
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
      });

      return this.attachEnrollmentDisplayIdentifier(
        enrollment,
        schoolClass.gradeLevel,
        schoolClass.classCode
      );
    } catch (error) {
      this.handleEnrollmentWriteError(error, studentProfileId, studentNumberInClass);
    }
  }

  async moveStudentToClass(id: string, body: MoveStudentToClassDto) {
    const targetClass = await this.getClassForEnrollmentDisplay(id);
    const studentProfileId = this.parseRequiredStudentProfileId(body.studentProfileId);
    const fromClassId = this.parseRequiredClassId(body.fromClassId, "fromClassId");
    const studentNumberInClass = this.parseRequiredStudentNumberInClass(body.studentNumberInClass);

    if (fromClassId === id) {
      throw new BadRequestException("fromClassId must be different from the target class id.");
    }

    await this.ensureStudentProfileExists(studentProfileId);

    const sourceEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        schoolClassId_studentProfileId: {
          schoolClassId: fromClassId,
          studentProfileId
        }
      },
      select: {
        id: true
      }
    });

    if (!sourceEnrollment) {
      throw new NotFoundException(
        `Student profile ${studentProfileId} is not enrolled in class ${fromClassId}.`
      );
    }

    try {
      const enrollment = await this.prisma.$transaction(async (tx) => {
        const createdEnrollment = await tx.enrollment.create({
          data: {
            schoolClassId: id,
            studentProfileId,
            studentNumberInClass
          },
          select: {
            id: true,
            enrolledAt: true,
            studentNumberInClass: true,
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
        });

        await tx.enrollment.delete({
          where: {
            id: sourceEnrollment.id
          }
        });

        return createdEnrollment;
      });

      return {
        studentProfileId,
        fromClassId,
        toClassId: id,
        enrollment: this.attachEnrollmentDisplayIdentifier(
          enrollment,
          targetClass.gradeLevel,
          targetClass.classCode
        )
      };
    } catch (error) {
      this.handleEnrollmentWriteError(error, studentProfileId, studentNumberInClass);
    }
  }

  async updateEnrollmentStudentNumber(
    id: string,
    enrollmentId: string,
    body: UpdateClassEnrollmentDto
  ) {
    const schoolClass = await this.getClassForEnrollmentDisplay(id);
    const studentNumberInClass = this.parseRequiredStudentNumberInClass(body.studentNumberInClass);

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        schoolClassId: id
      },
      select: {
        id: true,
        studentProfileId: true
      }
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment ${enrollmentId} was not found in class ${id}.`);
    }

    try {
      const updatedEnrollment = await this.prisma.enrollment.update({
        where: {
          id: enrollmentId
        },
        data: {
          studentNumberInClass
        },
        select: {
          id: true,
          enrolledAt: true,
          studentNumberInClass: true,
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
      });

      return this.attachEnrollmentDisplayIdentifier(
        updatedEnrollment,
        schoolClass.gradeLevel,
        schoolClass.classCode
      );
    } catch (error) {
      this.handleEnrollmentWriteError(error, enrollment.studentProfileId, studentNumberInClass);
    }
  }

  private buildUpdateData(body: UpdateClassDto) {
    const data: {
      name?: string;
      subject?: string;
      schoolYear?: string;
      gradeLevel?: number;
      classCode?: string;
      isActive?: boolean;
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

    if (body.gradeLevel !== undefined) {
      data.gradeLevel = this.parseRequiredGradeLevel(body.gradeLevel);
    }

    if (body.classCode !== undefined) {
      data.classCode = this.parseRequiredClassCode(body.classCode);
    }

    if (body.isActive !== undefined) {
      data.isActive = this.parseOptionalIsActive(body.isActive);
    }

    if (body.description !== undefined) {
      data.description = this.normalizeOptionalDescription(body.description);
    }

    return data;
  }

  private attachDisplayLabel<T extends ClassWithDisplayLabelFields>(schoolClass: T) {
    return {
      ...schoolClass,
      displayLabel: this.buildDisplayLabel(schoolClass.gradeLevel, schoolClass.classCode)
    };
  }

  private attachEnrollmentDisplayIdentifiersToClass<
    T extends ClassWithDisplayLabelFields & { enrollments: EnrollmentWithStudentNumberField[] }
  >(schoolClass: T) {
    return {
      ...this.attachDisplayLabel(schoolClass),
      enrollments: schoolClass.enrollments.map((enrollment) =>
        this.attachEnrollmentDisplayIdentifier(
          enrollment,
          schoolClass.gradeLevel,
          schoolClass.classCode
        )
      )
    };
  }

  private attachEnrollmentDisplayIdentifier<T extends EnrollmentWithStudentNumberField>(
    enrollment: T,
    gradeLevel: number | null,
    classCode: string | null
  ) {
    return {
      ...enrollment,
      displayIdentifier: this.buildEnrollmentDisplayIdentifier(
        gradeLevel,
        classCode,
        enrollment.studentNumberInClass
      )
    };
  }

  private buildDisplayLabel(gradeLevel: number | null, classCode: string | null) {
    if (gradeLevel === null || !classCode) {
      return null;
    }

    return `${gradeLevel}-${classCode}`;
  }

  private buildEnrollmentDisplayIdentifier(
    gradeLevel: number | null,
    classCode: string | null,
    studentNumberInClass: number | null
  ) {
    if (gradeLevel === null || !classCode || studentNumberInClass === null) {
      return null;
    }

    return `${gradeLevel}-${classCode}-${studentNumberInClass.toString().padStart(2, "0")}`;
  }

  private parseRequiredGradeLevel(value: number | undefined) {
    if (value === undefined) {
      throw new BadRequestException("gradeLevel is required.");
    }

    if (!Number.isInteger(value) || value < 1 || value > 12) {
      throw new BadRequestException("gradeLevel must be an integer between 1 and 12.");
    }

    return value;
  }

  private parseRequiredClassCode(value: string | undefined) {
    const classCode = value?.trim();

    if (!classCode) {
      throw new BadRequestException("classCode is required.");
    }

    return classCode;
  }

  private parseOptionalIsActive(value: boolean | undefined) {
    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== "boolean") {
      throw new BadRequestException("isActive must be a boolean.");
    }

    return value;
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

  private parseRequiredStudentProfileId(value: string | undefined) {
    const studentProfileId = value?.trim();

    if (!studentProfileId) {
      throw new BadRequestException("studentProfileId is required.");
    }

    return studentProfileId;
  }

  private parseRequiredClassId(value: string | undefined, fieldName: "fromClassId") {
    const classId = value?.trim();

    if (!classId) {
      throw new BadRequestException(`${fieldName} is required.`);
    }

    return classId;
  }

  private parseRequiredStudentNumberInClass(value: number | undefined) {
    if (value === undefined) {
      throw new BadRequestException("studentNumberInClass is required.");
    }

    if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
      throw new BadRequestException("studentNumberInClass must be a positive integer.");
    }

    return value;
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

  private async ensureStudentProfileExists(studentProfileId: string) {
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: {
        id: studentProfileId
      },
      select: {
        id: true
      }
    });

    if (!studentProfile) {
      throw new BadRequestException(`Student profile ${studentProfileId} was not found.`);
    }
  }

  private async getClassForEnrollmentDisplay(id: string) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        gradeLevel: true,
        classCode: true
      }
    });

    if (!schoolClass) {
      throw new NotFoundException(`Class ${id} was not found.`);
    }

    return schoolClass;
  }

  private handleEnrollmentWriteError(
    error: unknown,
    studentProfileId: string,
    studentNumberInClass: number
  ): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = Array.isArray(error.meta?.target)
          ? error.meta.target
          : typeof error.meta?.target === "string"
            ? [error.meta.target]
            : [];

        if (
          target.some((value) => value.includes("schoolClassId")) &&
          target.some((value) => value.includes("studentNumberInClass"))
        ) {
          throw new ConflictException(
            `studentNumberInClass ${studentNumberInClass} is already assigned in this class.`
          );
        }

        if (
          target.some((value) => value.includes("schoolClassId")) &&
          target.some((value) => value.includes("studentProfileId"))
        ) {
          throw new ConflictException(
            `Student profile ${studentProfileId} is already enrolled in this class.`
          );
        }
      }
    }

    throw error;
  }

  private buildTeacherOwnedAssessmentWhere(teacherId: string): Prisma.AssessmentWhereInput {
    return {
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
    };
  }

  private serializeTeacherOwnedAssessment(assessment: TeacherOwnedAssessmentSummary) {
    return {
      assessmentId: assessment.id,
      title: assessment.title,
      type: assessment.type,
      totalPoints: assessment.totalPoints,
      publishedAt: assessment.publishedAt,
      dueAt: assessment.dueAt,
      reviewMode: assessment.reviewMode,
      reviewAvailableAt: assessment.reviewAvailableAt,
      createdAt: assessment.createdAt
    };
  }

  private buildSubmissionSummaries(submissions: SubmissionSummaryRecord[]) {
    const groupedSubmissions = new Map<string, SubmissionSummaryRecord[]>();

    for (const submission of submissions) {
      const key = `${submission.studentProfileId}:${submission.assessmentId}`;
      const existingSubmissions = groupedSubmissions.get(key);

      if (existingSubmissions) {
        existingSubmissions.push(submission);
        continue;
      }

      groupedSubmissions.set(key, [submission]);
    }

    return Array.from(groupedSubmissions.values()).map((submissionGroup) => {
      const [latestSubmission] = submissionGroup;

      return {
        studentProfileId: latestSubmission.studentProfileId,
        assessmentId: latestSubmission.assessmentId,
        submissionCount: submissionGroup.length,
        latestSubmissionStatus: latestSubmission.status,
        latestSubmittedAt: latestSubmission.submittedAt,
        latestUpdatedAt: latestSubmission.updatedAt,
        latestResult: latestSubmission.result
          ? {
              totalScore: latestSubmission.result.totalScore,
              maxScore: latestSubmission.result.maxScore,
              percentage: latestSubmission.result.percentage,
              gradeLabel: latestSubmission.result.gradeLabel,
              publishedAt: latestSubmission.result.publishedAt
            }
          : null
      };
    });
  }

  private buildStudentSubmissionSummaries(submissions: SubmissionSummaryRecord[]) {
    const groupedSubmissions = new Map<string, SubmissionSummaryRecord[]>();

    for (const submission of submissions) {
      const existingSubmissions = groupedSubmissions.get(submission.assessmentId);

      if (existingSubmissions) {
        existingSubmissions.push(submission);
        continue;
      }

      groupedSubmissions.set(submission.assessmentId, [submission]);
    }

    return Array.from(groupedSubmissions.entries()).map(([assessmentId, submissionGroup]) => {
      const [latestSubmission] = submissionGroup;

      return {
        assessmentId,
        submissionCount: submissionGroup.length,
        latestSubmissionStatus: latestSubmission.status,
        latestSubmittedAt: latestSubmission.submittedAt,
        latestUpdatedAt: latestSubmission.updatedAt,
        latestResult: latestSubmission.result
          ? {
              totalScore: latestSubmission.result.totalScore,
              maxScore: latestSubmission.result.maxScore,
              percentage: latestSubmission.result.percentage,
              gradeLabel: latestSubmission.result.gradeLabel,
              publishedAt: latestSubmission.result.publishedAt
            }
          : null
      };
    });
  }
}


import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { SubmissionStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SubmitAnswersDto } from "./dto/submit-answers.dto";

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAssignedAssessments(studentIdentity: string) {
    const studentProfile = await this.getStudentProfile(studentIdentity);

    return this.prisma.assessment.findMany({
      where: {
        schoolClass: {
          enrollments: {
            some: {
              studentProfileId: studentProfile.id
            }
          }
        }
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
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
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        questions: {
          select: {
            id: true,
            prompt: true,
            type: true,
            maxPoints: true,
            orderIndex: true
          },
          orderBy: {
            orderIndex: "asc"
          }
        },
        submissions: {
          where: {
            studentProfileId: studentProfile.id
          },
          select: {
            id: true,
            status: true,
            submittedAt: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });
  }

  async createForAssessment(assessmentId: string, studentIdentity: string) {
    const studentProfile = await this.getStudentProfile(studentIdentity);
    await this.ensureAssessmentIsAssigned(assessmentId, studentProfile.id);

    return this.prisma.submission.upsert({
      where: {
        assessmentId_studentProfileId: {
          assessmentId,
          studentProfileId: studentProfile.id
        }
      },
      update: {},
      create: {
        assessmentId,
        studentProfileId: studentProfile.id
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
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
            },
            questions: {
              select: {
                id: true,
                prompt: true,
                type: true,
                maxPoints: true,
                orderIndex: true
              },
              orderBy: {
                orderIndex: "asc"
              }
            }
          }
        },
        answers: {
          select: {
            id: true,
            questionId: true,
            answerText: true,
            selectedOption: true,
            updatedAt: true
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });
  }

  async findSubmission(submissionId: string, studentIdentity: string) {
    const studentProfile = await this.getStudentProfile(studentIdentity);

    const submission = await this.prisma.submission.findFirst({
      where: {
        id: submissionId,
        studentProfileId: studentProfile.id
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
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
            },
            questions: {
              select: {
                id: true,
                prompt: true,
                type: true,
                maxPoints: true,
                orderIndex: true
              },
              orderBy: {
                orderIndex: "asc"
              }
            }
          }
        },
        answers: {
          select: {
            id: true,
            questionId: true,
            answerText: true,
            selectedOption: true,
            pointsAwarded: true,
            teacherFeedback: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    if (!submission) {
      throw new NotFoundException(`Submission ${submissionId} was not found for this student.`);
    }

    return submission;
  }

  async submitAnswers(submissionId: string, studentIdentity: string, body: SubmitAnswersDto) {
    const studentProfile = await this.getStudentProfile(studentIdentity);
    const answers = body.answers ?? [];

    if (answers.length === 0) {
      throw new BadRequestException("At least one answer is required.");
    }

    const submission = await this.prisma.submission.findFirst({
      where: {
        id: submissionId,
        studentProfileId: studentProfile.id
      },
      select: {
        id: true,
        status: true,
        assessment: {
          select: {
            questions: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    if (!submission) {
      throw new NotFoundException(`Submission ${submissionId} was not found for this student.`);
    }

    if (submission.status !== SubmissionStatus.DRAFT) {
      throw new BadRequestException(`Submission ${submissionId} is no longer editable.`);
    }

    const validQuestionIds = new Set(submission.assessment.questions.map((question) => question.id));

    for (const answer of answers) {
      if (!answer.questionId?.trim()) {
        throw new BadRequestException("Each answer must include questionId.");
      }

      const normalizedQuestionId = answer.questionId.trim();
      const normalizedAnswerText = answer.answerText?.trim() || null;
      const normalizedSelectedOption = answer.selectedOption?.trim() || null;

      if (!validQuestionIds.has(normalizedQuestionId)) {
        throw new BadRequestException(`Question ${normalizedQuestionId} does not belong to this assessment.`);
      }

      if (!normalizedAnswerText && !normalizedSelectedOption) {
        throw new BadRequestException(
          `Answer for question ${normalizedQuestionId} must include answerText or selectedOption.`
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      for (const answer of answers) {
        const questionId = answer.questionId.trim();

        await tx.submissionAnswer.upsert({
          where: {
            submissionId_questionId: {
              submissionId,
              questionId
            }
          },
          update: {
            answerText: answer.answerText?.trim() || null,
            selectedOption: answer.selectedOption?.trim() || null
          },
          create: {
            submissionId,
            questionId,
            answerText: answer.answerText?.trim() || null,
            selectedOption: answer.selectedOption?.trim() || null
          }
        });
      }

      await tx.submission.update({
        where: {
          id: submissionId
        },
        data: {
          status: SubmissionStatus.SUBMITTED,
          submittedAt: new Date()
        }
      });
    });

    return this.findSubmission(submissionId, studentProfile.id);
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

  private async ensureAssessmentIsAssigned(assessmentId: string, studentProfileId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        schoolClass: {
          enrollments: {
            some: {
              studentProfileId
            }
          }
        }
      },
      select: {
        id: true
      }
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${assessmentId} was not found for this student.`);
    }
  }
}

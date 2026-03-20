import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, SubmissionStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { GradeSubmissionDto } from "./dto/grade-submission.dto";
import { SubmitAnswersDto } from "./dto/submit-answers.dto";

type NormalizedSubmissionAnswer = {
  questionId: string;
  answerText: string | null;
  selectedOption: string | null;
};

type NormalizedGradeAnswer = {
  questionId: string;
  pointsAwarded: number;
  teacherFeedback: string | null;
};

const submissionDetailSelect = Prisma.validator<Prisma.SubmissionSelect>()({
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
  },
  result: {
    select: {
      totalScore: true,
      maxScore: true,
      percentage: true,
      gradeLabel: true,
      publishedAt: true
    }
  }
});

const teacherSubmissionDetailSelect = Prisma.validator<Prisma.SubmissionSelect>()({
  id: true,
  status: true,
  submittedAt: true,
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
  },
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
      updatedAt: true,
      question: {
        select: {
          prompt: true,
          type: true,
          maxPoints: true,
          orderIndex: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  },
  result: {
    select: {
      totalScore: true,
      maxScore: true,
      percentage: true,
      gradeLabel: true,
      publishedAt: true
    }
  }
});

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
      select: submissionDetailSelect
    });
  }

  async findSubmission(submissionId: string, studentIdentity: string) {
    const studentProfile = await this.getStudentProfile(studentIdentity);

    const submission = await this.prisma.submission.findFirst({
      where: {
        id: submissionId,
        studentProfileId: studentProfile.id
      },
      select: submissionDetailSelect
    });

    if (!submission) {
      throw new NotFoundException(`Submission ${submissionId} was not found for this student.`);
    }

    return submission;
  }

  async submitAnswers(submissionId: string, studentIdentity: string, body: SubmitAnswersDto) {
    const studentProfile = await this.getStudentProfile(studentIdentity);

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
    const normalizedAnswers = this.normalizeSubmissionAnswers(body.answers ?? [], validQuestionIds);

    await this.prisma.$transaction(async (tx) => {
      for (const answer of normalizedAnswers) {
        await tx.submissionAnswer.upsert({
          where: {
            submissionId_questionId: {
              submissionId,
              questionId: answer.questionId
            }
          },
          update: {
            answerText: answer.answerText,
            selectedOption: answer.selectedOption
          },
          create: {
            submissionId,
            questionId: answer.questionId,
            answerText: answer.answerText,
            selectedOption: answer.selectedOption
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

  async findSubmissionsForAssessment(assessmentId: string, teacherId: string) {
    await this.ensureTeacherAssessmentExists(assessmentId, teacherId);

    return this.prisma.submission.findMany({
      where: {
        assessmentId,
        status: {
          in: [SubmissionStatus.SUBMITTED, SubmissionStatus.GRADED]
        },
        assessment: {
          teacherId
        }
      },
      orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        status: true,
        submittedAt: true,
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
        },
        _count: {
          select: {
            answers: true
          }
        },
        result: {
          select: {
            totalScore: true,
            maxScore: true,
            percentage: true,
            publishedAt: true
          }
        }
      }
    });
  }

  async findSubmissionForTeacher(submissionId: string, teacherId: string) {
    const submission = await this.prisma.submission.findFirst({
      where: {
        id: submissionId,
        status: {
          in: [SubmissionStatus.SUBMITTED, SubmissionStatus.GRADED]
        },
        assessment: {
          teacherId
        }
      },
      select: teacherSubmissionDetailSelect
    });

    if (!submission) {
      throw new NotFoundException(`Submission ${submissionId} was not found for this teacher.`);
    }

    return submission;
  }

  async gradeSubmission(submissionId: string, teacherId: string, body: GradeSubmissionDto) {
    const submission = await this.prisma.submission.findFirst({
      where: {
        id: submissionId,
        assessment: {
          teacherId
        }
      },
      select: {
        id: true,
        status: true,
        assessment: {
          select: {
            questions: {
              select: {
                id: true,
                maxPoints: true
              }
            }
          }
        }
      }
    });

    if (!submission) {
      throw new NotFoundException(`Submission ${submissionId} was not found for this teacher.`);
    }

    if (submission.status !== SubmissionStatus.SUBMITTED) {
      throw new BadRequestException("Only SUBMITTED submissions can be graded.");
    }

    const questionMaxPoints = new Map(
      submission.assessment.questions.map((question) => [question.id, question.maxPoints])
    );
    const normalizedGrades = this.normalizeGradeAnswers(body.answers ?? [], questionMaxPoints);

    await this.prisma.$transaction(async (tx) => {
      for (const answer of normalizedGrades) {
        await tx.submissionAnswer.upsert({
          where: {
            submissionId_questionId: {
              submissionId,
              questionId: answer.questionId
            }
          },
          update: {
            pointsAwarded: answer.pointsAwarded,
            teacherFeedback: answer.teacherFeedback
          },
          create: {
            submissionId,
            questionId: answer.questionId,
            pointsAwarded: answer.pointsAwarded,
            teacherFeedback: answer.teacherFeedback
          }
        });
      }
    });

    return this.findSubmissionForTeacher(submissionId, teacherId);
  }

  async finalizeSubmission(submissionId: string, teacherId: string) {
    const submission = await this.prisma.submission.findFirst({
      where: {
        id: submissionId,
        assessment: {
          teacherId
        }
      },
      select: {
        id: true,
        assessmentId: true,
        studentProfileId: true,
        status: true,
        assessment: {
          select: {
            questions: {
              select: {
                id: true,
                maxPoints: true
              }
            }
          }
        },
        answers: {
          select: {
            questionId: true,
            pointsAwarded: true
          }
        }
      }
    });

    if (!submission) {
      throw new NotFoundException(`Submission ${submissionId} was not found for this teacher.`);
    }

    if (submission.status !== SubmissionStatus.SUBMITTED) {
      throw new BadRequestException("Only SUBMITTED submissions can be finalized.");
    }

    const questionMaxPoints = new Map(
      submission.assessment.questions.map((question) => [question.id, question.maxPoints])
    );
    const maxScore = submission.assessment.questions.reduce((total, question) => total + question.maxPoints, 0);
    const totalScore = submission.answers.reduce((total, answer) => total + (answer.pointsAwarded ?? 0), 0);
    const percentage = maxScore > 0 ? Number(((totalScore / maxScore) * 100).toFixed(2)) : null;

    for (const answer of submission.answers) {
      const maxPoints = questionMaxPoints.get(answer.questionId);

      if (maxPoints !== undefined && answer.pointsAwarded !== null && answer.pointsAwarded > maxPoints) {
        throw new BadRequestException(
          `Stored points for question ${answer.questionId} exceed the maximum allowed.`
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.submission.update({
        where: {
          id: submissionId
        },
        data: {
          status: SubmissionStatus.GRADED
        }
      });

      await tx.result.upsert({
        where: {
          submissionId
        },
        update: {
          totalScore,
          maxScore,
          percentage,
          publishedAt: new Date(),
          gradeLabel: null
        },
        create: {
          submissionId,
          assessmentId: submission.assessmentId,
          studentProfileId: submission.studentProfileId,
          totalScore,
          maxScore,
          percentage,
          gradeLabel: null,
          publishedAt: new Date()
        }
      });
    });

    return this.findSubmissionForTeacher(submissionId, teacherId);
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
  }

  private normalizeSubmissionAnswers(
    answers: SubmitAnswersDto["answers"],
    validQuestionIds: Set<string>
  ): NormalizedSubmissionAnswer[] {
    const providedAnswers = answers ?? [];

    if (providedAnswers.length === 0) {
      throw new BadRequestException("At least one answer is required.");
    }

    return providedAnswers.map((answer) => {
      const questionId = answer.questionId.trim();
      const answerText = answer.answerText?.trim() || null;
      const selectedOption = answer.selectedOption?.trim() || null;

      if (!questionId) {
        throw new BadRequestException("Each answer must include questionId.");
      }

      if (!validQuestionIds.has(questionId)) {
        throw new BadRequestException(`Question ${questionId} does not belong to this assessment.`);
      }

      if (!answerText && !selectedOption) {
        throw new BadRequestException(`Answer for question ${questionId} must include answerText or selectedOption.`);
      }

      return {
        questionId,
        answerText,
        selectedOption
      };
    });
  }

  private normalizeGradeAnswers(
    answers: GradeSubmissionDto["answers"],
    questionMaxPoints: Map<string, number>
  ): NormalizedGradeAnswer[] {
    const providedAnswers = answers ?? [];

    if (providedAnswers.length === 0) {
      throw new BadRequestException("At least one graded answer is required.");
    }

    return providedAnswers.map((answer) => {
      const questionId = answer.questionId?.trim() || "";

      if (!questionId) {
        throw new BadRequestException("Each graded answer must include questionId.");
      }

      if (typeof answer.pointsAwarded !== "number" || !Number.isInteger(answer.pointsAwarded)) {
        throw new BadRequestException(`pointsAwarded must be an integer for question ${questionId}.`);
      }

      const maxPoints = questionMaxPoints.get(questionId);

      if (maxPoints === undefined) {
        throw new BadRequestException(`Question ${questionId} does not belong to this submission.`);
      }

      if (answer.pointsAwarded < 0) {
        throw new BadRequestException(`pointsAwarded cannot be negative for question ${questionId}.`);
      }

      if (answer.pointsAwarded > maxPoints) {
        throw new BadRequestException(`pointsAwarded cannot exceed ${maxPoints} for question ${questionId}.`);
      }

      return {
        questionId,
        pointsAwarded: answer.pointsAwarded,
        teacherFeedback: answer.teacherFeedback?.trim() || null
      };
    });
  }
}

import { BadRequestException, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { ExamSessionsService } from "./exam-sessions.service";

type StudentRequestIdentity = {
  studentId: string;
};

@Controller("student")
export class StudentExamSessionsController {
  constructor(private readonly examSessionsService: ExamSessionsService) {}

  @Post("exam-sessions/:examSessionId/join")
  async join(
    @Param("examSessionId") examSessionId: string,
    @Headers("x-student-id") studentIdHeader?: string
  ) {
    const currentStudent = this.getStudentIdentity(studentIdHeader);
    return this.examSessionsService.join(examSessionId, currentStudent.studentId);
  }

  @Get("exam-sessions/:examSessionId")
  async findOne(
    @Param("examSessionId") examSessionId: string,
    @Headers("x-student-id") studentIdHeader?: string
  ) {
    const currentStudent = this.getStudentIdentity(studentIdHeader);
    return this.examSessionsService.findOneForStudent(examSessionId, currentStudent.studentId);
  }

  private getStudentIdentity(studentIdHeader?: string): StudentRequestIdentity {
    if (!studentIdHeader) {
      throw new BadRequestException("Missing x-student-id header.");
    }

    const normalizedStudentId = studentIdHeader.trim();

    if (!normalizedStudentId) {
      throw new BadRequestException("Missing x-student-id header.");
    }

    return {
      studentId: normalizedStudentId
    };
  }
}

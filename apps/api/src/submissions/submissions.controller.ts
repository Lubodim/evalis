import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post
} from "@nestjs/common";
import { SubmitAnswersDto } from "./dto/submit-answers.dto";
import { SubmissionsService } from "./submissions.service";

type StudentRequestIdentity = {
  studentId: string;
};

@Controller("student")
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get("assessments")
  async findAssignedAssessments(@Headers("x-student-id") studentIdHeader?: string) {
    const currentStudent = this.getStudentIdentity(studentIdHeader);
    return this.submissionsService.findAssignedAssessments(currentStudent.studentId);
  }

  @Post("assessments/:assessmentId/submissions")
  async createForAssessment(
    @Param("assessmentId") assessmentId: string,
    @Headers("x-student-id") studentIdHeader?: string
  ) {
    const currentStudent = this.getStudentIdentity(studentIdHeader);
    return this.submissionsService.createForAssessment(assessmentId, currentStudent.studentId);
  }

  @Get("submissions/:submissionId")
  async findOneSubmission(
    @Param("submissionId") submissionId: string,
    @Headers("x-student-id") studentIdHeader?: string
  ) {
    const currentStudent = this.getStudentIdentity(studentIdHeader);
    return this.submissionsService.findSubmission(submissionId, currentStudent.studentId);
  }

  @Get("submissions/:submissionId/review")
  async findOneSubmissionReview(
    @Param("submissionId") submissionId: string,
    @Headers("x-student-id") studentIdHeader?: string
  ) {
    const currentStudent = this.getStudentIdentity(studentIdHeader);
    return this.submissionsService.findSubmissionReviewForStudent(submissionId, currentStudent.studentId);
  }

  @Post("submissions/:submissionId/answers")
  async submitAnswers(
    @Param("submissionId") submissionId: string,
    @Body() body: SubmitAnswersDto,
    @Headers("x-student-id") studentIdHeader?: string
  ) {
    const currentStudent = this.getStudentIdentity(studentIdHeader);
    return this.submissionsService.submitAnswers(submissionId, currentStudent.studentId, body);
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

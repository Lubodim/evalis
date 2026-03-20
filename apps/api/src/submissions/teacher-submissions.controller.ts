import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { GradeSubmissionDto } from "./dto/grade-submission.dto";
import { SubmissionsService } from "./submissions.service";

type TeacherRequestUser = {
  role: typeof UserRole.TEACHER;
  userId: string;
};

@Controller("teacher")
export class TeacherSubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get("assessments/:assessmentId/submissions")
  async findSubmissionsForAssessment(
    @Param("assessmentId") assessmentId: string,
    @Headers("x-user-role") roleHeader?: string,
    @Headers("x-user-id") userIdHeader?: string
  ) {
    const currentUser = this.getTeacherUser(roleHeader, userIdHeader);
    return this.submissionsService.findSubmissionsForAssessment(assessmentId, currentUser.userId);
  }

  @Get("submissions/:submissionId")
  async findSubmissionForReview(
    @Param("submissionId") submissionId: string,
    @Headers("x-user-role") roleHeader?: string,
    @Headers("x-user-id") userIdHeader?: string
  ) {
    const currentUser = this.getTeacherUser(roleHeader, userIdHeader);
    return this.submissionsService.findSubmissionForTeacher(submissionId, currentUser.userId);
  }

  @Post("submissions/:submissionId/grade")
  async gradeSubmission(
    @Param("submissionId") submissionId: string,
    @Body() body: GradeSubmissionDto,
    @Headers("x-user-role") roleHeader?: string,
    @Headers("x-user-id") userIdHeader?: string
  ) {
    const currentUser = this.getTeacherUser(roleHeader, userIdHeader);
    return this.submissionsService.gradeSubmission(submissionId, currentUser.userId, body);
  }

  @Post("submissions/:submissionId/finalize")
  async finalizeSubmission(
    @Param("submissionId") submissionId: string,
    @Headers("x-user-role") roleHeader?: string,
    @Headers("x-user-id") userIdHeader?: string
  ) {
    const currentUser = this.getTeacherUser(roleHeader, userIdHeader);
    return this.submissionsService.finalizeSubmission(submissionId, currentUser.userId);
  }

  private getTeacherUser(roleHeader?: string, userIdHeader?: string): TeacherRequestUser {
    if (!roleHeader) {
      throw new BadRequestException("Missing x-user-role header.");
    }

    if (!userIdHeader) {
      throw new BadRequestException("Missing x-user-id header.");
    }

    const normalizedRole = roleHeader.trim().toUpperCase();
    const normalizedUserId = userIdHeader.trim();

    if (!normalizedUserId) {
      throw new BadRequestException("Missing x-user-id header.");
    }

    if (normalizedRole !== UserRole.TEACHER) {
      throw new BadRequestException("Only TEACHER requests are supported for this endpoint.");
    }

    return {
      role: UserRole.TEACHER,
      userId: normalizedUserId
    };
  }
}

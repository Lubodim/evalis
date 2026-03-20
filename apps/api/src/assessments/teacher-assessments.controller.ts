import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Param,
  Patch
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { UpdateAssessmentReviewSettingsDto } from "./dto/update-assessment-review-settings.dto";
import { AssessmentsService } from "./assessments.service";

type TeacherRequestUser = {
  role: typeof UserRole.TEACHER;
  userId: string;
};

@Controller("teacher")
export class TeacherAssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Patch("assessments/:assessmentId/review-settings")
  async updateReviewSettings(
    @Param("assessmentId") assessmentId: string,
    @Body() body: UpdateAssessmentReviewSettingsDto,
    @Headers("x-user-role") roleHeader?: string,
    @Headers("x-user-id") userIdHeader?: string
  ) {
    const currentUser = this.getTeacherUser(roleHeader, userIdHeader);
    return this.assessmentsService.updateReviewSettings(assessmentId, currentUser.userId, body);
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

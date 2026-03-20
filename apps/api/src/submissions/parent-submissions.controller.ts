import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { SubmissionsService } from "./submissions.service";

type ParentRequestUser = {
  role: typeof UserRole.PARENT;
  userId: string;
};

@Controller("parent")
export class ParentSubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get("students/:studentProfileId/submissions/:submissionId/review")
  async findSubmissionReview(
    @Param("studentProfileId") studentProfileId: string,
    @Param("submissionId") submissionId: string,
    @Headers("x-user-role") roleHeader?: string,
    @Headers("x-user-id") userIdHeader?: string
  ) {
    const currentUser = this.getParentUser(roleHeader, userIdHeader);
    return this.submissionsService.findSubmissionReviewForParent(
      submissionId,
      studentProfileId,
      currentUser.userId
    );
  }

  private getParentUser(roleHeader?: string, userIdHeader?: string): ParentRequestUser {
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

    if (normalizedRole !== UserRole.PARENT) {
      throw new BadRequestException("Only PARENT requests are supported for this endpoint.");
    }

    return {
      role: UserRole.PARENT,
      userId: normalizedUserId
    };
  }
}

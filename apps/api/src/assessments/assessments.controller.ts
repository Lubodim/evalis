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
import { CreateAssessmentDto } from "./dto/create-assessment.dto";
import { AssessmentsService } from "./assessments.service";

type TeacherRequestUser = {
  role: typeof UserRole.TEACHER;
  userId: string;
};

@Controller("assessments")
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Get("class/:classId")
  async findAllForClass(
    @Param("classId") classId: string,
    @Headers("x-user-role") roleHeader?: string,
    @Headers("x-user-id") userIdHeader?: string
  ) {
    const currentUser = this.getTeacherUser(roleHeader, userIdHeader);
    return this.assessmentsService.findAllForClass(classId, currentUser.userId);
  }

  @Post("class/:classId")
  async createForClass(
    @Param("classId") classId: string,
    @Body() body: CreateAssessmentDto,
    @Headers("x-user-role") roleHeader?: string,
    @Headers("x-user-id") userIdHeader?: string
  ) {
    const currentUser = this.getTeacherUser(roleHeader, userIdHeader);
    return this.assessmentsService.createForClass(classId, currentUser.userId, body);
  }

  private getTeacherUser(roleHeader?: string, userIdHeader?: string): TeacherRequestUser {
    if (!roleHeader) {
      throw new BadRequestException("Missing x-user-role header.");
    }

    if (!userIdHeader) {
      throw new BadRequestException("Missing x-user-id header.");
    }

    const normalizedRole = roleHeader.toUpperCase();

    if (normalizedRole !== UserRole.TEACHER) {
      throw new BadRequestException("Only TEACHER requests are supported for this endpoint.");
    }

    return {
      role: UserRole.TEACHER,
      userId: userIdHeader
    };
  }
}


import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Param,
  Post
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CreateTeachingAssignmentDto } from "./dto/create-teaching-assignment.dto";
import { TeachingAssignmentsService } from "./teaching-assignments.service";

type AdminWriteUser = {
  role: Extract<UserRole, "SCHOOL_ADMIN" | "SUPER_ADMIN">;
};

@Controller("classes")
export class TeachingAssignmentsController {
  constructor(private readonly teachingAssignmentsService: TeachingAssignmentsService) {}

  @Post(":classId/teaching-assignments")
  async create(
    @Param("classId") classId: string,
    @Body() body: CreateTeachingAssignmentDto,
    @Headers("x-user-role") roleHeader?: string
  ) {
    this.getAdminWriteUser(roleHeader);
    return this.teachingAssignmentsService.create(classId, body);
  }

  @Get(":classId/teaching-assignments")
  async findForClass(
    @Param("classId") classId: string,
    @Headers("x-user-role") roleHeader?: string
  ) {
    this.getAdminWriteUser(roleHeader);
    return this.teachingAssignmentsService.findForClass(classId);
  }

  @Delete(":classId/teaching-assignments/:assignmentId")
  @HttpCode(204)
  async remove(
    @Param("classId") classId: string,
    @Param("assignmentId") assignmentId: string,
    @Headers("x-user-role") roleHeader?: string
  ) {
    this.getAdminWriteUser(roleHeader);
    await this.teachingAssignmentsService.remove(classId, assignmentId);
  }

  private getAdminWriteUser(roleHeader?: string): AdminWriteUser {
    if (!roleHeader) {
      throw new BadRequestException("Missing x-user-role header.");
    }

    const normalizedRole = roleHeader.trim().toUpperCase() as UserRole;

    if (!Object.values(UserRole).includes(normalizedRole)) {
      throw new BadRequestException("Invalid x-user-role header.");
    }

    if (normalizedRole !== UserRole.SCHOOL_ADMIN && normalizedRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("Only school admins and super admins can manage teaching assignments.");
    }

    return {
      role: normalizedRole
    };
  }
}

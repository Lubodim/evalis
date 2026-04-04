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
import { CreateParentStudentLinkDto } from "./dto/create-parent-student-link.dto";
import { ParentStudentLinksService } from "./parent-student-links.service";

type AdminWriteUser = {
  role: Extract<UserRole, "SCHOOL_ADMIN" | "SUPER_ADMIN">;
};

@Controller("students")
export class ParentStudentLinksController {
  constructor(private readonly parentStudentLinksService: ParentStudentLinksService) {}

  @Post(":studentProfileId/parents")
  async create(
    @Param("studentProfileId") studentProfileId: string,
    @Body() body: CreateParentStudentLinkDto,
    @Headers("x-user-role") roleHeader?: string
  ) {
    this.getAdminWriteUser(roleHeader);
    return this.parentStudentLinksService.create(studentProfileId, body);
  }

  @Get(":studentProfileId/parents")
  async findParentsForStudent(
    @Param("studentProfileId") studentProfileId: string,
    @Headers("x-user-role") roleHeader?: string
  ) {
    this.getAdminWriteUser(roleHeader);
    return this.parentStudentLinksService.findParentsForStudent(studentProfileId);
  }

  @Delete(":studentProfileId/parents/:parentUserId")
  @HttpCode(204)
  async remove(
    @Param("studentProfileId") studentProfileId: string,
    @Param("parentUserId") parentUserId: string,
    @Headers("x-user-role") roleHeader?: string
  ) {
    this.getAdminWriteUser(roleHeader);
    await this.parentStudentLinksService.remove(studentProfileId, parentUserId);
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
      throw new ForbiddenException("Only school admins and super admins can manage parent-student links.");
    }

    return {
      role: normalizedRole
    };
  }
}

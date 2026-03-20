import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { ClassesService } from "./classes.service";

type RequestUser = {
  role: UserRole;
  userId: string | null;
};

@Controller("classes")
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  async findAll(
    @Headers("x-user-role") roleHeader?: string,
    @Headers("x-user-id") userIdHeader?: string
  ) {
    const currentUser = this.getCurrentUser(roleHeader, userIdHeader);
    return this.classesService.findAllForUser(currentUser);
  }

  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @Headers("x-user-role") roleHeader?: string,
    @Headers("x-user-id") userIdHeader?: string
  ) {
    const currentUser = this.getCurrentUser(roleHeader, userIdHeader);
    const schoolClass = await this.classesService.findOneForUser(id, currentUser);

    if (!schoolClass) {
      throw new NotFoundException(`Class ${id} was not found.`);
    }

    return schoolClass;
  }

  private getCurrentUser(roleHeader?: string, userIdHeader?: string): RequestUser {
    if (!roleHeader) {
      throw new BadRequestException("Missing x-user-role header.");
    }

    const normalizedRole = roleHeader.trim().toUpperCase() as UserRole;
    const normalizedUserId = userIdHeader?.trim() || null;

    if (!Object.values(UserRole).includes(normalizedRole)) {
      throw new BadRequestException("Invalid x-user-role header.");
    }

    if (normalizedRole !== UserRole.SCHOOL_ADMIN && normalizedRole !== UserRole.TEACHER) {
      throw new ForbiddenException("Only school admins and teachers can access classes.");
    }

    if (normalizedRole === UserRole.TEACHER && !normalizedUserId) {
      throw new BadRequestException("Missing x-user-id header for teacher requests.");
    }

    return {
      role: normalizedRole,
      userId: normalizedUserId
    };
  }
}

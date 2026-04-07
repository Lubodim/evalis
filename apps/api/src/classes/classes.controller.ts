import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Post
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { ClassesService } from "./classes.service";
import { AssignStudentToClassDto } from "./dto/assign-student-to-class.dto";
import { CreateClassDto } from "./dto/create-class.dto";
import { MoveStudentToClassDto } from "./dto/move-student-to-class.dto";
import { UpdateClassDto } from "./dto/update-class.dto";
import { UpdateClassEnrollmentDto } from "./dto/update-class-enrollment.dto";

type RequestUser = {
  role: UserRole;
  userId: string | null;
};

type AdminWriteUser = {
  role: Extract<UserRole, "SCHOOL_ADMIN" | "SUPER_ADMIN">;
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

  @Get("students/:studentProfileId/enrollments")
  async findStudentMemberships(
    @Param("studentProfileId") studentProfileId: string,
    @Headers("x-user-role") roleHeader?: string
  ) {
    this.getAdminWriteUser(roleHeader);
    return this.classesService.findStudentMemberships(studentProfileId);
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

  @Post()
  async create(
    @Body() body: CreateClassDto,
    @Headers("x-user-role") roleHeader?: string
  ) {
    this.getAdminWriteUser(roleHeader);
    return this.classesService.create(body);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() body: UpdateClassDto,
    @Headers("x-user-role") roleHeader?: string
  ) {
    this.getAdminWriteUser(roleHeader);
    return this.classesService.update(id, body);
  }

  @Post(":id/enrollments")
  async assignStudentToClass(
    @Param("id") id: string,
    @Body() body: AssignStudentToClassDto,
    @Headers("x-user-role") roleHeader?: string
  ) {
    this.getAdminWriteUser(roleHeader);
    return this.classesService.assignStudentToClass(id, body);
  }

  @Post(":id/enrollments/move")
  async moveStudentToClass(
    @Param("id") id: string,
    @Body() body: MoveStudentToClassDto,
    @Headers("x-user-role") roleHeader?: string
  ) {
    this.getAdminWriteUser(roleHeader);
    return this.classesService.moveStudentToClass(id, body);
  }

  @Patch(":id/enrollments/:enrollmentId")
  async updateEnrollmentStudentNumber(
    @Param("id") id: string,
    @Param("enrollmentId") enrollmentId: string,
    @Body() body: UpdateClassEnrollmentDto,
    @Headers("x-user-role") roleHeader?: string
  ) {
    this.getAdminWriteUser(roleHeader);
    return this.classesService.updateEnrollmentStudentNumber(id, enrollmentId, body);
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

  private getAdminWriteUser(roleHeader?: string): AdminWriteUser {
    if (!roleHeader) {
      throw new BadRequestException("Missing x-user-role header.");
    }

    const normalizedRole = roleHeader.trim().toUpperCase() as UserRole;

    if (!Object.values(UserRole).includes(normalizedRole)) {
      throw new BadRequestException("Invalid x-user-role header.");
    }

    if (normalizedRole !== UserRole.SCHOOL_ADMIN && normalizedRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("Only school admins and super admins can modify classes.");
    }

    return {
      role: normalizedRole
    };
  }
}

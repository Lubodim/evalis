import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
  Post
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { ExamSessionsService } from "./exam-sessions.service";

type TeacherRequestUser = {
  role: typeof UserRole.TEACHER;
  userId: string;
};

@Controller("teacher")
export class TeacherExamSessionsController {
  constructor(private readonly examSessionsService: ExamSessionsService) {}

  @Post("assessments/:assessmentId/exam-sessions")
  async createForAssessment(
    @Param("assessmentId") assessmentId: string,
    @Headers("x-user-role") roleHeader?: string,
    @Headers("x-user-id") userIdHeader?: string
  ) {
    const currentUser = this.getTeacherUser(roleHeader, userIdHeader);
    return this.examSessionsService.createForAssessment(assessmentId, currentUser.userId);
  }

  @Get("assessments/:assessmentId/exam-sessions/current")
  async findCurrentForAssessment(
    @Param("assessmentId") assessmentId: string,
    @Headers("x-user-role") roleHeader?: string,
    @Headers("x-user-id") userIdHeader?: string
  ) {
    const currentUser = this.getTeacherUser(roleHeader, userIdHeader);
    return this.examSessionsService.findCurrentForAssessment(assessmentId, currentUser.userId);
  }

  @Get("exam-sessions/:examSessionId")
  async findOne(
    @Param("examSessionId") examSessionId: string,
    @Headers("x-user-role") roleHeader?: string,
    @Headers("x-user-id") userIdHeader?: string
  ) {
    const currentUser = this.getTeacherUser(roleHeader, userIdHeader);
    return this.examSessionsService.findOneForTeacher(examSessionId, currentUser.userId);
  }

  @Get("exam-sessions/:examSessionId/devices")
  async findDevices(
    @Param("examSessionId") examSessionId: string,
    @Headers("x-user-role") roleHeader?: string,
    @Headers("x-user-id") userIdHeader?: string
  ) {
    const currentUser = this.getTeacherUser(roleHeader, userIdHeader);
    return this.examSessionsService.findDevicesForTeacher(examSessionId, currentUser.userId);
  }

  @Post("exam-sessions/:examSessionId/participants/:studentProfileId/approve")
  async approveParticipant(
    @Param("examSessionId") examSessionId: string,
    @Param("studentProfileId") studentProfileId: string,
    @Headers("x-user-role") roleHeader?: string,
    @Headers("x-user-id") userIdHeader?: string
  ) {
    const currentUser = this.getTeacherUser(roleHeader, userIdHeader);
    return this.examSessionsService.approveParticipant(examSessionId, studentProfileId, currentUser.userId);
  }

  @Post("exam-sessions/:examSessionId/participants/:studentProfileId/device/approve")
  async approveParticipantDevice(
    @Param("examSessionId") examSessionId: string,
    @Param("studentProfileId") studentProfileId: string,
    @Headers("x-user-role") roleHeader?: string,
    @Headers("x-user-id") userIdHeader?: string
  ) {
    const currentUser = this.getTeacherUser(roleHeader, userIdHeader);
    return this.examSessionsService.approveParticipantDevice(
      examSessionId,
      studentProfileId,
      currentUser.userId
    );
  }

  @Post("exam-sessions/:examSessionId/start")
  async start(
    @Param("examSessionId") examSessionId: string,
    @Headers("x-user-role") roleHeader?: string,
    @Headers("x-user-id") userIdHeader?: string
  ) {
    const currentUser = this.getTeacherUser(roleHeader, userIdHeader);
    return this.examSessionsService.start(examSessionId, currentUser.userId);
  }

  @Post("exam-sessions/:examSessionId/end")
  async end(
    @Param("examSessionId") examSessionId: string,
    @Headers("x-user-role") roleHeader?: string,
    @Headers("x-user-id") userIdHeader?: string
  ) {
    const currentUser = this.getTeacherUser(roleHeader, userIdHeader);
    return this.examSessionsService.end(examSessionId, currentUser.userId);
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
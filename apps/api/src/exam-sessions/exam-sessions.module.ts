import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ExamSessionsService } from "./exam-sessions.service";
import { StudentExamSessionsController } from "./student-exam-sessions.controller";
import { TeacherExamSessionsController } from "./teacher-exam-sessions.controller";

@Module({
  imports: [PrismaModule],
  controllers: [TeacherExamSessionsController, StudentExamSessionsController],
  providers: [ExamSessionsService],
  exports: [ExamSessionsService]
})
export class ExamSessionsModule {}

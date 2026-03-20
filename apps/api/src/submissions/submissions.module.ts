import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { SubmissionsController } from "./submissions.controller";
import { SubmissionsService } from "./submissions.service";
import { TeacherSubmissionsController } from "./teacher-submissions.controller";

@Module({
  imports: [PrismaModule],
  controllers: [SubmissionsController, TeacherSubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService]
})
export class SubmissionsModule {}

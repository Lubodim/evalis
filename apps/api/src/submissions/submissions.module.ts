import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ParentSubmissionsController } from "./parent-submissions.controller";
import { SubmissionsController } from "./submissions.controller";
import { SubmissionsService } from "./submissions.service";
import { TeacherSubmissionsController } from "./teacher-submissions.controller";

@Module({
  imports: [PrismaModule],
  controllers: [SubmissionsController, TeacherSubmissionsController, ParentSubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService]
})
export class SubmissionsModule {}

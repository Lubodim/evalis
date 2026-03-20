import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AssessmentsController } from "./assessments.controller";
import { AssessmentsService } from "./assessments.service";
import { TeacherAssessmentsController } from "./teacher-assessments.controller";

@Module({
  imports: [PrismaModule],
  controllers: [AssessmentsController, TeacherAssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService]
})
export class AssessmentsModule {}

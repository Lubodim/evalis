import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { TeachingAssignmentsController } from "./teaching-assignments.controller";
import { TeachingAssignmentsService } from "./teaching-assignments.service";

@Module({
  imports: [PrismaModule],
  controllers: [TeachingAssignmentsController],
  providers: [TeachingAssignmentsService]
})
export class TeachingAssignmentsModule {}

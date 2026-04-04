import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ParentStudentLinksController } from "./parent-student-links.controller";
import { ParentStudentLinksService } from "./parent-student-links.service";

@Module({
  imports: [PrismaModule],
  controllers: [ParentStudentLinksController],
  providers: [ParentStudentLinksService]
})
export class ParentStudentLinksModule {}

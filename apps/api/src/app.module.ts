import { Module } from "@nestjs/common";
import { HealthController } from "./health/health.controller";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ClassesModule } from "./classes/classes.module";
import { AssessmentsModule } from "./assessments/assessments.module";
import { SubmissionsModule } from "./submissions/submissions.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, ClassesModule, AssessmentsModule, SubmissionsModule],
  controllers: [HealthController]
})
export class AppModule {}

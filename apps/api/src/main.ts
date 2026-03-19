import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { PrismaService } from "./prisma/prisma.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const prismaService = app.get(PrismaService);

  await prismaService.enableShutdownHooks(app);
  app.enableCors();
  await app.listen(process.env.API_PORT ?? 4000);
}

bootstrap();

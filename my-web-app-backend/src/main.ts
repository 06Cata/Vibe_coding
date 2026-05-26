import "reflect-metadata";
import { config } from "dotenv";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

config({ path: ".env" });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);
}

bootstrap();

import "reflect-metadata";
import { config } from "dotenv";
import express from "express";
import serverless from "serverless-http";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

config({ path: ".env" });

let cachedServer: ReturnType<typeof serverless> | null = null;

export async function getServer() {
  if (cachedServer) {
    return cachedServer;
  }

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  app.enableCors();
  await app.init();

  cachedServer = serverless(expressApp);
  return cachedServer;
}

import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get("health")
  getHealth() {
    return {
      ok: true,
      service: "my-web-app-backend",
      timestamp: new Date().toISOString(),
    };
  }
}

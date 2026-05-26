import { Body, Controller, Headers, Post } from "@nestjs/common";
import { InternalJobsService } from "./internal-jobs.service";

@Controller("internal/jobs")
export class InternalJobsController {
  constructor(private readonly internalJobsService: InternalJobsService) {}

  @Post("stocks-sync")
  async syncStocks(
    @Headers("authorization") authorization?: string,
    @Body("days") days?: number,
  ) {
    this.internalJobsService.authorize(authorization);
    const safeDays = Number.isFinite(Number(days)) && Number(days) > 0 ? Number(days) : 60;
    return this.internalJobsService.syncStocks(safeDays);
  }
}

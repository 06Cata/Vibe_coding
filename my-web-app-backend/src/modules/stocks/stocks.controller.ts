import { Controller, Get, Query } from "@nestjs/common";
import { StocksService } from "./stocks.service";

@Controller("api/stocks")
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get("dashboard")
  async getDashboard(@Query("days") days?: string) {
    const parsedDays = Number(days ?? "60");
    const safeDays = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 60;
    return this.stocksService.getDashboard(safeDays);
  }
}

import { Module } from "@nestjs/common";
import { StocksModule } from "./modules/stocks/stocks.module";
import { InternalJobsModule } from "./modules/internal-jobs/internal-jobs.module";
import { HealthModule } from "./modules/health/health.module";
import { WeatherModule } from "./modules/weather/weather.module";
import { RestaurantsModule } from "./modules/restaurants/restaurants.module";

@Module({
  imports: [HealthModule, StocksModule, InternalJobsModule, WeatherModule, RestaurantsModule],
})
export class AppModule {}

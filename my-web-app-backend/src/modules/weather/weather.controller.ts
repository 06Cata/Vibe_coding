import { Controller, Get, Query } from "@nestjs/common";
import { WeatherService } from "./weather.service";

const DEFAULT_LATITUDE = 25.04;
const DEFAULT_LONGITUDE = 121.53;

@Controller("api/weather")
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get("forecast")
  async getForecast(@Query("lat") lat?: string, @Query("lng") lng?: string) {
    const latitude = Number(lat ?? DEFAULT_LATITUDE);
    const longitude = Number(lng ?? DEFAULT_LONGITUDE);

    return this.weatherService.getWeather({
      latitude: Number.isFinite(latitude) ? latitude : DEFAULT_LATITUDE,
      longitude: Number.isFinite(longitude) ? longitude : DEFAULT_LONGITUDE,
    });
  }
}

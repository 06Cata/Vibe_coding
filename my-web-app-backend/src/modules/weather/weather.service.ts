import { Injectable } from "@nestjs/common";

type WeatherLocation = {
  latitude: number;
  longitude: number;
};

@Injectable()
export class WeatherService {
  buildWeatherUrl(location: WeatherLocation) {
    const params = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current: "temperature_2m,weathercode,windspeed_10m",
      hourly: "temperature_2m,precipitation,precipitation_probability",
      forecast_days: "2",
      timezone: "Asia/Taipei",
      _: String(Date.now()),
    });

    return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  }

  async getWeather(location: WeatherLocation) {
    const response = await fetch(this.buildWeatherUrl(location), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Weather request failed");
    }

    return response.json();
  }
}

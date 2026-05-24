"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type CurrentWeather = {
  time: string;
  interval: number;
  temperature_2m: number;
  weathercode: number;
  windspeed_10m: number;
};

type WeatherResponse = {
  current?: CurrentWeather;
  current_units?: {
    temperature_2m?: string;
    weathercode?: string;
    windspeed_10m?: string;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    precipitation_probability: number[];
  };
  hourly_units?: {
    temperature_2m?: string;
    precipitation?: string;
    precipitation_probability?: string;
  };
};

type WeatherLocation = {
  latitude: number;
  longitude: number;
  label: string;
};

const DEFAULT_LOCATION: WeatherLocation = {
  latitude: 25.04,
  longitude: 121.53,
  label: "台北",
};

function buildWeatherUrl(location: WeatherLocation) {
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

function getWeatherStatus(code: number) {
  if (code === 0) {
    return {
      emoji: "☀️",
      label: "晴天",
      description: "天空晴朗，適合安排戶外行程。",
    };
  }

  if (code === 1 || code === 2) {
    return {
      emoji: "⛅",
      label: "多雲",
      description: "雲量稍多，但整體天氣仍算穩定。",
    };
  }

  if (code === 3 || code === 45 || code === 48) {
    return {
      emoji: "☁️",
      label: "陰天",
      description: "雲層偏厚，外出時留意天色變化。",
    };
  }

  return {
    emoji: "🌧️",
    label: "雨天",
    description: "可能有降雨，出門建議攜帶雨具。",
  };
}

function WeatherSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="mx-auto h-28 w-44 rounded-3xl bg-white/10" />
      <div className="space-y-3">
        <div className="mx-auto h-7 w-32 rounded-full bg-white/10" />
        <div className="mx-auto h-5 w-56 rounded-full bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 rounded-2xl bg-white/10" />
        <div className="h-24 rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}

export default function WeatherPage() {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [units, setUnits] = useState<WeatherResponse["current_units"] | null>(null);
  const [hourly, setHourly] = useState<WeatherResponse["hourly"] | null>(null);
  const [hourlyUnits, setHourlyUnits] =
    useState<WeatherResponse["hourly_units"] | null>(null);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState("");

  const fetchWeather = useCallback(async (targetLocation: WeatherLocation) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(buildWeatherUrl(targetLocation), {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Weather request failed");
      }

      const data = (await response.json()) as WeatherResponse;

      if (!data.current) {
        throw new Error("Current weather is missing");
      }

      setWeather(data.current);
      setUnits(data.current_units ?? null);
      setHourly(data.hourly ?? null);
      setHourlyUnits(data.hourly_units ?? null);
      setLocation(targetLocation);
      setLastFetchedAt(new Date());
    } catch {
      setError("目前無法取得天氣資料，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  function locateMe() {
    setError("");

    if (!navigator.geolocation) {
      setError("這個瀏覽器不支援定位功能。");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation: WeatherLocation = {
          latitude: Number(position.coords.latitude.toFixed(4)),
          longitude: Number(position.coords.longitude.toFixed(4)),
          label: "我的位置",
        };

        setIsLocating(false);
        void fetchWeather(userLocation);
      },
      (geoError) => {
        setIsLocating(false);

        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError("你已拒絕定位權限，目前仍顯示原本位置的天氣。");
          return;
        }

        setError("目前無法取得你的定位，請稍後再試。");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchWeather(DEFAULT_LOCATION);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchWeather]);

  const status = useMemo(
    () => (weather ? getWeatherStatus(weather.weathercode) : null),
    [weather],
  );

  const dataTime = weather
    ? new Intl.DateTimeFormat("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(weather.time))
    : "--";

  const fetchedTime = lastFetchedAt
    ? new Intl.DateTimeFormat("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(lastFetchedAt)
    : "--";

  const hourlyForecast = useMemo(() => {
    if (!hourly || !weather) {
      return [];
    }

    const currentHour = new Date(weather.time);
    currentHour.setMinutes(0, 0, 0);

    const tomorrowStart = new Date(currentHour);
    tomorrowStart.setHours(24, 0, 0, 0);

    return hourly.time
      .map((time, index) => {
        const forecastTime = new Date(time);
        const isMidnight = forecastTime.getTime() === tomorrowStart.getTime();
        const hourLabel = isMidnight
          ? "24:00"
          : new Intl.DateTimeFormat("zh-TW", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }).format(forecastTime);

        return {
          time,
          forecastTime,
          hourLabel,
          temperature: hourly.temperature_2m[index],
          precipitation: hourly.precipitation[index],
          rainChance: hourly.precipitation_probability[index],
        };
      })
      .filter(
        (item) =>
          item.forecastTime >= currentHour && item.forecastTime <= tomorrowStart,
      );
  }, [hourly, weather]);

  const mapUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=14&output=embed`;

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-gray-950 px-6 py-12 pt-16 text-white">
      <section className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-7 text-center shadow-2xl shadow-black/40 backdrop-blur">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-sky-400/20 blur-3xl" />

        <div className="relative">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-orange-300">
            {location.label} Weather
          </p>
          <h1 className="mb-8 text-4xl font-black tracking-tight sm:text-5xl">
            {location.label}即時天氣
          </h1>

          {isLoading ? <WeatherSkeleton /> : null}

          {!isLoading && error ? (
            <div className="rounded-3xl border border-red-300/30 bg-red-500/10 p-6 text-red-100">
              {error}
            </div>
          ) : null}

          {!isLoading && !error && weather && status ? (
            <div>
              <div className="mb-7 flex items-end justify-center gap-3">
                <span className="text-8xl font-black leading-none tracking-tight">
                  {Math.round(weather.temperature_2m)}
                </span>
                <span className="mb-3 text-3xl font-black text-orange-200">
                  {units?.temperature_2m ?? "°C"}
                </span>
              </div>

              <div className="mb-8 rounded-3xl border border-white/10 bg-gray-950/60 p-6">
                <div className="mb-3 text-7xl" aria-hidden="true">
                  {status.emoji}
                </div>
                <h2 className="mb-2 text-3xl font-black text-orange-100">
                  {status.label}
                </h2>
                <p className="text-sm leading-6 text-gray-300">{status.description}</p>
              </div>

              <div className="mb-8 grid gap-4 text-left sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="mb-2 text-sm font-bold text-gray-400">風速</p>
                  <p className="text-2xl font-black">
                    {weather.windspeed_10m}
                    <span className="ml-1 text-base text-gray-300">
                      {units?.windspeed_10m ?? "km/h"}
                    </span>
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="mb-2 text-sm font-bold text-gray-400">資料時間</p>
                  <p className="text-2xl font-black">{dataTime}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="mb-2 text-sm font-bold text-gray-400">更新時間</p>
                  <p className="text-2xl font-black">{fetchedTime}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 sm:col-span-2">
                  <p className="mb-2 text-sm font-bold text-gray-400">座標</p>
                  <p className="break-words text-lg font-black">
                    緯度 {location.latitude}，經度 {location.longitude}
                  </p>
                </div>
              </div>

              <div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gray-950/60">
                <iframe
                  title={`${location.label} Google Map`}
                  src={mapUrl}
                  className="h-64 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>

              {hourlyForecast.length > 0 ? (
                <div className="mb-8 rounded-3xl border border-white/10 bg-gray-950/60 p-5 text-left">
                  <div className="mb-4">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-300">
                      Today Forecast
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-orange-100">
                      今日逐時預估
                    </h2>
                  </div>
                  <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
                    {hourlyForecast.map((item) => (
                      <div
                        key={item.time}
                        className="min-w-28 rounded-2xl border border-white/10 bg-white/10 p-4 text-center"
                      >
                        <p className="mb-3 text-sm font-black text-gray-300">
                          {item.hourLabel}
                        </p>
                        <p className="text-3xl font-black text-white">
                          {Math.round(item.temperature)}
                          <span className="text-base text-orange-200">
                            {hourlyUnits?.temperature_2m ?? "°C"}
                          </span>
                        </p>
                        <div className="mt-4 space-y-1 text-sm text-gray-300">
                          <p>
                            降雨 {item.rainChance}
                            {hourlyUnits?.precipitation_probability ?? "%"}
                          </p>
                          <p>
                            雨量 {item.precipitation}
                            {hourlyUnits?.precipitation ?? "mm"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void fetchWeather(location)}
              disabled={isLoading || isLocating}
              className="rounded-full bg-orange-500 px-8 py-4 text-lg font-black text-gray-950 shadow-lg shadow-orange-950/40 transition hover:-translate-y-1 hover:bg-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-300/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isLoading ? "更新中..." : "更新"}
            </button>
            <button
              type="button"
              onClick={locateMe}
              disabled={isLoading || isLocating}
              className="rounded-full border border-orange-300/60 px-8 py-4 text-lg font-black text-orange-100 transition hover:-translate-y-1 hover:bg-orange-400/10 focus:outline-none focus:ring-4 focus:ring-orange-300/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isLocating ? "定位中..." : "取得我的位置"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

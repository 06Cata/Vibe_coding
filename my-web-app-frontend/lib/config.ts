export function getBackendBaseUrl() {
  return (
    process.env.BACKEND_API_BASE_URL ??
    process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ??
    "http://localhost:3001"
  );
}

export function buildBackendWeatherUrl(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
  });

  return `${getBackendBaseUrl()}/api/weather/forecast?${params.toString()}`;
}

export function buildBackendRestaurantsUrl() {
  return `${getBackendBaseUrl()}/api/restaurants`;
}

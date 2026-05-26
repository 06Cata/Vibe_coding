"use client";

import { useEffect, useMemo, useState } from "react";
import { buildBackendRestaurantsUrl } from "@/lib/config";

type Restaurant = {
  name: string;
  latitude: number;
  longitude: number;
  notes: string[];
};

type Office = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

type RestaurantsResponse = {
  office: Office;
  restaurants: Restaurant[];
};

type RestaurantWithDistance = Restaurant & {
  distance: number;
};

function getDistanceInMeters(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
) {
  const earthRadius = 6371000;
  const startLat = (start.latitude * Math.PI) / 180;
  const endLat = (end.latitude * Math.PI) / 180;
  const diffLat = ((end.latitude - start.latitude) * Math.PI) / 180;
  const diffLng = ((end.longitude - start.longitude) * Math.PI) / 180;

  const a =
    Math.sin(diffLat / 2) * Math.sin(diffLat / 2) +
    Math.cos(startLat) *
      Math.cos(endLat) *
      Math.sin(diffLng / 2) *
      Math.sin(diffLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadius * c);
}

function formatDistance(meters: number) {
  if (meters < 1000) {
    return `${meters} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

const FALLBACK_OFFICE = {
  name: "國泰健康管理",
  address: "台北市大安區敦化南路二段333號",
};

export default function FoodPickerPage() {
  const [restaurantsData, setRestaurantsData] = useState<RestaurantsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantWithDistance | null>(null);
  const [spinKey, setSpinKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadRestaurants() {
      try {
        setLoadError(null);
        const response = await fetch(buildBackendRestaurantsUrl(), {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load restaurants: ${response.status}`);
        }

        const data = (await response.json()) as RestaurantsResponse;

        if (active) {
          setRestaurantsData(data);
        }
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Unknown error");
        }
      }
    }

    void loadRestaurants();

    return () => {
      active = false;
    };
  }, []);

  const office = restaurantsData?.office;
  const restaurants = useMemo(() => restaurantsData?.restaurants ?? [], [restaurantsData]);

  const restaurantsWithDistance = useMemo(
    () =>
      office
        ? restaurants.map((restaurant) => ({
            ...restaurant,
            distance: getDistanceInMeters(office, restaurant),
          }))
        : [],
    [office, restaurants],
  );

  const selectedDistance = selectedRestaurant?.distance ?? null;

  const directionsUrl =
    selectedRestaurant && office
      ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
          `${office.name} ${office.address}`,
        )}&destination=${selectedRestaurant.latitude},${selectedRestaurant.longitude}&travelmode=walking`
      : "";

  const mapUrl = selectedRestaurant
    ? `https://www.google.com/maps?q=${selectedRestaurant.latitude},${selectedRestaurant.longitude}&z=17&output=embed`
    : `https://www.google.com/maps?q=${encodeURIComponent(
        office ? `${office.name} ${office.address}` : `${FALLBACK_OFFICE.name} ${FALLBACK_OFFICE.address}`,
      )}&z=16&output=embed`;

  function pickRestaurant() {
    if (restaurantsWithDistance.length === 0) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * restaurantsWithDistance.length);
    setSelectedRestaurant(restaurantsWithDistance[randomIndex]);
    setSpinKey((current) => current + 1);
  }

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-12 pt-20 text-white">
      <section className="mx-auto w-full max-w-6xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-orange-300">
            Food Picker
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            公司附近吃什麼？
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-gray-300">
            從 {office?.name ?? FALLBACK_OFFICE.name}（{office?.address ?? FALLBACK_OFFICE.address}
            ）出發，幫你從 Google Maps 清單整理出的 {restaurants.length} 間店挑午餐。
          </p>
        </div>

        {loadError ? (
          <div className="mb-6 rounded-3xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
            目前無法載入餐廳清單：{loadError}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur">
            <div
              key={spinKey}
              className="mb-6 rounded-3xl bg-gray-900/80 p-6 shadow-xl shadow-orange-950/30"
            >
              {selectedRestaurant ? (
                <>
                  <div className="mb-4 animate-bounce text-6xl">🍽️</div>
                  <h2 className="mb-4 text-4xl font-black leading-tight text-orange-100">
                    {selectedRestaurant.name}
                  </h2>
                  <ul className="mb-5 space-y-3 text-left leading-7 text-gray-300">
                    {selectedRestaurant.notes.map((note) => (
                      <li key={note} className="rounded-2xl bg-white/10 p-3">
                        {note}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 grid gap-3 text-sm font-bold text-gray-300 sm:grid-cols-2">
                    <p className="rounded-2xl bg-white/10 p-3">
                      距離 {formatDistance(selectedDistance ?? 0)}
                    </p>
                    <p className="rounded-2xl bg-white/10 p-3">
                      從 {office?.name ?? FALLBACK_OFFICE.name} 出發
                    </p>
                  </div>
                  <p className="mt-4 break-words text-sm font-bold text-gray-400">
                    緯度 {selectedRestaurant.latitude}，經度 {selectedRestaurant.longitude}
                  </p>
                </>
              ) : (
                <div className="py-8 text-center">
                  <div className="mb-5 text-6xl">📍</div>
                  <h2 className="mb-4 text-4xl font-black leading-tight text-orange-100">
                    還沒選店
                  </h2>
                  <p className="leading-7 text-gray-300">
                    按「幫我決定！」後，會從清單中隨機選一家，並顯示距離與地圖。
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={pickRestaurant}
                disabled={restaurantsWithDistance.length === 0}
                className="rounded-full bg-orange-500 px-8 py-4 text-lg font-black text-gray-950 shadow-lg shadow-orange-950/40 transition hover:-translate-y-1 hover:bg-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-300/30 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-300 disabled:hover:translate-y-0"
              >
                {restaurantsWithDistance.length === 0 ? "載入中..." : "幫我決定！"}
              </button>
              {selectedRestaurant ? (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-orange-300/60 px-8 py-4 text-center text-lg font-black text-orange-100 transition hover:-translate-y-1 hover:bg-orange-400/10 focus:outline-none focus:ring-4 focus:ring-orange-300/20"
                >
                  步行導航
                </a>
              ) : (
                <span className="rounded-full border border-white/10 px-8 py-4 text-center text-lg font-black text-gray-500">
                  步行導航
                </span>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-gray-950/80 shadow-2xl shadow-black/30">
            <iframe
              title={`${selectedRestaurant?.name ?? office?.name ?? FALLBACK_OFFICE.name} Google Map`}
              src={mapUrl}
              className="h-[460px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl shadow-black/20 backdrop-blur">
          <h2 className="mb-4 text-2xl font-black text-orange-100">店家清單</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {restaurantsWithDistance.map((restaurant) => {
              const isSelected = restaurant.name === selectedRestaurant?.name;

              return (
                <button
                  key={restaurant.name}
                  type="button"
                  onClick={() => setSelectedRestaurant(restaurant)}
                  className={`rounded-2xl border p-4 text-left transition hover:-translate-y-1 ${
                    isSelected
                      ? "border-orange-300 bg-orange-500 text-gray-950"
                      : "border-white/10 bg-gray-950/60 text-white hover:border-orange-300/60"
                  }`}
                >
                  <p className="font-black">{restaurant.name}</p>
                  <p
                    className={`mt-2 text-sm font-black ${
                      isSelected ? "text-gray-900" : "text-orange-300"
                    }`}
                  >
                    距離 {formatDistance(restaurant.distance)}
                  </p>
                  <ul
                    className={`mt-3 space-y-1 text-sm leading-6 ${
                      isSelected ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {restaurant.notes.map((note) => (
                      <li key={note} className="line-clamp-1">
                        {note}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

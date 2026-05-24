"use client";

import { useMemo, useState } from "react";

const restaurants = [
  {
    name: "鍾園精緻雲吞料理",
    latitude: 25.0243978,
    longitude: 121.5534716,
    notes: ["撈麵好吃，適合想吃麵食的午餐。", "請提早出發，尖峰時間可能要等。", "份量實在，適合快速吃飽。"],
  },
  {
    name: "食知味餐館",
    latitude: 25.0239475,
    longitude: 121.5518288,
    notes: ["百元小吃，預算友善。", "適合想快速解決午餐的時候。", "離公司近，平日午餐可列入輪替。"],
  },
  {
    name: "Demeter Coffee",
    latitude: 25.0227588,
    longitude: 121.5499815,
    notes: ["黑咖啡很好喝。", "適合午餐後想補咖啡因。", "也適合找地方短暫放空。"],
  },
  {
    name: "林記小吃",
    latitude: 25.0230221,
    longitude: 121.5499772,
    notes: ["炒飯記得加辣。", "鮮魚麵也有人推薦。", "適合想吃熱食和家常口味。"],
  },
  {
    name: "壽司爸",
    latitude: 25.0221323,
    longitude: 121.5536297,
    notes: ["想吃壽司時可以選。", "一定要預約，避免撲空。", "適合比較有計畫的午餐。"],
  },
  {
    name: "千松谷日本料理",
    latitude: 25.0229783,
    longitude: 121.5476247,
    notes: ["有商業午餐。", "建議提早訂位。", "適合想吃日式定食的時候。"],
  },
  {
    name: "十里坡",
    latitude: 25.0230067,
    longitude: 121.5468018,
    notes: ["俗又大碗，份量派可選。", "建議提早出發。", "適合餓到想吃飽的午餐。"],
  },
  {
    name: "蔣記家薌麵",
    latitude: 25.0263028,
    longitude: 121.5470214,
    notes: ["公司附近的麵食選項。", "適合想吃簡單熱湯麵。", "距離稍遠，適合不趕時間。"],
  },
  {
    name: "Uncle Burger 漢堡叔叔",
    latitude: 25.0244092,
    longitude: 121.5473712,
    notes: ["招牌漢堡好吃。", "注意早餐與午晚餐最後點餐時間。", "適合想吃美式或高熱量午餐。"],
  },
  {
    name: "PHO25 上癮河粉 X 越式泰式料理",
    latitude: 25.0216952,
    longitude: 121.5515901,
    notes: ["想吃越式或泰式時可以選。", "河粉類適合想吃清爽一點。", "離公司近，午餐時間好安排。"],
  },
  {
    name: "Li Jia Restaurant",
    latitude: 25.0221345,
    longitude: 121.5504334,
    notes: ["釜山豬肉湯飯很推薦。", "炸雞丼飯和馬鈴薯排骨湯飯也可以試。", "人多時建議提早去或先線上取號。"],
  },
  {
    name: "餓菱居",
    latitude: 25.0281561,
    longitude: 121.5466571,
    notes: ["炒飯和紅油抄手都很好吃。", "紅油皮蛋麵也被推薦。", "有點小遠且可能要等。"],
  },
  {
    name: "The House Breakfast",
    latitude: 25.0243468,
    longitude: 121.5467925,
    notes: ["薯餅塔必點。", "酥皮蛋餅很好吃。", "適合早午餐或想吃早餐店口味。"],
  },
  {
    name: "Ya Tsung (Kamonegi) Shinn Citrus",
    latitude: 25.0231249,
    longitude: 121.5544868,
    notes: ["鴨風味拉麵，湯頭濃郁。", "份量有點小，可考慮加飯。", "價格大約 240-300。"],
  },
  {
    name: "樂利早午餐",
    latitude: 25.0249149,
    longitude: 121.5523713,
    notes: ["炒泡麵很好吃。", "份量很多，價格大約 80-150。", "飲料和蛋餅是穩定早餐店口味。"],
  },
  {
    name: "5.TUNG",
    latitude: 25.0272566,
    longitude: 121.5515961,
    notes: ["千層甜點店，適合犒賞自己。", "推薦鐵觀音、香草、巧克力、提拉米蘇。", "滿三個以上可電話預約自取。"],
  },
  {
    name: "Ye Mao Restaurant - Liu Zhang Li Branch",
    latitude: 25.0224718,
    longitude: 121.5506917,
    notes: ["公司附近的餐廳選項。", "適合不知道吃什麼時加入抽籤。", "可搭配地圖確認營業狀況。"],
  },
  {
    name: "滬上雞莊麵食館(樂業店)",
    latitude: 25.0211495,
    longitude: 121.5515907,
    notes: ["四川口味但不會太辣。", "牛肉麵價格划算。", "推薦 E 套餐，有蔥油拌麵和小菜。"],
  },
  {
    name: "鯛魚燒工房 台灣大安店",
    latitude: 25.0220462,
    longitude: 121.5505325,
    notes: ["紅豆和奶油是穩定傳統口味。", "限定口味像蘋果肉桂可以試。", "建議先電話訂，適合飯後甜點。"],
  },
  {
    name: "武大郎豆漿店",
    latitude: 25.0231906,
    longitude: 121.5499831,
    notes: ["蛋餅煎得很酥脆。", "中午蒸餃有名。", "可以線上訂餐再自取。"],
  },
  {
    name: "136海鮮麵-臥龍店",
    latitude: 25.0209651,
    longitude: 121.5480617,
    notes: ["海鮮新鮮，蛋白質很豐富。", "多數人吃鍋燒油麵。", "價格大約 160-250。"],
  },
];

const office = {
  name: "國泰健康管理",
  address: "台北市大安區敦化南路二段333號",
  latitude: 25.0216448,
  longitude: 121.552896,
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

export default function FoodPickerPage() {
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<(typeof restaurants)[number] | null>(null);
  const [spinKey, setSpinKey] = useState(0);

  const restaurantsWithDistance = useMemo(
    () =>
      restaurants.map((restaurant) => ({
        ...restaurant,
        distance: getDistanceInMeters(office, restaurant),
      })),
    [],
  );

  const selectedDistance = selectedRestaurant
    ? getDistanceInMeters(office, selectedRestaurant)
    : null;

  const directionsUrl = selectedRestaurant
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
        `${office.name} ${office.address}`,
      )}&destination=${selectedRestaurant.latitude},${selectedRestaurant.longitude}&travelmode=walking`
    : "";

  const mapUrl = selectedRestaurant
    ? `https://www.google.com/maps?q=${selectedRestaurant.latitude},${selectedRestaurant.longitude}&z=17&output=embed`
    : `https://www.google.com/maps?q=${encodeURIComponent(
        `${office.name} ${office.address}`,
      )}&z=16&output=embed`;

  function pickRestaurant() {
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
            從 {office.name}（{office.address}）出發，幫你從 Google Maps 清單整理出的{" "}
            {restaurants.length} 間店挑午餐。
          </p>
        </div>

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
                      從 {office.name} 出發
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
                className="rounded-full bg-orange-500 px-8 py-4 text-lg font-black text-gray-950 shadow-lg shadow-orange-950/40 transition hover:-translate-y-1 hover:bg-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-300/30"
              >
                幫我決定！
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
              title={`${selectedRestaurant?.name ?? office.name} Google Map`}
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

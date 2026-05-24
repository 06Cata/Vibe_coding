import Link from "next/link";

const apps = [
  {
    href: "/food",
    emoji: "🍜",
    title: "公司附近吃什麼",
    description: "從公司附近餐廳清單中隨機挑一間，並顯示距離與地圖。",
  },
  {
    href: "/weather",
    emoji: "☀️",
    title: "即時天氣",
    description: "查看台北或目前定位的天氣、風速、座標與地圖。",
  },
  {
    href: "/stock",
    emoji: "📈",
    title: "股市大盤走向",
    description: "查看台股加權指數、0050、2330，並切換技術圖表。",
  },
  {
    href: "/qrcode",
    emoji: "▦",
    title: "QR Code",
    description: "輸入網址或文字，產生可下載的 QR Code，也能放上 Logo。",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-6 py-12 pt-16 text-white">
      <section className="w-full max-w-6xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-orange-300">
            My Web Apps
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            小工具入口
          </h1>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {apps.map((app) => (
            <Link
              key={app.href}
              href={app.href}
              className="group flex min-h-64 flex-col rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-orange-300/60 hover:bg-white/15"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-950/70 text-4xl transition group-hover:scale-105">
                {app.emoji}
              </div>
              <h2 className="mb-3 text-2xl font-black text-orange-100">
                {app.title}
              </h2>
              <p className="leading-7 text-gray-300">{app.description}</p>
              <span className="mt-auto pt-6 text-sm font-black text-orange-300">
                開啟工具
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

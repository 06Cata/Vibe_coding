import Link from "next/link";

const apps = [
  {
    href: "/stock",
    emoji: "📈",
    title: "股市大盤走向",
    description: "已搬移，改由獨立 backend API 提供資料。",
    status: "已接 backend",
  },
  {
    href: "/weather",
    emoji: "☀️",
    title: "即時天氣",
    description: "已搬移，改由獨立 backend API 提供資料。",
    status: "已接 backend",
  },
  {
    href: "/food",
    emoji: "🍜",
    title: "公司附近吃什麼",
    description: "已搬移至新 frontend，仍是前端直跑版本。",
    status: "待搬移",
  },
  {
    href: "/qrcode",
    emoji: "▦",
    title: "QR Code",
    description: "已搬移至新 frontend，仍是前端直跑版本。",
    status: "待搬移",
  },
  {
    href: "/quiz",
    emoji: "🐬",
    title: "動物性格測驗",
    description: "已搬移至新 frontend，仍是前端直跑版本。",
    status: "待搬移",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-6 py-12 pt-16 text-white">
      <section className="w-full max-w-6xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-orange-300">
            Frontend Split
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            前後端分離版本
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-gray-300">
            原本的 my-web-app 保留不動。這一包已搬完五個頁面，stock 與 weather 已改走 backend API。
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => {
            return (
              <Link
                key={app.title}
                href={app.href}
                className="group flex min-h-64 flex-col rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-orange-300/60 hover:bg-white/15"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-950/70 text-4xl">
                  {app.emoji}
                </div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-black text-orange-100">{app.title}</h2>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-orange-200">
                    {app.status}
                  </span>
                </div>
                <p className="leading-7 text-gray-300">{app.description}</p>
                <span className="mt-auto pt-6 text-sm font-black text-orange-300">
                  開啟工具
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

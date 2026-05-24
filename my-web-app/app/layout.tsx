import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Web Apps",
  description: "公司附近吃什麼、即時天氣、股市大盤走向與 QR Code 小工具。",
};

const navItems = [
  { href: "/", label: "首頁" },
  { href: "/food", label: "公司附近吃什麼" },
  { href: "/weather", label: "即時天氣" },
  { href: "/stock", label: "股市大盤走向" },
  { href: "/qrcode", label: "QR Code" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-gray-950 text-white">
        <header className="sticky inset-x-0 top-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur">
          <nav
            className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
            aria-label="主要導覽"
          >
            <Link className="text-lg font-black tracking-tight text-orange-200" href="/">
              My Web Apps
            </Link>
            <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  className="rounded-full px-3 py-2 text-gray-200 transition hover:bg-white/10 hover:text-white"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function QrCodePage() {
  const [input, setInput] = useState("https://example.com");
  const [qrValue, setQrValue] = useState("https://example.com");
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(23);
  const [logoOpacity, setLogoOpacity] = useState(60);
  const [foregroundColor, setForegroundColor] = useState("#111827");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const qrRef = useRef<HTMLDivElement>(null);

  function generateQrCode() {
    const value = input.trim();
    if (!value) return;
    setQrValue(value);
  }

  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoSrc(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function drawLogoOnCanvas(
    context: CanvasRenderingContext2D,
    logo: HTMLImageElement,
    canvasSize: number,
  ) {
    const logoBoxSize = canvasSize * (logoSize / 100);
    const logoImageSize = canvasSize * ((logoSize - 6) / 100);
    const logoBoxPosition = (canvasSize - logoBoxSize) / 2;
    const logoImagePosition = (canvasSize - logoImageSize) / 2;

    context.fillStyle = backgroundColor;
    context.beginPath();
    context.roundRect(logoBoxPosition, logoBoxPosition, logoBoxSize, logoBoxSize, 42);
    context.fill();
    context.globalAlpha = logoOpacity / 100;
    context.drawImage(logo, logoImagePosition, logoImagePosition, logoImageSize, logoImageSize);
    context.globalAlpha = 1;
  }

  function downloadQrCode() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 1024;
      canvas.width = size;
      canvas.height = size;

      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        return;
      }

      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, size, size);
      context.drawImage(image, 0, 0, size, size);

      if (logoSrc) {
        const logo = new Image();
        logo.onload = () => {
          drawLogoOnCanvas(context, logo, size);
          saveCanvas(canvas);
          URL.revokeObjectURL(url);
        };
        logo.src = logoSrc;
        return;
      }

      saveCanvas(canvas);
      URL.revokeObjectURL(url);
    };

    image.src = url;
  }

  function saveCanvas(canvas: HTMLCanvasElement) {
    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = "qr-code.png";
    link.click();
  }

  return (
    <main className="flex min-h-screen items-center justify-center pt-16 bg-gray-900 px-6 py-12 text-white">
      <section className="w-full max-w-[400px] rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="mb-6 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">
            QR Generator
          </p>
          <h1 className="text-3xl font-black tracking-tight">QR Code 產生器</h1>
        </div>

        <label className="mb-2 block text-sm font-semibold text-gray-200" htmlFor="qr-input">
          輸入網址或文字
        </label>
        <input
          id="qr-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") generateQrCode();
          }}
          className="mb-4 w-full rounded-2xl border border-orange-400/40 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-400/20"
          placeholder="https://example.com"
          type="text"
        />

        <label className="mb-2 block text-sm font-semibold text-gray-200" htmlFor="logo-input">
          上傳置中圖片
        </label>
        <input
          id="logo-input"
          accept="image/*"
          className="mb-4 w-full rounded-2xl border border-orange-400/40 bg-gray-950 px-4 py-3 text-sm text-gray-200 file:mr-4 file:rounded-full file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:font-bold file:text-gray-950"
          type="file"
          onChange={handleLogoUpload}
        />

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-gray-200" htmlFor="foreground-color">
            前景顏色
            <input
              id="foreground-color"
              className="mt-2 h-12 w-full rounded-2xl border border-orange-400/40 bg-gray-950 p-1"
              type="color"
              value={foregroundColor}
              onChange={(event) => setForegroundColor(event.target.value)}
            />
          </label>
          <label className="block text-sm font-semibold text-gray-200" htmlFor="background-color">
            背景顏色
            <input
              id="background-color"
              className="mt-2 h-12 w-full rounded-2xl border border-orange-400/40 bg-gray-950 p-1"
              type="color"
              value={backgroundColor}
              onChange={(event) => setBackgroundColor(event.target.value)}
            />
          </label>
        </div>

        <label className="mb-2 block text-sm font-semibold text-gray-200" htmlFor="logo-size">
          Logo 大小：{logoSize}%
        </label>
        <input
          id="logo-size"
          className="mb-4 w-full accent-orange-500"
          type="range"
          min="12"
          max="32"
          value={logoSize}
          onChange={(event) => setLogoSize(Number(event.target.value))}
        />

        <label className="mb-2 block text-sm font-semibold text-gray-200" htmlFor="logo-opacity">
          Logo 透明度：{logoOpacity}%
        </label>
        <input
          id="logo-opacity"
          className="mb-4 w-full accent-orange-500"
          type="range"
          min="10"
          max="100"
          value={logoOpacity}
          onChange={(event) => setLogoOpacity(Number(event.target.value))}
        />

        <button
          className="mb-6 w-full rounded-2xl bg-orange-500 px-5 py-3 font-bold text-gray-950 transition hover:-translate-y-0.5 hover:bg-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-400/30"
          type="button"
          onClick={generateQrCode}
        >
          產生 QR Code
        </button>

        <div
          className="relative rounded-3xl border border-white/10 p-6"
          ref={qrRef}
          style={{ backgroundColor }}
        >
          <QRCodeSVG
            value={qrValue}
            size={280}
            bgColor={backgroundColor}
            fgColor={foregroundColor}
            level="H"
            className="h-auto w-full"
          />
          {logoSrc ? (
            <div
              className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl p-2 shadow-lg"
              style={{
                width: `${logoSize}%`,
                height: `${logoSize}%`,
                backgroundColor,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="h-full w-full object-contain"
                src={logoSrc}
                alt="QR Code 中央圖片"
                style={{ opacity: logoOpacity / 100 }}
              />
            </div>
          ) : null}
        </div>

        <button
          className="mt-6 w-full rounded-2xl border border-orange-400/60 px-5 py-3 font-bold text-orange-200 transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-400/10 focus:outline-none focus:ring-4 focus:ring-orange-400/20"
          type="button"
          onClick={downloadQrCode}
        >
          下載 PNG
        </button>
      </section>
    </main>
  );
}

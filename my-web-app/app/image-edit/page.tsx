"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";

type EditResponse = {
  result?: string;
  imageUrl?: string;
  error?: string;
};

const quickPrompts = [
  { label: "🗑️ 移除背景", prompt: "移除背景，保留商品主體與邊緣細節，輸出乾淨透明背景版本。" },
  { label: "⚪ 換白色背景", prompt: "把背景換成純白色，保留商品主體、陰影自然、適合電商商品頁。" },
  { label: "✨ 提升質感", prompt: "讓商品看起來更有質感，提升打光、細節與整體高級感，但不要改變商品本身設計。" },
  { label: "🌅 加溫暖光線", prompt: "加入溫暖柔和的商品攝影光線，讓畫面更有氛圍，保留商品真實顏色。" },
];

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("無法讀取圖片。"));
    };

    reader.onerror = () => {
      reject(new Error("無法讀取圖片。"));
    };

    reader.readAsDataURL(file);
  });
}

function downloadImage(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function ImageEditPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [imageBase64, setImageBase64] = useState("");
  const [imageName, setImageName] = useState("");
  const [editPrompt, setEditPrompt] = useState("把背景換成白色，保留商品主體與自然陰影。");
  const [resultText, setResultText] = useState("");
  const [resultImageUrl, setResultImageUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [comparePosition, setComparePosition] = useState(50);

  const hasOriginalImage = useMemo(() => Boolean(imageBase64), [imageBase64]);
  const hasResultImage = useMemo(() => Boolean(resultImageUrl), [resultImageUrl]);

  async function handleFile(file: File) {
    try {
      const dataUrl = await fileToDataUrl(file);
      setImageBase64(dataUrl);
      setImageName(file.name);
      setResultImageUrl("");
      setResultText("");
      setError("");
      setComparePosition(50);
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : "圖片上傳失敗。");
    }
  }

  async function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await handleFile(file);
  }

  async function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    await handleFile(file);
  }

  function handleQuickPrompt(prompt: string) {
    setEditPrompt(prompt);
  }

  async function submitEdit() {
    if (!imageBase64) {
      setError("請先上傳圖片。");
      return;
    }

    if (!editPrompt.trim()) {
      setError("請輸入編輯指令。");
      return;
    }

    setLoading(true);
    setError("");
    setResultText("");
    setResultImageUrl("");

    try {
      const response = await fetch("/api/image-edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64,
          editPrompt: editPrompt.trim(),
        }),
      });

      const payload = (await response.json()) as EditResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "圖片編輯失敗。");
      }

      if (payload.imageUrl) {
        setResultImageUrl(payload.imageUrl);
        setComparePosition(50);
        return;
      }

      if (payload.result) {
        setResultText(payload.result);
        return;
      }

      throw new Error("沒有收到可用的編輯結果。");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "圖片編輯失敗。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-12 pt-20 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-orange-300">
            Image Edit
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">AI 圖片編輯器</h1>
          <p className="mx-auto mt-4 max-w-3xl text-gray-300">
            上傳商品圖，輸入修改需求，讓 AI 幫你生成新版圖片或給出具體修改建議。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-black/20">
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition ${
                isDragging
                  ? "border-orange-300 bg-orange-400/10"
                  : "border-white/15 bg-gray-950/70 hover:border-orange-300/40"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileInput}
                className="hidden"
              />
              <span className="text-lg font-black text-orange-100">1. 圖片上傳區</span>
              <span className="mt-2 text-sm leading-7 text-gray-400">
                拖曳圖片到這裡，或點擊上傳。支援 JPG、PNG、WebP。
              </span>
            </label>

            {hasOriginalImage ? (
              <div className="mt-5 rounded-3xl border border-white/10 bg-gray-950/80 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-orange-100">{imageName}</p>
                    <p className="mt-1 text-xs text-gray-400">已上傳原圖，AI 會依此做分析或編輯。</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImageBase64("");
                      setImageName("");
                      setResultImageUrl("");
                      setResultText("");
                    }}
                    className="rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-gray-300 transition hover:border-red-300/40 hover:text-red-200"
                  >
                    清除
                  </button>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageBase64}
                  alt="上傳原圖"
                  className="mt-4 max-h-64 w-full rounded-2xl object-contain"
                />
              </div>
            ) : null}

            <div className="mt-6">
              <label className="mb-3 block text-sm font-black uppercase tracking-[0.2em] text-orange-200">
                2. 編輯指令
              </label>
              <textarea
                value={editPrompt}
                onChange={(event) => setEditPrompt(event.target.value)}
                rows={6}
                className="w-full rounded-2xl border border-white/10 bg-gray-950/80 px-4 py-4 text-base text-white outline-none transition focus:border-orange-300/70"
                placeholder="例如：把背景換成白色、移除背景、讓商品看起來更有質感。"
              />
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-orange-200">
                3. 快速指令
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {quickPrompts.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleQuickPrompt(item.prompt)}
                    className="rounded-2xl border border-white/10 bg-gray-950/70 px-4 py-4 text-left text-sm font-bold text-gray-200 transition hover:border-orange-300/40 hover:bg-gray-950"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={submitEdit}
                disabled={loading}
                className="rounded-full bg-orange-500 px-6 py-3 text-sm font-black text-gray-950 transition hover:-translate-y-1 hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-300 disabled:hover:translate-y-0"
              >
                {loading ? "處理中..." : "開始編輯"}
              </button>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold leading-7 text-red-200">
                {error}
              </div>
            ) : null}
          </section>

          <section className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-black/20">
              <div className="mb-5">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-orange-300">
                  Result
                </p>
                <h2 className="mt-2 text-3xl font-black text-orange-100">4. AI 分析結果顯示</h2>
              </div>

              <div className="rounded-3xl bg-gray-950/80 p-5">
                {loading ? (
                  <div className="grid gap-4">
                    <div className="h-10 w-48 animate-pulse rounded-2xl bg-white/10" />
                    <div className="h-80 w-full animate-pulse rounded-3xl bg-white/10" />
                  </div>
                ) : hasResultImage ? (
                  <div className="space-y-4">
                    <div className="group relative overflow-hidden rounded-3xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resultImageUrl}
                        alt="AI 編輯結果"
                        className="max-h-[520px] w-full rounded-3xl object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => downloadImage(resultImageUrl, "edited-image.png")}
                        className="absolute right-4 bottom-4 rounded-full bg-orange-500 px-5 py-2 text-sm font-black text-gray-950 opacity-0 transition group-hover:opacity-100"
                      >
                        下載圖片
                      </button>
                    </div>
                    <p className="text-sm font-bold text-gray-400">AI 已直接生成新版圖片。</p>
                  </div>
                ) : resultText ? (
                  <div className="rounded-3xl border border-white/10 bg-gray-950 p-5 text-base leading-8 text-gray-200">
                    {resultText}
                  </div>
                ) : (
                  <div className="py-16 text-center text-gray-500">
                    尚未產生分析或編輯結果
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-black/20">
              <div className="mb-5">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-orange-300">
                  Compare
                </p>
                <h2 className="mt-2 text-3xl font-black text-orange-100">5. 對比顯示</h2>
              </div>

              {!hasOriginalImage || !hasResultImage ? (
                <div className="rounded-3xl bg-gray-950/80 p-10 text-center text-gray-500">
                  需要同時有原圖與 AI 生成圖片，才能使用左右滑桿比較。
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative mx-auto aspect-square max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-gray-950/80">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageBase64}
                      alt="原圖"
                      className="absolute inset-0 h-full w-full object-contain"
                    />
                    <div
                      className="absolute inset-y-0 left-0 overflow-hidden"
                      style={{ width: `${comparePosition}%` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resultImageUrl}
                        alt="編輯結果"
                        className="h-full w-full object-contain"
                        style={{ width: `${100 / (comparePosition / 100)}%` }}
                      />
                    </div>
                    <div
                      className="absolute inset-y-0 w-1 bg-orange-400"
                      style={{ left: `calc(${comparePosition}% - 2px)` }}
                    />
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={comparePosition}
                    onChange={(event) => setComparePosition(Number(event.target.value))}
                    className="w-full accent-orange-400"
                  />

                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
                    <span>原圖</span>
                    <span>AI 結果</span>
                  </div>
                </div>
              )}
            </section>
          </section>
        </div>
      </section>
    </main>
  );
}

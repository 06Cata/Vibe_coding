"use client";

import Image from "next/image";
import { ChangeEvent, useMemo, useState } from "react";

type StyleOption = "realistic" | "cartoon" | "minimalist" | "watercolor";
type ProviderOption = "gpt" | "gemini";

type TemplateOption = {
  title: string;
  prompt: string;
};

type GalleryItem = {
  id: string;
  prompt: string;
  style: StyleOption;
  size: string;
  provider: ProviderOption;
  createdAt: string;
};

const GALLERY_STORAGE_KEY = "image-gen-gallery";

const styleOptions: Array<{
  value: StyleOption;
  label: string;
  emoji: string;
}> = [
  { value: "realistic", label: "寫實", emoji: "🖼️" },
  { value: "cartoon", label: "卡通", emoji: "🎨" },
  { value: "minimalist", label: "極簡", emoji: "✏️" },
  { value: "watercolor", label: "水彩", emoji: "💧" },
];

const templateOptions: TemplateOption[] = [
  {
    title: "白底商品圖",
    prompt:
      "請維持商品原始真實感，生成白底商品攝影圖，主體置中、光線均勻、乾淨陰影、商業電商感，適合商品頁展示。",
  },
  {
    title: "生活情境商品圖",
    prompt:
      "請維持商品原始真實感，生成商品置於生活情境中的照片，畫面自然、有使用場景、光線柔和，讓商品更有帶入感。",
  },
  {
    title: "高質感商品圖",
    prompt:
      "請維持商品原始真實感，生成高質感商品形象照，帶有精品感、細緻打光、乾淨構圖與高級品牌視覺氛圍。",
  },
];

function downloadImage(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

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

function loadGalleryFromStorage() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(GALLERY_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Partial<GalleryItem>[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is GalleryItem =>
        typeof item?.id === "string" &&
        typeof item?.prompt === "string" &&
        typeof item?.style === "string" &&
        typeof item?.size === "string" &&
        typeof item?.provider === "string" &&
        typeof item?.createdAt === "string",
    );
  } catch {
    return [];
  }
}

export default function ImageGenPage() {
  const [prompt, setPrompt] = useState(
    "請幫我生成一張台灣甜點商品圖，風格精緻、適合社群貼文使用。",
  );
  const [provider, setProvider] = useState<ProviderOption>("gpt");
  const [style, setStyle] = useState<StyleOption>("realistic");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gallery, setGallery] = useState<GalleryItem[]>(() => loadGalleryFromStorage());
  const [productImage, setProductImage] = useState("");
  const [productImageName, setProductImageName] = useState("");
  const [width, setWidth] = useState("1024");
  const [height, setHeight] = useState("1024");

  const hasProductImage = useMemo(() => Boolean(productImage), [productImage]);

  function persistGallery(nextGallery: GalleryItem[]) {
    setGallery(nextGallery);

    try {
      window.localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(nextGallery));
    } catch {
      setError("最近生成紀錄已滿，已停止把圖片結果存進瀏覽器。");
    }
  }

  async function generateImage() {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      setError("請先輸入圖片描述。");
      return;
    }

    const widthValue = Number.parseInt(width, 10);
    const heightValue = Number.parseInt(height, 10);

    if (!Number.isFinite(widthValue) || !Number.isFinite(heightValue) || widthValue <= 0 || heightValue <= 0) {
      setError("請輸入正確的圖片尺寸。");
      return;
    }

    setLoading(true);
    setError("");
    setImageUrl("");

    try {
      const response = await fetch("/api/image-gen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          provider,
          style,
          productImage: productImage || undefined,
          size: `${widthValue}x${heightValue}`,
        }),
      });

      const payload = (await response.json()) as { imageUrl?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "圖片生成失敗。");
      }

      if (!payload.imageUrl) {
        throw new Error("沒有收到圖片結果。");
      }

      setImageUrl(payload.imageUrl);

      const nextItem: GalleryItem = {
        id: `${Date.now()}`,
        prompt: trimmedPrompt,
        provider,
        style,
        size: `${widthValue}x${heightValue}`,
        createdAt: new Date().toISOString(),
      };

      persistGallery([nextItem, ...gallery].slice(0, 6));
    } catch (generationError) {
      setError(
        generationError instanceof Error ? generationError.message : "圖片生成失敗。",
      );
    } finally {
      setLoading(false);
    }
  }

  function applyTemplate(template: TemplateOption) {
    setPrompt(template.prompt);
  }

  async function handleProductImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setProductImage(dataUrl);
      setProductImageName(file.name);
      setError("");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "商品圖上傳失敗。");
    }
  }

  function clearProductImage() {
    setProductImage("");
    setProductImageName("");
  }

  function loadGalleryItem(item: GalleryItem) {
    setPrompt(item.prompt);
    setStyle(item.style);
    setProvider(item.provider);

    const [savedWidth, savedHeight] = item.size.split("x", 2);

    if (savedWidth) {
      setWidth(savedWidth);
    }

    if (savedHeight) {
      setHeight(savedHeight);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-12 pt-20 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-orange-300">
            Image Generator
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">AI 圖片生成器</h1>
          <p className="mx-auto mt-4 max-w-3xl text-gray-300">
            支援中文 prompt、風格切換與商品攝影模板，快速產出可下載的圖片。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
          <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-black/20">
            <label className="mb-3 block text-sm font-black uppercase tracking-[0.2em] text-orange-200">
              1. 提示詞
            </label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={8}
              className="w-full rounded-2xl border border-white/10 bg-gray-950/80 px-4 py-4 text-base text-white outline-none transition focus:border-orange-300/70"
              placeholder="輸入你想生成的畫面，中文也可以。"
            />

            <div className="mt-6">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-orange-200">
                2. 商品攝影模板
              </p>
              <div className="space-y-3">
                {templateOptions.map((template) => (
                  <button
                    key={template.title}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="block w-full rounded-2xl border border-white/10 bg-gray-950/70 px-4 py-4 text-left transition hover:border-orange-300/40 hover:bg-gray-950"
                  >
                    <p className="text-sm font-black text-orange-100">{template.title}</p>
                    <p className="mt-1 text-sm leading-6 text-gray-400">{template.prompt}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-orange-200">
                3. 尺寸選擇
              </p>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <input
                  type="number"
                  min="1"
                  value={width}
                  onChange={(event) => setWidth(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-gray-950/80 px-4 py-3 text-base text-white outline-none transition focus:border-orange-300/70"
                  placeholder="寬"
                />
                <span className="text-sm font-black text-gray-400">x</span>
                <input
                  type="number"
                  min="1"
                  value={height}
                  onChange={(event) => setHeight(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-gray-950/80 px-4 py-3 text-base text-white outline-none transition focus:border-orange-300/70"
                  placeholder="高"
                />
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-orange-200">
                4. 風格選擇
              </p>
              <div className="grid grid-cols-2 gap-3">
                {styleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStyle(option.value)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      style === option.value
                        ? "border-orange-300 bg-orange-400/10 text-white"
                        : "border-white/10 bg-gray-950/70 text-gray-300 hover:border-orange-300/40"
                    }`}
                  >
                    <div className="text-2xl">{option.emoji}</div>
                    <div className="mt-2 text-sm font-black">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-orange-200">
                5. 商品圖上傳
              </p>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-gray-950/60 px-4 py-6 text-center transition hover:border-orange-300/40 hover:bg-gray-950">
                <span className="text-sm font-bold text-orange-100">上傳商品圖</span>
                <span className="mt-2 text-sm text-gray-400">
                  支援 JPG / PNG / WEBP，模型會參考商品圖再生成。
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleProductImageUpload}
                  className="hidden"
                />
              </label>

              {hasProductImage ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-gray-950/80 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-orange-100">{productImageName}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        已上傳商品圖，生成時會和文字 prompt 一起送出。
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearProductImage}
                      className="rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-gray-300 transition hover:border-red-300/40 hover:text-red-200"
                    >
                      移除
                    </button>
                  </div>
                  <div className="relative mt-4 aspect-square w-28 overflow-hidden rounded-2xl border border-white/10">
                    <Image
                      src={productImage}
                      alt="已上傳商品圖"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-6">
              <label className="mb-3 block text-sm font-black uppercase tracking-[0.2em] text-orange-200">
                6. 模型提供者
              </label>
              <select
                value={provider}
                onChange={(event) => setProvider(event.target.value as ProviderOption)}
                className="w-full rounded-2xl border border-white/10 bg-gray-950/80 px-4 py-4 text-base text-white outline-none transition focus:border-orange-300/70"
              >
                <option value="gpt">GPT</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={generateImage}
                disabled={loading}
                className="rounded-full bg-orange-500 px-6 py-3 text-sm font-black text-gray-950 transition hover:-translate-y-1 hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-300 disabled:hover:translate-y-0"
              >
                {loading ? "生成中..." : "7. 生成圖片"}
              </button>
              {imageUrl ? (
                <button
                  type="button"
                  onClick={generateImage}
                  disabled={loading}
                  className="rounded-full border border-orange-300/50 px-5 py-3 text-sm font-black text-orange-100 transition hover:bg-orange-400/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-gray-400"
                >
                  再生成一張
                </button>
              ) : null}
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold leading-7 text-red-200">
                {error}
              </div>
            ) : null}
          </section>

          <section className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-black/20">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-orange-300">
                    Result
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-orange-100">8. 結果顯示</h2>
                </div>
              </div>

              <div className="flex min-h-[520px] items-center justify-center rounded-3xl bg-gray-950/80 p-5">
                {loading ? (
                  <div className="grid w-full gap-4">
                    <div className="h-10 w-40 animate-pulse rounded-2xl bg-white/10" />
                    <div className="h-80 w-full animate-pulse rounded-3xl bg-white/10" />
                    <div className="h-10 w-32 animate-pulse rounded-2xl bg-white/10" />
                  </div>
                ) : imageUrl ? (
                  <div className="group relative w-full animate-[fade-in_0.5s_ease-out]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="AI generated result"
                      className="max-h-[480px] w-full rounded-2xl object-contain"
                    />
                    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/0 transition group-hover:bg-black/25" />
                    <button
                      type="button"
                      onClick={() => downloadImage(imageUrl, "ai-image.png")}
                      className="absolute right-4 bottom-4 rounded-full bg-orange-500 px-5 py-2 text-sm font-black text-gray-950 opacity-0 transition group-hover:opacity-100"
                    >
                      下載圖片
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">尚未生成圖片</div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-black/20">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-orange-300">
                    Gallery
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-orange-100">9. 最近生成的圖片</h2>
                </div>
                <p className="text-sm font-bold text-gray-400">最近 6 張</p>
              </div>

              {gallery.length === 0 ? (
                <div className="rounded-3xl bg-gray-950/80 p-10 text-center text-gray-500">
                  尚無圖片紀錄
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {gallery.map((item) => (
                    <div
                      key={item.id}
                      className="group overflow-hidden rounded-3xl border border-white/10 bg-gray-950/80"
                    >
                      <div className="relative">
                        <div className="flex h-52 w-full items-center justify-center bg-gray-900 px-4 text-center text-sm font-bold leading-6 text-gray-300">
                          {item.prompt}
                        </div>
                        <div className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/30" />
                      </div>
                      <div className="p-4">
                        <p className="line-clamp-3 text-sm leading-6 text-gray-300">{item.prompt}</p>
                        <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-orange-300">
                          {item.provider} · {item.style} · {item.size}
                        </p>
                        <button
                          type="button"
                          onClick={() => loadGalleryItem(item)}
                          className="mt-4 rounded-full border border-orange-300/40 px-4 py-2 text-xs font-black text-orange-100 transition hover:bg-orange-400/10"
                        >
                          載入到表單
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </section>
        </div>
      </section>
    </main>
  );
}

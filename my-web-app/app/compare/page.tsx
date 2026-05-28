"use client";

import { useMemo, useState } from "react";

type ProviderKey = "openai" | "gemini";

type ProviderState = {
  label: string;
  endpoint: string;
  model: string;
};

type CompareResult = {
  result: string;
  elapsedMs: number;
  error: string | null;
};

const providers: Record<ProviderKey, ProviderState> = {
  openai: {
    label: "OpenAI",
    endpoint: "/api/openai",
    model: "gpt-4o-mini",
  },
  gemini: {
    label: "Gemini",
    endpoint: "/api/gemini",
    model: "gemini-2.5-flash",
  },
};

const initialResults: Record<ProviderKey, CompareResult | null> = {
  openai: null,
  gemini: null,
};

function isImageResult(value: string) {
  if (value.startsWith("data:image/")) {
    return true;
  }

  return /^https?:\/\/.+\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(value.trim());
}

function downloadImage(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function ComparePage() {
  const [prompt, setPrompt] = useState("用三句話介紹你自己。");
  const [results, setResults] = useState<Record<ProviderKey, CompareResult | null>>(initialResults);
  const [running, setRunning] = useState(false);
  const [copyState, setCopyState] = useState<ProviderKey | null>(null);

  const canRun = useMemo(() => prompt.trim().length > 0 && !running, [prompt, running]);

  async function runComparison() {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      return;
    }

    setRunning(true);
    setResults(initialResults);
    setCopyState(null);

    const entries = (Object.entries(providers) as Array<[ProviderKey, ProviderState]>).map(
      async ([key, provider]) => {
        const start = performance.now();

        try {
          const response = await fetch(provider.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt: trimmedPrompt }),
          });

          const payload = (await response.json()) as { result?: string; error?: string };
          const elapsedMs = Math.round(performance.now() - start);

          if (!response.ok) {
            return [
              key,
              {
                result: "",
                elapsedMs,
                error: payload.error ?? "Unknown API error.",
              },
            ] as const;
          }

          return [
            key,
            {
              result: payload.result ?? "",
              elapsedMs,
              error: null,
            },
          ] as const;
        } catch (error) {
          return [
            key,
            {
              result: "",
              elapsedMs: Math.round(performance.now() - start),
              error: error instanceof Error ? error.message : "Request failed.",
            },
          ] as const;
        }
      },
    );

    const resolved = await Promise.all(entries);

    setResults({
      openai: resolved.find(([key]) => key === "openai")?.[1] ?? null,
      gemini: resolved.find(([key]) => key === "gemini")?.[1] ?? null,
    });
    setRunning(false);
  }

  async function copyText(providerKey: ProviderKey, text: string) {
    await navigator.clipboard.writeText(text);
    setCopyState(providerKey);
    window.setTimeout(() => setCopyState(null), 1200);
  }

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-12 pt-20 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-orange-300">
            Model Compare
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">OpenAI vs Gemini</h1>
          <p className="mx-auto mt-4 max-w-3xl text-gray-300">
            同一個 prompt 同時送給兩個模型，直接比較回覆內容與回應時間。
          </p>
        </div>

        <div className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-black/20">
          <label className="mb-3 block text-sm font-black uppercase tracking-[0.2em] text-orange-200">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={6}
            className="w-full rounded-2xl border border-white/10 bg-gray-950/80 px-4 py-4 text-base text-white outline-none transition focus:border-orange-300/70"
            placeholder="輸入想比較的 prompt"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runComparison}
              disabled={!canRun}
              className="rounded-full bg-orange-500 px-6 py-3 text-sm font-black text-gray-950 transition hover:-translate-y-1 hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-300 disabled:hover:translate-y-0"
            >
              {running ? "比較中..." : "開始比較"}
            </button>
            <span className="text-sm font-bold text-gray-400">
              OpenAI：{providers.openai.model} / Gemini：{providers.gemini.model}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {(Object.entries(providers) as Array<[ProviderKey, ProviderState]>).map(([key, provider]) => {
            const data = results[key];
            const imageMode = data?.result ? isImageResult(data.result) : false;

            return (
              <section
                key={key}
                className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-black/20"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-orange-300">
                      {provider.label}
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-orange-100">{provider.model}</h2>
                  </div>
                  <div className="rounded-2xl bg-gray-950/70 px-4 py-3 text-right">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">回應時間</p>
                    <p className="mt-1 text-xl font-black text-white">
                      {data ? `${data.elapsedMs} ms` : "--"}
                    </p>
                  </div>
                </div>

                <div className="min-h-[360px] rounded-3xl bg-gray-950/80 p-5">
                  {!data ? (
                    <div className="flex h-full min-h-[320px] items-center justify-center text-center text-gray-500">
                      尚未送出比較
                    </div>
                  ) : data.error ? (
                    <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold leading-7 text-red-200">
                      {data.error}
                    </div>
                  ) : imageMode ? (
                    <div className="space-y-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={data.result}
                        alt={`${provider.label} result`}
                        className="max-h-[420px] w-full rounded-2xl object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => downloadImage(data.result, `${key}-result`)}
                        className="rounded-full bg-orange-500 px-5 py-2 text-sm font-black text-gray-950 transition hover:bg-orange-400"
                      >
                        下載圖片
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <pre className="whitespace-pre-wrap break-words font-sans text-base leading-8 text-gray-100">
                        {data.result}
                      </pre>
                      <button
                        type="button"
                        onClick={() => copyText(key, data.result)}
                        className="rounded-full border border-orange-300/50 px-5 py-2 text-sm font-black text-orange-100 transition hover:bg-orange-400/10"
                      >
                        {copyState === key ? "已複製" : "一鍵複製"}
                      </button>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";

type ToneOption = "活潑" | "專業" | "溫暖";
type PlatformOption = "Instagram" | "Facebook" | "LinkedIn";
type LanguageOption = "繁體中文" | "English" | "日本語";

type HistoryItem = {
  id: string;
  service: string;
  description: string;
  tone: ToneOption;
  platform: PlatformOption;
  language?: LanguageOption;
  result: string;
  createdAt: string;
};

const MAX_HISTORY = 5;

const toneOptions: Array<{ value: ToneOption; label: string }> = [
  { value: "活潑", label: "🎉 活潑有趣" },
  { value: "專業", label: "💼 專業權威" },
  { value: "溫暖", label: "💕 溫暖感性" },
];

const platformOptions: PlatformOption[] = ["Instagram", "Facebook", "LinkedIn"];
const languageOptions: Array<{ value: LanguageOption; label: string }> = [
  { value: "繁體中文", label: "繁體中文" },
  { value: "English", label: "English" },
  { value: "日本語", label: "日本語" },
];

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function CopywriterPage() {
  const [service, setService] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState<ToneOption>("活潑");
  const [platform, setPlatform] = useState<PlatformOption>("Instagram");
  const [language, setLanguage] = useState<LanguageOption>("繁體中文");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [lastSubmitted, setLastSubmitted] = useState<{
    service: string;
    description: string;
    tone: ToneOption;
    platform: PlatformOption;
    language: LanguageOption;
  } | null>(null);

  async function fetchHistory() {
    try {
      setHistoryLoading(true);
      const response = await fetch("/api/copywriter/history", { cache: "no-store" });
      const data = (await response.json()) as { history?: HistoryItem[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "讀取歷史失敗。");
      }

      setHistory((data.history ?? []).slice(0, MAX_HISTORY));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "讀取歷史失敗。");
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void fetchHistory();
    });
  }, []);

  const charCount = useMemo(() => result.length, [result]);
  const canSubmit = service.trim() && description.trim() && !loading;

  async function generateCopy(payload?: {
    service: string;
    description: string;
    tone: ToneOption;
    platform: PlatformOption;
    language: LanguageOption;
  }) {
    const nextPayload = payload ?? {
      service: service.trim(),
      description: description.trim(),
      tone,
      platform,
      language,
    };

    if (!nextPayload.service || !nextPayload.description) {
      return;
    }

    setLoading(true);
    setError("");
    setCopied(false);
    setResult("");

    try {
      const response = await fetch("/api/copywriter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextPayload),
      });

      const data = (await response.json()) as { result?: string; error?: string };

      if (!response.ok || !data.result) {
        throw new Error(data.error ?? "生成貼文失敗。");
      }

      setLastSubmitted(nextPayload);
      setResult(data.result);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "生成貼文失敗。");
    } finally {
      setLoading(false);
    }
  }

  async function copyResult() {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(result);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function handleSaveHistory() {
    if (!result) {
      return;
    }

    try {
      const response = await fetch("/api/copywriter/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service: service.trim(),
          description: description.trim(),
          tone,
          platform,
          language,
          result,
        }),
      });

      const data = (await response.json()) as { history?: HistoryItem[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "儲存歷史失敗。");
      }

      setHistory((data.history ?? []).slice(0, MAX_HISTORY));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "儲存歷史失敗。");
    }
  }

  function loadHistoryItem(item: HistoryItem) {
    setService(item.service);
    setDescription(item.description);
    setTone(item.tone);
    setPlatform(item.platform);
    setLanguage(item.language ?? "繁體中文");
    setError("");
    setCopied(false);
    setResult(item.result);
    setLastSubmitted({
      service: item.service,
      description: item.description,
      tone: item.tone,
      platform: item.platform,
      language: item.language ?? "繁體中文",
    });
  }

  async function deleteHistory(id: string) {
    try {
      const response = await fetch("/api/copywriter/history", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "刪除歷史失敗。");
      }

      setHistory(history.filter((item) => item.id !== id));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "刪除歷史失敗。");
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-12 pt-24 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-black/20">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-orange-300">Copywriter AI</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-orange-100">AI 貼文產生器</h1>
          <p className="mt-4 leading-7 text-gray-300">
            用固定品牌語氣快速產出台灣小商家的社群貼文，直接比較主題、語氣與平台差異。
          </p>

          <form
            className="mt-8 space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void generateCopy();
            }}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-gray-200">1. 服務 / 產品名稱</span>
              <input
                value={service}
                onChange={(event) => setService(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-gray-950/80 px-4 py-3 text-base text-white outline-none transition focus:border-orange-300"
                placeholder="例如：手作甜點店"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-gray-200">2. 這次想推廣什麼？</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-36 w-full rounded-2xl border border-white/10 bg-gray-950/80 px-4 py-3 text-base text-white outline-none transition focus:border-orange-300"
                placeholder="例如：母親節限定草莓生乳酪蛋糕，想吸引附近上班族預購。"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-gray-200">3. 貼文風格</span>
              <select
                value={tone}
                onChange={(event) => setTone(event.target.value as ToneOption)}
                className="w-full rounded-2xl border border-white/10 bg-gray-950/80 px-4 py-3 text-base text-white outline-none transition focus:border-orange-300"
              >
                {toneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <fieldset>
              <legend className="mb-3 block text-sm font-bold text-gray-200">4. 平台選擇</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {platformOptions.map((option) => (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center justify-center rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                      platform === option
                        ? "border-orange-300 bg-orange-500/15 text-orange-100"
                        : "border-white/10 bg-gray-950/60 text-gray-300 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="platform"
                      value={option}
                      checked={platform === option}
                      onChange={() => setPlatform(option)}
                      className="sr-only"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-gray-200">5. 輸出語言</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as LanguageOption)}
                className="w-full rounded-2xl border border-white/10 bg-gray-950/80 px-4 py-3 text-base text-white outline-none transition focus:border-orange-300"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-full bg-orange-500 px-6 py-4 text-lg font-black text-gray-950 transition hover:scale-[1.01] hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "生成中..." : "✨ 幫我生貼文"}
            </button>
          </form>
        </section>

        <section className="space-y-8">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-black/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-orange-300">結果區塊</p>
                <h2 className="mt-2 text-3xl font-black text-orange-100">生成貼文</h2>
              </div>
              <div className="rounded-2xl bg-gray-950/70 px-4 py-3 text-sm font-bold text-gray-200">
                字數統計 <span className="ml-2 text-xl font-black text-white">{charCount}</span>
              </div>
            </div>

            <div className="mt-6 min-h-[320px] rounded-3xl bg-gray-950/80 p-5">
              {error ? (
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold leading-7 text-red-200">
                  {error}
                </div>
              ) : result ? (
                <pre className="whitespace-pre-wrap break-words font-sans text-base leading-8 text-gray-100">
                  {result}
                </pre>
              ) : (
                <div className="flex h-full min-h-[280px] items-center justify-center text-center text-gray-500">
                  送出需求後，這裡會顯示完整貼文內容。
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void copyResult()}
                disabled={!result}
                className="rounded-full border border-orange-300/40 px-5 py-3 text-sm font-black text-orange-100 transition hover:bg-orange-400/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {copied ? "已複製" : "複製貼文"}
              </button>
              <button
                type="button"
                onClick={() => void (lastSubmitted ? generateCopy(lastSubmitted) : generateCopy())}
                disabled={!lastSubmitted || loading}
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-black text-gray-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                重新生成
              </button>
              <button
                type="button"
                onClick={() => void handleSaveHistory()}
                disabled={!result}
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-black text-gray-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                儲存到歷史記錄
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-orange-300">History</p>
                <h2 className="mt-2 text-3xl font-black text-orange-100">最近 5 筆</h2>
              </div>
              <span className="text-sm font-bold text-gray-400">{history.length} / 5</span>
            </div>

            <div className="mt-6 space-y-4">
              {historyLoading ? (
                <div className="rounded-2xl bg-gray-950/70 px-4 py-5 text-sm font-bold text-gray-400">
                  正在載入歷史記錄...
                </div>
              ) : history.length === 0 ? (
                <div className="rounded-2xl bg-gray-950/70 px-4 py-5 text-sm font-bold text-gray-400">
                  還沒有儲存過貼文。
                </div>
              ) : (
                history.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-gray-950/70 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-black text-white">{item.service}</h3>
                        <p className="mt-1 text-sm font-bold text-orange-200">
                          {item.platform} / {item.tone} / {(item.language ?? "繁體中文")} / {formatTime(item.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => loadHistoryItem(item)}
                          className="rounded-full border border-orange-300/40 px-4 py-2 text-xs font-black text-orange-100 transition hover:bg-orange-400/10"
                        >
                          重新載入
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteHistory(item.id)}
                          className="rounded-full border border-red-400/30 px-4 py-2 text-xs font-black text-red-200 transition hover:bg-red-500/10"
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                    <p className="mt-4 line-clamp-3 leading-7 text-gray-300">{item.result}</p>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

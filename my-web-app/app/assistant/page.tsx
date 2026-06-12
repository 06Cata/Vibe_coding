"use client";

import { FormEvent, KeyboardEvent, useMemo, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
};

type AssistantResponse = {
  result?: string;
  imageUrl?: string;
  error?: string;
};

let messageSequence = 0;

function createMessageId(role: "user" | "assistant") {
  messageSequence += 1;
  return `${role}-${messageSequence}`;
}

const promptExamples = [
  "台北現在天氣怎樣？",
  "幫我畫一隻橘色的貓",
  "現在幾點？",
];

function inferToolStatus(prompt: string) {
  const normalized = prompt.toLowerCase();

  if (
    prompt.includes("天氣") ||
    normalized.includes("weather")
  ) {
    return "🔧 正在查詢天氣...";
  }

  if (
    prompt.includes("畫") ||
    prompt.includes("圖片") ||
    prompt.includes("生成") ||
    normalized.includes("image") ||
    normalized.includes("draw")
  ) {
    return "🎨 正在生成圖片...";
  }

  if (
    prompt.includes("幾點") ||
    prompt.includes("時間") ||
    normalized.includes("time")
  ) {
    return "🕒 正在查詢目前時間...";
  }

  return "🤖 正在思考中...";
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toolStatus, setToolStatus] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function sendMessage(prompt: string) {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || loading) {
      return;
    }

    const userMessage: Message = {
      id: createMessageId("user"),
      role: "user",
      content: trimmedPrompt,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);
    setError("");
    setToolStatus(inferToolStatus(trimmedPrompt));

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: trimmedPrompt }),
      });

      const payload = (await response.json()) as AssistantResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "AI 助理回覆失敗。");
      }

      if (!payload.result) {
        throw new Error("沒有收到 AI 回覆內容。");
      }

      const assistantMessage: Message = {
        id: createMessageId("assistant"),
        role: "assistant",
        content: payload.result,
        imageUrl: payload.imageUrl,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "AI 助理回覆失敗。");
    } finally {
      setLoading(false);
      setToolStatus("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(input);
  }

  async function handleExampleClick(prompt: string) {
    setInput(prompt);
    await sendMessage(prompt);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (canSubmit) {
        void sendMessage(input);
      }
    }
  }

  function clearConversation() {
    setMessages([]);
    setInput("");
    setError("");
    setToolStatus("");
  }

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-12 pt-20 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-orange-300">
              Assistant
            </p>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">AI 助理</h1>
            <p className="mt-4 max-w-3xl text-gray-300">
              可查時間、查天氣、生成圖片，並在同一個對話中整合工具結果。
            </p>
          </div>
          <button
            type="button"
            onClick={clearConversation}
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-black text-gray-200 transition hover:border-orange-300/40 hover:bg-white/5"
          >
            清除對話
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          {promptExamples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => void handleExampleClick(example)}
              disabled={loading}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-gray-200 transition hover:border-orange-300/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {example}
            </button>
          ))}
        </div>

        <section className="flex min-h-[60vh] flex-1 flex-col rounded-3xl border border-white/10 bg-white/10 shadow-xl shadow-black/20">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-80 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-gray-950/40 text-center text-gray-500">
                先輸入一句話，開始和 AI 助理對話。
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex animate-[slide-in_0.25s_ease-out] ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-3xl rounded-3xl px-5 py-4 shadow-lg ${
                      message.role === "user"
                        ? "bg-orange-500 text-gray-950"
                        : "border border-white/10 bg-gray-950/80 text-gray-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-base leading-8">{message.content}</p>
                    {message.imageUrl ? (
                      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={message.imageUrl}
                          alt="Assistant generated"
                          className="max-h-[420px] w-full object-contain"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}

            {loading ? (
              <div className="flex justify-start">
                <div className="max-w-xl rounded-3xl border border-white/10 bg-gray-950/80 px-5 py-4 text-gray-100 shadow-lg">
                  {toolStatus ? (
                    <p className="mb-3 text-sm font-bold text-orange-200">{toolStatus}</p>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-gray-300 [animation-delay:-0.2s]" />
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-gray-300 [animation-delay:-0.1s]" />
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-gray-300" />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-white/10 px-5 py-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={4}
                className="w-full rounded-3xl border border-white/10 bg-gray-950/80 px-4 py-4 text-base text-white outline-none transition focus:border-orange-300/70"
                placeholder="輸入你的問題，例如：台北現在天氣怎樣？"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                {error ? (
                  <p className="text-sm font-bold text-red-300">{error}</p>
                ) : (
                  <p className="text-sm text-gray-500">Enter 送出，Shift + Enter 換行</p>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="rounded-full bg-orange-500 px-6 py-3 text-sm font-black text-gray-950 transition hover:-translate-y-1 hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-300 disabled:hover:translate-y-0"
                >
                  送出
                </button>
              </div>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}

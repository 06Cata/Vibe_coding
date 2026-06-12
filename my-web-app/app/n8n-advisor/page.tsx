"use client";

import { FormEvent, KeyboardEvent, useMemo, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sections?: AdvisorSections;
};

type AdvisorResponse = {
  result?: string;
  sections?: AdvisorSections;
  error?: string;
};

type AdvisorSections = {
  automations: string;
  workflow: string;
  timeSaved: string;
  difficulty: string;
  firstStep: string;
};

const quickBusinessTypes = [
  {
    emoji: "🛍️",
    label: "網路賣家",
    prompt:
      "我是網路賣家，主要賣居家小物。訂單來自 Shopify 和 Instagram 私訊，常常要手動整理訂單、出貨通知和售後追蹤，請幫我規劃可行的 n8n 自動化。",
  },
  {
    emoji: "🏪",
    label: "實體店家",
    prompt:
      "我是實體店家，有門市活動和會員名單，會用 Gmail 和 Google Sheets 管理報名與通知。請幫我規劃可自動化的流程。",
  },
  {
    emoji: "💆",
    label: "服務業",
    prompt:
      "我是服務業店家，客人會用 LINE 和 Instagram 預約，常常要人工提醒、確認、記錄到 Notion。請幫我設計 n8n workflow。",
  },
  {
    emoji: "📱",
    label: "社群創作者",
    prompt:
      "我是社群創作者，想把品牌合作、貼文排程、素材整理和回覆名單自動化。請用 n8n 角度幫我規劃。",
  },
];

let messageSequence = 0;

function createMessageId(role: "user" | "assistant") {
  messageSequence += 1;
  return `${role}-${messageSequence}`;
}

function SectionCard({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-orange-200">
        {title}
      </h3>
      <p className="whitespace-pre-wrap text-sm leading-7 text-gray-200">{content || "—"}</p>
    </article>
  );
}

function formatMarkdownExport(message: Message) {
  const sections = message.sections;

  if (!sections) {
    return message.content;
  }

  return [
    "## 可自動化流程",
    sections.automations,
    "",
    "## workflow 步驟",
    sections.workflow,
    "",
    "## 節省時間",
    sections.timeSaved,
    "",
    "## 難度",
    sections.difficulty,
    "",
    "## 馬上可以開始做",
    sections.firstStep,
  ].join("\n");
}

function formatNotionExport(message: Message) {
  const sections = message.sections;

  if (!sections) {
    return message.content;
  }

  return [
    "可自動化流程",
    sections.automations,
    "",
    "workflow 步驟",
    sections.workflow,
    "",
    "節省時間",
    sections.timeSaved,
    "",
    "難度",
    sections.difficulty,
    "",
    "馬上可以開始做",
    sections.firstStep,
  ].join("\n");
}

export default function N8nAdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedState, setCopiedState] = useState<"" | "markdown" | "notion">("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftLabel, setDraftLabel] = useState("");

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
    setCopiedState("");

    try {
      const response = await fetch("/api/n8n-advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: trimmedPrompt }),
      });

      const payload = (await response.json()) as AdvisorResponse;

      if (!response.ok || !payload.result) {
        throw new Error(payload.error ?? "n8n 顧問回覆失敗。");
      }

      const assistantMessage: Message = {
        id: createMessageId("assistant"),
        role: "assistant",
        content: payload.result,
        sections: payload.sections,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "n8n 顧問回覆失敗。");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(input);
  }

  function openQuickPrompt(label: string, prompt: string) {
    setDraftLabel(label);
    setDraftPrompt(prompt);
    setDialogOpen(true);
  }

  async function submitDraftPrompt() {
    const nextPrompt = draftPrompt.trim();

    if (!nextPrompt) {
      return;
    }

    setDialogOpen(false);
    setInput(nextPrompt);
    await sendMessage(nextPrompt);
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
    setCopiedState("");
  }

  async function copyExport(message: Message, format: "markdown" | "notion") {
    const text = format === "markdown" ? formatMarkdownExport(message) : formatNotionExport(message);
    await navigator.clipboard.writeText(text);
    setCopiedState(format);
    window.setTimeout(() => setCopiedState(""), 1500);
  }

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-12 pt-20 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-orange-300">
              n8n Advisor
            </p>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">n8n 自動化顧問</h1>
            <p className="mt-4 max-w-3xl text-gray-300">
              描述你的業務流程，取得可自動化項目、workflow 步驟、節省時間估算與實作難度。
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

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickBusinessTypes.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => openQuickPrompt(item.label, item.prompt)}
              disabled={loading}
              className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-left transition hover:-translate-y-1 hover:border-orange-300/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="mb-2 text-2xl">{item.emoji}</div>
              <div className="text-lg font-black text-orange-100">{item.label}</div>
            </button>
          ))}
        </div>

        {dialogOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
            <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-gray-950 p-6 shadow-2xl shadow-black/40">
              <div className="mb-4">
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-orange-300">
                  快速需求
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">{draftLabel}</h2>
                <p className="mt-2 text-sm leading-7 text-gray-400">
                  你可以先修改內容，再送給 n8n 顧問。
                </p>
              </div>

              <textarea
                value={draftPrompt}
                onChange={(event) => setDraftPrompt(event.target.value)}
                rows={8}
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-base text-white outline-none transition focus:border-orange-300/70"
              />

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-full border border-white/10 px-5 py-3 text-sm font-black text-gray-200 transition hover:border-white/20 hover:bg-white/5"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => void submitDraftPrompt()}
                  className="rounded-full bg-orange-500 px-5 py-3 text-sm font-black text-gray-950 transition hover:bg-orange-400"
                >
                  套用並送出
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <section className="flex min-h-[60vh] flex-1 flex-col rounded-3xl border border-white/10 bg-white/10 shadow-xl shadow-black/20">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-80 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-gray-950/40 text-center text-gray-500">
                先選擇一種常見業務類型，或直接描述你的店務流程。
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
                    {message.role === "assistant" && message.sections ? (
                      <div className="mt-5 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <SectionCard title="可自動化流程" content={message.sections.automations} />
                          <SectionCard title="workflow 步驟" content={message.sections.workflow} />
                          <SectionCard title="節省時間" content={message.sections.timeSaved} />
                          <SectionCard title="難度" content={message.sections.difficulty} />
                        </div>
                        <SectionCard title="馬上可以開始做" content={message.sections.firstStep} />
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => void copyExport(message, "markdown")}
                            className="rounded-full border border-white/10 px-4 py-2 text-sm font-black text-gray-100 transition hover:border-orange-300/40 hover:bg-white/5"
                          >
                            匯出成 Markdown
                          </button>
                          <button
                            type="button"
                            onClick={() => void copyExport(message, "notion")}
                            className="rounded-full border border-white/10 px-4 py-2 text-sm font-black text-gray-100 transition hover:border-orange-300/40 hover:bg-white/5"
                          >
                            匯出成 Notion
                          </button>
                          {copiedState ? (
                            <span className="self-center text-xs font-bold text-orange-200">
                              已複製 {copiedState === "markdown" ? "Markdown" : "Notion"} 格式
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}

            {loading ? (
              <div className="flex justify-start">
                <div className="max-w-xl rounded-3xl border border-white/10 bg-gray-950/80 px-5 py-4 text-gray-100 shadow-lg">
                  <p className="mb-3 text-sm font-bold text-orange-200">🔧 正在規劃 n8n workflow...</p>
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
                placeholder="例如：我經營 Shopify 商店，訂單通知、出貨提醒、客服回覆都很分散，請幫我規劃 n8n 自動化。"
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
                  送出需求
                </button>
              </div>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}

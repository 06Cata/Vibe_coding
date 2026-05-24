"use client";

import { useMemo, useState } from "react";

type Choice = "A" | "B" | "C";

const questions = [
  {
    title: "週末你喜歡？",
    options: [
      { key: "A", label: "在家耍廢" },
      { key: "B", label: "出去冒險" },
      { key: "C", label: "找朋友聚會" },
    ],
  },
  {
    title: "面對問題你會？",
    options: [
      { key: "A", label: "慢慢分析" },
      { key: "B", label: "直接行動" },
      { key: "C", label: "問別人意見" },
    ],
  },
  {
    title: "你的工作風格？",
    options: [
      { key: "A", label: "獨立完成" },
      { key: "B", label: "邊做邊調整" },
      { key: "C", label: "團隊合作" },
    ],
  },
  {
    title: "你最在意？",
    options: [
      { key: "A", label: "穩定安全" },
      { key: "B", label: "新鮮刺激" },
      { key: "C", label: "人際關係" },
    ],
  },
] as const;

const results = {
  A: {
    emoji: "🦉",
    title: "貓頭鷹：沉穩分析型",
    description: "你習慣先觀察、整理資訊，再做出穩健決定。比起衝動出手，你更相信清楚的邏輯與安全感。",
  },
  B: {
    emoji: "🐆",
    title: "獵豹：行動衝勁型",
    description: "你喜歡快速嘗試、邊做邊修正。新鮮感和挑戰會讓你充滿能量，是很適合開路的人。",
  },
  C: {
    emoji: "🐬",
    title: "海豚：社交魅力型",
    description: "你重視互動、合作與人際連結。遇到事情時，你擅長整合大家的想法，讓氣氛更順。",
  },
};

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Choice[]>([]);
  const [copied, setCopied] = useState(false);

  const isFinished = answers.length === questions.length;
  const progress = (answers.length / questions.length) * 100;

  const result = useMemo(() => {
    const scores: Record<Choice, number> = { A: 0, B: 0, C: 0 };

    answers.forEach((answer) => {
      scores[answer] += 1;
    });

    const winner = (Object.keys(scores) as Choice[]).reduce((best, choice) =>
      scores[choice] > scores[best] ? choice : best,
    );

    return results[winner];
  }, [answers]);

  function answerQuestion(choice: Choice) {
    const nextAnswers = [...answers, choice];
    setAnswers(nextAnswers);

    if (nextAnswers.length < questions.length) {
      setCurrentQuestion((question) => question + 1);
    }
  }

  async function shareResult() {
    const shareUrl = window.location.href;
    const shareText = [
      `我是 ${result.title}！`,
      result.description,
      `快來測你是什麼動物 👉 ${shareUrl}`,
    ].join("\n");

    if (navigator.share) {
      await navigator.share({
        title: "動物性格測驗",
        text: shareText,
        url: shareUrl,
      });
      return;
    }

    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function resetQuiz() {
    setAnswers([]);
    setCurrentQuestion(0);
    setCopied(false);
  }

  const question = questions[currentQuestion];

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-6 py-12 pt-16 text-white">
      <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/10 p-7 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="mb-8 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-orange-300">
            Animal Quiz
          </p>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
            動物性格測驗
          </h1>
        </div>

        <div className="mb-8 h-3 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {isFinished ? (
          <div className="text-center">
            <div className="mb-6 animate-bounce text-8xl">{result.emoji}</div>
            <h2 className="mb-4 text-3xl font-black text-orange-100">{result.title}</h2>
            <p className="mb-8 text-lg leading-8 text-gray-300">{result.description}</p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={shareResult}
                className="rounded-full border border-orange-300/60 px-8 py-4 text-lg font-black text-orange-100 transition hover:-translate-y-1 hover:bg-orange-400/10 focus:outline-none focus:ring-4 focus:ring-orange-300/20"
              >
                分享結果
              </button>
              <button
                type="button"
                onClick={resetQuiz}
                className="rounded-full bg-orange-500 px-8 py-4 text-lg font-black text-gray-950 shadow-lg shadow-orange-950/40 transition hover:-translate-y-1 hover:bg-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-300/30"
              >
                再測一次
              </button>
            </div>
            {copied ? (
              <p className="mt-4 text-sm font-bold text-orange-300">已複製！</p>
            ) : null}
          </div>
        ) : (
          <div>
            <p className="mb-3 text-sm font-bold text-orange-300">
              Question {currentQuestion + 1} / {questions.length}
            </p>
            <h2 className="mb-6 text-3xl font-black">{question.title}</h2>
            <div className="grid gap-4">
              {question.options.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => answerQuestion(option.key)}
                  className="rounded-2xl border border-white/10 bg-gray-900/80 px-5 py-4 text-left text-lg font-bold transition hover:-translate-y-1 hover:border-orange-300/70 hover:bg-orange-500 hover:text-gray-950 focus:outline-none focus:ring-4 focus:ring-orange-300/20"
                >
                  <span className="mr-3 text-orange-300">{option.key})</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

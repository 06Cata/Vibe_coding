"use client";

import { useState } from "react";

type ChartMode = "line" | "kd" | "macd" | "box";

export type StockPoint = {
  date: string;
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type StockSectionData = {
  title: string;
  subtitle: string;
  color: string;
  points: StockPoint[];
};

export type MarketOverviewData = {
  fearIndex: {
    label: string;
    value: number;
    date: string;
    description: string;
  } | null;
  businessSignal: {
    label: string;
    score: number;
    date: string;
    description: string;
  };
};

const chartModes: { key: ChartMode; label: string }[] = [
  { key: "line", label: "折線圖" },
  { key: "kd", label: "KD" },
  { key: "macd", label: "MACD" },
  { key: "box", label: "盒鬚圖" },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: 2,
  }).format(value);
}

function getScale(values: number[], height: number, paddingY: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return {
    min,
    max,
    y(value: number) {
      return height - paddingY - ((value - min) / range) * (height - paddingY * 2);
    },
  };
}

function getX(index: number, total: number, width: number, paddingX: number) {
  if (total === 1) {
    return width / 2;
  }

  return paddingX + (index / (total - 1)) * (width - paddingX * 2);
}

function ChartFrame({
  children,
  values,
  labels,
}: {
  children: React.ReactNode;
  values: number[];
  labels: string[];
}) {
  const width = 760;
  const height = 260;
  const paddingX = 42;
  const paddingY = 32;
  const scale = getScale(values, height, paddingY);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-72 w-full overflow-visible"
      role="img"
      aria-label="股票技術圖表"
    >
      <line
        x1={paddingX}
        x2={width - paddingX}
        y1={height - paddingY}
        y2={height - paddingY}
        stroke="rgba(255,255,255,0.16)"
      />
      <line
        x1={paddingX}
        x2={paddingX}
        y1={paddingY}
        y2={height - paddingY}
        stroke="rgba(255,255,255,0.16)"
      />
      {[0, 0.5, 1].map((ratio) => {
        const y = paddingY + ratio * (height - paddingY * 2);
        const value = scale.max - ratio * (scale.max - scale.min);

        return (
          <g key={ratio}>
            <line
              x1={paddingX}
              x2={width - paddingX}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
            />
            <text x={0} y={y + 4} fill="rgba(255,255,255,0.5)" fontSize="12">
              {formatNumber(value)}
            </text>
          </g>
        );
      })}
      {children}
      {labels.map((label, index) =>
        index % 3 === 0 || index === labels.length - 1 ? (
          <text
            key={`${label}-${index}`}
            x={getX(index, labels.length, width, paddingX) - 14}
            y={height - 8}
            fill="rgba(255,255,255,0.5)"
            fontSize="12"
          >
            {label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

function LineChart({ points, color }: { points: StockPoint[]; color: string }) {
  const width = 760;
  const height = 260;
  const paddingX = 42;
  const paddingY = 32;
  const values = points.map((point) => point.close);
  const scale = getScale(values, height, paddingY);
  const coords = points.map((point, index) => ({
    ...point,
    x: getX(index, points.length, width, paddingX),
    y: scale.y(point.close),
  }));
  const path = coords
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <ChartFrame values={values} labels={points.map((point) => point.label)}>
      <path d={path} fill="none" stroke={color} strokeLinecap="round" strokeWidth="4" />
      {coords.map((point, index) => (
        <g key={`${point.date}-${point.close}`}>
          <circle cx={point.x} cy={point.y} r="5" fill={color} />
          {index === coords.length - 1 ? (
            <text
              x={point.x - 58}
              y={point.y - 12}
              fill="white"
              fontSize="14"
              fontWeight="800"
            >
              {formatNumber(point.close)}
            </text>
          ) : null}
        </g>
      ))}
    </ChartFrame>
  );
}

function getKdPoints(points: StockPoint[]) {
  let k = 50;
  let d = 50;

  return points.map((point, index) => {
    const windowPoints = points.slice(Math.max(0, index - 8), index + 1);
    const low = Math.min(...windowPoints.map((item) => item.low));
    const high = Math.max(...windowPoints.map((item) => item.high));
    const rsv = high === low ? 50 : ((point.close - low) / (high - low)) * 100;

    k = (2 / 3) * k + (1 / 3) * rsv;
    d = (2 / 3) * d + (1 / 3) * k;

    return { label: point.label, date: point.date, k, d };
  });
}

function KdChart({ points }: { points: StockPoint[] }) {
  const width = 760;
  const height = 260;
  const paddingX = 42;
  const paddingY = 32;
  const kdPoints = getKdPoints(points);
  const scale = getScale([0, 100], height, paddingY);

  const buildPath = (key: "k" | "d") =>
    kdPoints
      .map((point, index) => {
        const x = getX(index, kdPoints.length, width, paddingX);
        return `${index === 0 ? "M" : "L"} ${x} ${scale.y(point[key])}`;
      })
      .join(" ");

  return (
    <ChartFrame values={[0, 100]} labels={kdPoints.map((point) => point.label)}>
      <path d={buildPath("k")} fill="none" stroke="#fb923c" strokeWidth="4" />
      <path d={buildPath("d")} fill="none" stroke="#38bdf8" strokeWidth="4" />
      <text x="620" y="34" fill="#fb923c" fontSize="14" fontWeight="800">
        K
      </text>
      <text x="650" y="34" fill="#38bdf8" fontSize="14" fontWeight="800">
        D
      </text>
    </ChartFrame>
  );
}

function ema(values: number[], period: number) {
  const multiplier = 2 / (period + 1);
  const result: number[] = [];

  values.forEach((value, index) => {
    result.push(index === 0 ? value : value * multiplier + result[index - 1] * (1 - multiplier));
  });

  return result;
}

function getMacdPoints(points: StockPoint[]) {
  const closes = points.map((point) => point.close);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const dif = closes.map((_, index) => ema12[index] - ema26[index]);
  const signal = ema(dif, 9);

  return points.map((point, index) => ({
    label: point.label,
    date: point.date,
    dif: dif[index],
    signal: signal[index],
    histogram: dif[index] - signal[index],
  }));
}

function MacdChart({ points }: { points: StockPoint[] }) {
  const width = 760;
  const height = 260;
  const paddingX = 42;
  const paddingY = 32;
  const macdPoints = getMacdPoints(points);
  const values = macdPoints.flatMap((point) => [point.dif, point.signal, point.histogram]);
  const scale = getScale(values, height, paddingY);
  const zeroY = scale.y(0);
  const barWidth = Math.max(8, (width - paddingX * 2) / macdPoints.length / 2);

  const buildPath = (key: "dif" | "signal") =>
    macdPoints
      .map((point, index) => {
        const x = getX(index, macdPoints.length, width, paddingX);
        return `${index === 0 ? "M" : "L"} ${x} ${scale.y(point[key])}`;
      })
      .join(" ");

  return (
    <ChartFrame values={values} labels={macdPoints.map((point) => point.label)}>
      <line x1={paddingX} x2={width - paddingX} y1={zeroY} y2={zeroY} stroke="rgba(255,255,255,0.2)" />
      {macdPoints.map((point, index) => {
        const x = getX(index, macdPoints.length, width, paddingX);
        const y = scale.y(point.histogram);
        const fill = point.histogram >= 0 ? "#22c55e" : "#ef4444";

        return (
          <rect
            key={point.date}
            x={x - barWidth / 2}
            y={Math.min(y, zeroY)}
            width={barWidth}
            height={Math.abs(zeroY - y)}
            rx="3"
            fill={fill}
            opacity="0.75"
          />
        );
      })}
      <path d={buildPath("dif")} fill="none" stroke="#fb923c" strokeWidth="4" />
      <path d={buildPath("signal")} fill="none" stroke="#38bdf8" strokeWidth="4" />
    </ChartFrame>
  );
}

function BoxChart({ points }: { points: StockPoint[] }) {
  const width = 760;
  const height = 260;
  const paddingX = 42;
  const paddingY = 32;
  const values = points.flatMap((point) => [point.high, point.low]);
  const scale = getScale(values, height, paddingY);
  const bodyWidth = Math.max(10, (width - paddingX * 2) / points.length / 2.4);

  return (
    <ChartFrame values={values} labels={points.map((point) => point.label)}>
      {points.map((point, index) => {
        const x = getX(index, points.length, width, paddingX);
        const openY = scale.y(point.open);
        const closeY = scale.y(point.close);
        const highY = scale.y(point.high);
        const lowY = scale.y(point.low);
        const up = point.close >= point.open;
        const color = up ? "#22c55e" : "#ef4444";

        return (
          <g key={point.date}>
            <line x1={x} x2={x} y1={highY} y2={lowY} stroke={color} strokeWidth="3" />
            <rect
              x={x - bodyWidth / 2}
              y={Math.min(openY, closeY)}
              width={bodyWidth}
              height={Math.max(3, Math.abs(openY - closeY))}
              rx="3"
              fill={up ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}
              stroke={color}
              strokeWidth="3"
            />
          </g>
        );
      })}
    </ChartFrame>
  );
}

function StockSection({ section }: { section: StockSectionData }) {
  const [mode, setMode] = useState<ChartMode>("line");
  const latest = section.points.at(-1);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-orange-300">
            {section.subtitle}
          </p>
          <h2 className="text-3xl font-black text-orange-100 sm:text-4xl">{section.title}</h2>
        </div>
        {latest ? (
          <div className="rounded-2xl border border-white/10 bg-gray-950/70 px-5 py-4 text-right">
            <p className="text-sm font-bold text-gray-400">最新日期</p>
            <p className="text-xl font-black text-white">{latest.date}</p>
            <p className="mt-2 text-3xl font-black" style={{ color: section.color }}>
              {formatNumber(latest.close)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {chartModes.map((chartMode) => (
          <button
            key={chartMode.key}
            type="button"
            onClick={() => setMode(chartMode.key)}
            className={`rounded-full px-4 py-2 text-sm font-black transition ${
              mode === chartMode.key
                ? "bg-orange-500 text-gray-950"
                : "bg-white/10 text-gray-200 hover:bg-white/15"
            }`}
          >
            {chartMode.label}
          </button>
        ))}
      </div>

      {mode === "line" ? <LineChart points={section.points} color={section.color} /> : null}
      {mode === "kd" ? <KdChart points={section.points} /> : null}
      {mode === "macd" ? <MacdChart points={section.points} /> : null}
      {mode === "box" ? <BoxChart points={section.points} /> : null}
    </section>
  );
}

function MarketOverview({ overview }: { overview: MarketOverviewData }) {
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-orange-300">
          Fear Index
        </p>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-orange-100">恐慌指數</h2>
            <p className="mt-2 text-sm font-bold text-gray-400">
              {overview.fearIndex?.label ?? "CBOE VIX"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-400">最新日期</p>
            <p className="font-black text-white">
              {overview.fearIndex?.date ?? "資料暫不可用"}
            </p>
          </div>
        </div>
        <p className="mt-6 text-6xl font-black text-sky-300">
          {overview.fearIndex ? formatNumber(overview.fearIndex.value) : "--"}
        </p>
        <p className="mt-4 leading-7 text-gray-300">
          {overview.fearIndex?.description ??
            "目前無法取得 VIX 資料，請稍後再重新整理。"}
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-orange-300">
          Business Signal
        </p>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-orange-100">景氣燈號</h2>
            <p className="mt-2 text-sm font-bold text-gray-400">
              國發會景氣對策信號
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-400">最新月份</p>
            <p className="font-black text-white">{overview.businessSignal.date}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <span className="h-16 w-16 rounded-full bg-red-500 shadow-lg shadow-red-950/50" />
          <div>
            <p className="text-5xl font-black text-red-300">
              {overview.businessSignal.label}
            </p>
            <p className="mt-2 text-lg font-black text-gray-200">
              綜合判斷分數 {overview.businessSignal.score}
            </p>
          </div>
        </div>
        <p className="mt-4 leading-7 text-gray-300">
          {overview.businessSignal.description}
        </p>
      </div>
    </section>
  );
}

export default function StockDashboard({
  overview,
  sections,
}: {
  overview: MarketOverviewData;
  sections: StockSectionData[];
}) {
  return (
    <main className="min-h-screen bg-gray-950 px-6 py-12 pt-20 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-orange-300">
            Taiwan Market
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            股市大盤走向
          </h1>
        </div>

        <MarketOverview overview={overview} />

        {sections.map((section) => (
          <StockSection key={section.title} section={section} />
        ))}
      </div>
    </main>
  );
}

import StockDashboard, {
  type MarketOverviewData,
  type StockSectionData,
} from "./StockDashboard";

type TwseResponse = {
  stat: string;
  data?: string[][];
};

type YahooChartResponse = {
  chart?: {
    result?: {
      timestamp?: number[];
      indicators?: {
        quote?: {
          close?: Array<number | null>;
        }[];
      };
    }[];
  };
};

export const dynamic = "force-dynamic";

function getTaipeiDateParam() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("-", "");
}

function parseNumber(value: string) {
  return Number(value.replaceAll(",", ""));
}

function formatRocDate(date: string) {
  const [year, month, day] = date.split("/").map(Number);

  if (!year || !month || !day) {
    return date;
  }

  return `${year + 1911}/${String(month).padStart(2, "0")}/${String(day).padStart(
    2,
    "0",
  )}`;
}

async function fetchTwseData(url: string) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("TWSE request failed");
  }

  const data = (await response.json()) as TwseResponse;

  if (data.stat !== "OK" || !data.data?.length) {
    throw new Error("TWSE data is empty");
  }

  return data.data;
}

async function getTaiexPoints(dateParam: string) {
  const rows = await fetchTwseData(
    `https://www.twse.com.tw/rwd/zh/TAIEX/MI_5MINS_HIST?date=${dateParam}&response=json`,
  );

  return rows.map((row) => ({
    date: formatRocDate(row[0]),
    label: row[0].slice(4),
    open: parseNumber(row[1]),
    high: parseNumber(row[2]),
    low: parseNumber(row[3]),
    close: parseNumber(row[4]),
  }));
}

async function getStockPoints(dateParam: string, stockNo: string) {
  const rows = await fetchTwseData(
    `https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?date=${dateParam}&stockNo=${stockNo}&response=json`,
  );

  return rows.map((row) => ({
    date: formatRocDate(row[0]),
    label: row[0].slice(4),
    open: parseNumber(row[3]),
    high: parseNumber(row[4]),
    low: parseNumber(row[5]),
    close: parseNumber(row[6]),
  }));
}

async function getFearIndex() {
  try {
    const response = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?range=5d&interval=1d",
      { cache: "no-store" },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as YahooChartResponse;
    const result = data.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];
    const latestIndex = closes.findLastIndex((close) => typeof close === "number");

    if (latestIndex < 0 || !timestamps[latestIndex]) {
      return null;
    }

    return {
      label: "CBOE VIX",
      value: closes[latestIndex] as number,
      date: new Intl.DateTimeFormat("zh-TW", {
        timeZone: "Asia/Taipei",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(timestamps[latestIndex] * 1000)),
      description: "VIX 越高，通常代表市場預期波動越大。",
    };
  } catch {
    return null;
  }
}

export default async function StockPage() {
  const dateParam = getTaipeiDateParam();
  const [taiexPoints, taiwan50Points, tsmcPoints] = await Promise.all([
    getTaiexPoints(dateParam),
    getStockPoints(dateParam, "0050"),
    getStockPoints(dateParam, "2330"),
  ]);

  const fearIndex = await getFearIndex();
  const overview: MarketOverviewData = {
    fearIndex,
    businessSignal: {
      label: "紅燈",
      score: 39,
      date: "2026/03",
      description: "國發會景氣對策信號，代表景氣熱絡。",
    },
  };

  const sections: StockSectionData[] = [
    {
      title: "台股加權指數",
      subtitle: "TAIEX",
      color: "#38bdf8",
      points: taiexPoints,
    },
    {
      title: "0050",
      subtitle: "元大台灣50",
      color: "#fb923c",
      points: taiwan50Points,
    },
    {
      title: "2330",
      subtitle: "Stock Code",
      color: "#a78bfa",
      points: tsmcPoints,
    },
  ];

  return <StockDashboard overview={overview} sections={sections} />;
}

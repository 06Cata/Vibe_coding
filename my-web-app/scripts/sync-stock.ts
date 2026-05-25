import { config } from "dotenv";
import { createSupabaseAdminClient } from "../lib/supabase/client";
import { formatRocDate, getTaipeiDateParam, parseNumber } from "../lib/stock/format";

config({ path: ".env.local" });

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

function formatDateForDatabase(date: string) {
  const [year, month, day] = formatRocDate(date).split("/");
  return `${year}-${month}-${day}`;
}

async function fetchTwseData(url: string) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`TWSE request failed: ${url}`);
  }

  const data = (await response.json()) as TwseResponse;

  if (data.stat !== "OK" || !data.data?.length) {
    throw new Error(`TWSE data is empty: ${url}`);
  }

  return data.data;
}

async function getTaiexRows(dateParam: string) {
  const rows = await fetchTwseData(
    `https://www.twse.com.tw/rwd/zh/TAIEX/MI_5MINS_HIST?date=${dateParam}&response=json`,
  );

  return rows.map((row) => ({
    symbol: "TAIEX",
    trade_date: formatDateForDatabase(row[0]),
    label: row[0].slice(4),
    open: parseNumber(row[1]),
    high: parseNumber(row[2]),
    low: parseNumber(row[3]),
    close: parseNumber(row[4]),
  }));
}

async function getStockRows(dateParam: string, stockNo: string) {
  const rows = await fetchTwseData(
    `https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?date=${dateParam}&stockNo=${stockNo}&response=json`,
  );

  return rows.map((row) => ({
    symbol: stockNo,
    trade_date: formatDateForDatabase(row[0]),
    label: row[0].slice(4),
    open: parseNumber(row[3]),
    high: parseNumber(row[4]),
    low: parseNumber(row[5]),
    close: parseNumber(row[6]),
  }));
}

async function getFearIndexRow() {
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
      item_key: "fear_index",
      data_date: new Intl.DateTimeFormat("zh-TW", {
        timeZone: "Asia/Taipei",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(timestamps[latestIndex] * 1000)),
      label: "CBOE VIX",
      value: closes[latestIndex] as number,
      score: null,
      description: "VIX 越高，通常代表市場預期波動越大。",
    };
  } catch {
    return null;
  }
}

async function main() {
  const supabase = createSupabaseAdminClient();
  const dateParam = getTaipeiDateParam();

  const [taiexRows, taiwan50Rows, tsmcRows, fearIndexRow] = await Promise.all([
    getTaiexRows(dateParam),
    getStockRows(dateParam, "0050"),
    getStockRows(dateParam, "2330"),
    getFearIndexRow(),
  ]);

  const seriesRows = [...taiexRows, ...taiwan50Rows, ...tsmcRows];

  const { error: seriesError } = await supabase
    .from("market_series")
    .upsert(seriesRows, { onConflict: "symbol,trade_date" });

  if (seriesError) {
    throw seriesError;
  }

  const overviewRows = [
    ...(fearIndexRow ? [fearIndexRow] : []),
    {
      item_key: "business_signal",
      data_date: "2026/03",
      label: "紅燈",
      value: null,
      score: 39,
      description: "國發會景氣對策信號，代表景氣熱絡。",
    },
  ];

  const { error: overviewError } = await supabase
    .from("market_overview")
    .upsert(overviewRows, { onConflict: "item_key,data_date" });

  if (overviewError) {
    throw overviewError;
  }

  console.log(`Synced ${seriesRows.length} market rows and ${overviewRows.length} overview rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { MARKET_OVERVIEW_TABLE, MARKET_SERIES_TABLE } from "../../lib/market-tables";
import { createSupabaseAdminClient } from "../../lib/supabase";

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

function formatRocDate(date: string) {
  const [year, month, day] = date.split("/").map(Number);

  if (!year || !month || !day) {
    return date;
  }

  return `${year + 1911}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
}

function parseNumber(value: string) {
  return Number(value.replaceAll(",", ""));
}

function formatDateForDatabase(date: string) {
  const [year, month, day] = formatRocDate(date).split("/");
  return `${year}-${month}-${day}`;
}

function getTaipeiToday() {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("-")
    .map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateParam(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function getLookbackWindow(days: number) {
  const end = getTaipeiToday();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days);

  return {
    start,
    end,
    startKey: formatDateParam(start),
    endKey: formatDateParam(end),
  };
}

function getMonthDateParams(start: Date, end: Date) {
  const params: string[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const lastMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

  while (cursor <= lastMonth) {
    params.push(formatDateParam(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return params;
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
    let latestIndex = -1;

    for (let index = closes.length - 1; index >= 0; index -= 1) {
      if (typeof closes[index] === "number") {
        latestIndex = index;
        break;
      }
    }

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

@Injectable()
export class InternalJobsService {
  authorize(token?: string) {
    const expected = process.env.INTERNAL_CRON_TOKEN;

    if (!expected || token !== `Bearer ${expected}`) {
      throw new UnauthorizedException("Invalid internal cron token.");
    }
  }

  async syncStocks(days = 60) {
    const supabase = createSupabaseAdminClient();
    const lookback = getLookbackWindow(days);
    const monthDateParams = getMonthDateParams(lookback.start, lookback.end);

    const [taiexRowGroups, taiwan50RowGroups, tsmcRowGroups, fearIndexRow] = await Promise.all([
      Promise.all(monthDateParams.map((dateParam) => getTaiexRows(dateParam))),
      Promise.all(monthDateParams.map((dateParam) => getStockRows(dateParam, "0050"))),
      Promise.all(monthDateParams.map((dateParam) => getStockRows(dateParam, "2330"))),
      getFearIndexRow(),
    ]);

    const seriesRows = [
      ...taiexRowGroups.flat(),
      ...taiwan50RowGroups.flat(),
      ...tsmcRowGroups.flat(),
    ].filter((row) => {
      const dateKey = row.trade_date.replaceAll("-", "");
      return dateKey >= lookback.startKey && dateKey <= lookback.endKey;
    });

    const { error: seriesError } = await supabase
      .from(MARKET_SERIES_TABLE)
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
      .from(MARKET_OVERVIEW_TABLE)
      .upsert(overviewRows, { onConflict: "item_key,data_date" });

    if (overviewError) {
      throw overviewError;
    }

    return {
      syncedSeriesRows: seriesRows.length,
      syncedOverviewRows: overviewRows.length,
    };
  }
}

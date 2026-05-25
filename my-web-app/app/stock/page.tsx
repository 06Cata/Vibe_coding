import StockDashboard from "./StockDashboard";
import { STOCK_CONFIG } from "@/lib/stock/constants";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import type { MarketOverviewData, StockSectionData } from "@/lib/stock/types";

export const dynamic = "force-dynamic";

type SeriesRow = {
  symbol: keyof typeof STOCK_CONFIG;
  trade_date: string;
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

type OverviewRow = {
  item_key: "fear_index" | "business_signal";
  data_date: string;
  label: string;
  value: number | null;
  score: number | null;
  description: string;
};

export default async function StockPage() {
  const supabase = createSupabaseServerClient();

  const [{ data: seriesRows, error: seriesError }, { data: overviewRows, error: overviewError }] =
    await Promise.all([
      supabase
        .from("market_series")
        .select("symbol, trade_date, label, open, high, low, close")
        .in("symbol", ["TAIEX", "0050", "2330"])
        .order("trade_date", { ascending: true }),
      supabase
        .from("market_overview")
        .select("item_key, data_date, label, value, score, description")
        .in("item_key", ["fear_index", "business_signal"])
        .order("data_date", { ascending: false }),
    ]);

  if (seriesError) {
    throw new Error(seriesError.message);
  }

  if (overviewError) {
    throw new Error(overviewError.message);
  }

  const sectionSymbols = ["TAIEX", "0050", "2330"] as const;
  const sections: StockSectionData[] = sectionSymbols.map((symbol) => ({
    ...STOCK_CONFIG[symbol],
    points: ((seriesRows ?? []) as SeriesRow[])
      .filter((row) => row.symbol === symbol)
      .map((row) => ({
        date: row.trade_date,
        label: row.label,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
      })),
  }));

  const fearIndexRow =
    ((overviewRows ?? []) as OverviewRow[]).find((row) => row.item_key === "fear_index") ?? null;
  const businessSignalRow =
    ((overviewRows ?? []) as OverviewRow[]).find(
      (row) => row.item_key === "business_signal",
    ) ?? null;

  const overview: MarketOverviewData = {
    fearIndex: fearIndexRow
      ? {
          label: fearIndexRow.label,
          value: fearIndexRow.value ?? 0,
          date: fearIndexRow.data_date,
          description: fearIndexRow.description,
        }
      : null,
    businessSignal: businessSignalRow
      ? {
          label: businessSignalRow.label,
          score: businessSignalRow.score ?? 0,
          date: businessSignalRow.data_date,
          description: businessSignalRow.description,
        }
      : {
          label: "待補",
          score: 0,
          date: "--",
          description: "尚未同步景氣燈號資料。",
        },
  };

  return <StockDashboard overview={overview} sections={sections} />;
}

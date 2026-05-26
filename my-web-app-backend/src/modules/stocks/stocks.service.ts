import { Injectable } from "@nestjs/common";
import { createSupabaseAdminClient } from "../../lib/supabase";
import {
  MarketOverviewData,
  STOCK_CONFIG,
  StockDashboardResponse,
  StockSymbol,
} from "./stocks.types";

type SeriesRow = {
  symbol: StockSymbol;
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

@Injectable()
export class StocksService {
  async getDashboard(days = 60): Promise<StockDashboardResponse> {
    const supabase = createSupabaseAdminClient();
    const sectionSymbols = ["TAIEX", "0050", "2330"] as const;
    const lookbackStart = new Date();
    lookbackStart.setUTCDate(lookbackStart.getUTCDate() - days);
    const lookbackKey = lookbackStart.toISOString().slice(0, 10);

    const [{ data: seriesRows, error: seriesError }, { data: overviewRows, error: overviewError }] =
      await Promise.all([
        supabase
          .from("market_series")
          .select("symbol, trade_date, label, open, high, low, close")
          .in("symbol", [...sectionSymbols])
          .gte("trade_date", lookbackKey)
          .order("trade_date", { ascending: true }),
        supabase
          .from("market_overview")
          .select("item_key, data_date, label, value, score, description")
          .in("item_key", ["fear_index", "business_signal"])
          .order("data_date", { ascending: false }),
      ]);

    if (seriesError) {
      throw seriesError;
    }

    if (overviewError) {
      throw overviewError;
    }

    const sections = sectionSymbols.map((symbol) => ({
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

    return { overview, sections };
  }
}

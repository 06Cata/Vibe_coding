import StockDashboard from "./StockDashboard";
import type { MarketOverviewData, StockSectionData } from "@/lib/stock/types";
import { getBackendBaseUrl } from "@/lib/config";

export const dynamic = "force-dynamic";

type StockDashboardResponse = {
  overview: MarketOverviewData;
  sections: StockSectionData[];
};

export default async function StockPage() {
  const response = await fetch(`${getBackendBaseUrl()}/api/stocks/dashboard?days=60`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch stock dashboard from backend.");
  }

  const payload = (await response.json()) as StockDashboardResponse;

  return <StockDashboard overview={payload.overview} sections={payload.sections} />;
}

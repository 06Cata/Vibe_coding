export const STOCK_CONFIG = {
  TAIEX: {
    title: "台股加權指數",
    subtitle: "TAIEX",
    color: "#38bdf8",
  },
  "0050": {
    title: "0050",
    subtitle: "元大台灣50",
    color: "#fb923c",
  },
  "2330": {
    title: "2330",
    subtitle: "Stock Code",
    color: "#a78bfa",
  },
} as const;

export type StockSymbol = keyof typeof STOCK_CONFIG;

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

export type StockDashboardResponse = {
  overview: MarketOverviewData;
  sections: StockSectionData[];
};

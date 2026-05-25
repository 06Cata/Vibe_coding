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

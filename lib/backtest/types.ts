// バックテストに関する型定義

export interface StockData {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  return: number;
  profit: number;
}

export interface BacktestResult {
  strategy: string;
  totalReturn: number;
  winRate: number;
  totalTrades: number;
  avgReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: Trade[];
}

export interface BacktestParams {
  initialCapital?: number;
  commissionRate?: number;
  slippageRate?: number;
}

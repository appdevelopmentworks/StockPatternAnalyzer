import { Trade, BacktestResult } from './types';

/**
 * バックテスト統計を計算する
 */
export const calculateBacktestStats = (
  trades: Trade[], 
  finalCapital: number, 
  initialCapital: number, 
  strategyName: string
): BacktestResult => {
  if (trades.length === 0) {
    return {
      strategy: strategyName,
      totalReturn: 0,
      winRate: 0,
      totalTrades: 0,
      avgReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      trades: []
    };
  }
  
  const safeFinalCapital = isFinite(finalCapital) ? finalCapital : initialCapital;
  const totalReturn = isFinite(safeFinalCapital) && initialCapital > 0 
    ? ((safeFinalCapital - initialCapital) / initialCapital) * 100 
    : 0;
  
  const validTrades = trades.filter(t => 
    isFinite(t.return) && 
    isFinite(t.profit) && 
    isFinite(t.entryPrice) && 
    isFinite(t.exitPrice) &&
    t.entryPrice > 0 && 
    t.exitPrice > 0
  );
  
  if (validTrades.length === 0) {
    return {
      strategy: strategyName,
      totalReturn: 0,
      winRate: 0,
      totalTrades: 0,
      avgReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      trades: []
    };
  }
  
  const wins = validTrades.filter(t => t.return > 0).length;
  const winRate = (wins / validTrades.length) * 100;
  const avgReturn = validTrades.reduce((sum, t) => sum + t.return, 0) / validTrades.length;
  
  // 最大ドローダウン計算
  let peak = initialCapital;
  let maxDrawdown = 0;
  let runningCapital = initialCapital;
  
  validTrades.forEach(trade => {
    runningCapital += trade.profit;
    if (runningCapital > peak) peak = runningCapital;
    const drawdown = peak > 0 ? ((peak - runningCapital) / peak) * 100 : 0;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });
  
  // シャープレシオ計算
  const returns = validTrades.map(t => t.return);
  const avgRet = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.map(r => Math.pow(r - avgRet, 2)).reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgRet / stdDev) * Math.sqrt(252) : 0;
  
  return {
    strategy: strategyName,
    totalReturn: isFinite(totalReturn) ? totalReturn : 0,
    winRate: isFinite(winRate) ? winRate : 0,
    totalTrades: validTrades.length,
    avgReturn: isFinite(avgReturn) ? avgReturn : 0,
    maxDrawdown: isFinite(maxDrawdown) ? maxDrawdown : 0,
    sharpeRatio: isFinite(sharpeRatio) ? sharpeRatio : 0,
    trades: validTrades
  };
};

/**
 * 移動平均を計算する
 */
export const calculateMA = (data: any[], period: number, field: string = 'close') => {
  if (!data || data.length === 0 || period <= 0) {
    return [];
  }
  
  return data.map((item, index) => {
    if (index < period - 1) return null;
    
    const slice = data.slice(index - period + 1, index + 1);
    const validValues = slice.filter(d => d[field] > 0 && isFinite(d[field]));
    
    if (validValues.length === 0) return null;
    
    const sum = validValues.reduce((acc, curr) => acc + curr[field], 0);
    const average = sum / validValues.length;
    
    return isFinite(average) ? average : null;
  });
};

/**
 * RSIを計算する
 */
export const calculateRSI = (data: any[], period: number = 14): (number | null)[] => {
  const rsi: (number | null)[] = new Array(data.length).fill(null);
  
  if (data.length < period + 1) return rsi;
  
  for (let i = period; i < data.length; i++) {
    let gains = 0;
    let losses = 0;
    
    for (let j = i - period + 1; j <= i; j++) {
      const change = data[j].close - data[j - 1].close;
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - (100 / (1 + rs));
    }
  }
  
  return rsi;
};

/**
 * 初期資本を設定する（日本株かどうかで自動調整）
 */
export const getInitialCapital = (data: any[]): number => {
  const isJapanese = data.length > 0 && data[0].close > 10000;
  return isJapanese ? 1000000 : 10000;
};

/**
 * データの妥当性をチェックする
 */
export const validateStockData = (data: any[]): any[] => {
  return data.filter(item => 
    item.close > 0 && 
    isFinite(item.close) &&
    item.open > 0 &&
    isFinite(item.open) &&
    item.high > 0 &&
    isFinite(item.high) &&
    item.low > 0 &&
    isFinite(item.low) &&
    item.date && 
    !isNaN(new Date(item.date).getTime())
  );
};

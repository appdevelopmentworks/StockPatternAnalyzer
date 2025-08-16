import { StockData, Trade, BacktestResult } from './types';
import { calculateBacktestStats, getInitialCapital, validateStockData } from './utils';

/**
 * 曜日戦略のバックテスト
 * @param data 株価データ
 * @param buyDay 購入曜日 (0=日, 1=月, ..., 6=土)
 * @param sellDay 売却曜日 (0=日, 1=月, ..., 6=土)
 * @param strategyName 戦略名
 */
export const runWeekdayStrategy = (
  data: StockData[], 
  buyDay: number, 
  sellDay: number, 
  strategyName: string
): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";
  
  const validData = validateStockData(data);
  
  if (validData.length < 2) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }
  
  validData.forEach((item, index) => {
    const date = new Date(item.date);
    const dayOfWeek = date.getDay();
    
    // 買いシグナル
    if (dayOfWeek === buyDay && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);
      
      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }
    
    // 売りシグナル
    if (dayOfWeek === sellDay && position > 0 && item.close > 0 && entryPrice > 0) {
      const exitPrice = item.close;
      const profit = position * (exitPrice - entryPrice);
      const returnPct = ((exitPrice - entryPrice) / entryPrice) * 100;
      
      if (isFinite(profit) && isFinite(returnPct)) {
        trades.push({
          entryDate,
          exitDate: item.date,
          entryPrice,
          exitPrice,
          return: returnPct,
          profit
        });
      }
      
      capital += position * exitPrice;
      position = 0;
      entryPrice = 0;
      entryDate = "";
    }
  });
  
  // 未決済ポジションの処理
  if (position > 0 && validData.length > 0 && validData[validData.length - 1].close > 0) {
    capital += position * validData[validData.length - 1].close;
  }
  
  return calculateBacktestStats(trades, capital, initialCapital, strategyName);
};

/**
 * N営業日保有戦略のバックテスト
 * @param data 株価データ
 * @param holdDays 保有日数
 * @param strategyName 戦略名
 */
export const runNDaysStrategy = (
  data: StockData[], 
  holdDays: number, 
  strategyName: string
): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";
  let daysHeld = 0;
  
  const validData = validateStockData(data);
  
  if (validData.length < holdDays + 1) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }
  
  validData.forEach((item, index) => {
    // ポジションを持っている場合、日数をカウント
    if (position > 0) {
      daysHeld++;
      
      // 指定日数保有したら売却
      if (daysHeld >= holdDays && item.close > 0 && entryPrice > 0) {
        const exitPrice = item.close;
        const profit = position * (exitPrice - entryPrice);
        const returnPct = ((exitPrice - entryPrice) / entryPrice) * 100;
        
        if (isFinite(profit) && isFinite(returnPct)) {
          trades.push({
            entryDate,
            exitDate: item.date,
            entryPrice,
            exitPrice,
            return: returnPct,
            profit
          });
        }
        
        capital += position * exitPrice;
        position = 0;
        daysHeld = 0;
        entryPrice = 0;
        entryDate = "";
      }
    }
    
    // ポジションを持っていない場合、新規エントリー
    if (position === 0 && index < validData.length - holdDays && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);
      
      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
        daysHeld = 0;
      }
    }
  });
  
  if (position > 0 && validData.length > 0 && validData[validData.length - 1].close > 0) {
    capital += position * validData[validData.length - 1].close;
  }
  
  return calculateBacktestStats(trades, capital, initialCapital, strategyName);
};

/**
 * 月初月末戦略のバックテスト
 * @param data 株価データ
 * @param strategyName 戦略名
 */
export const runMonthlyStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";
  let lastMonth = -1;
  
  const validData = validateStockData(data);
  
  if (validData.length < 30) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }
  
  validData.forEach((item, index) => {
    const date = new Date(item.date);
    const month = date.getMonth();
    const dayOfMonth = date.getDate();
    
    // 月初（1-5日）に買い
    if (dayOfMonth <= 5 && position === 0 && month !== lastMonth && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);
      
      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
        lastMonth = month;
      }
    }
    
    // 月末（25日以降）に売り
    if (dayOfMonth >= 25 && position > 0 && item.close > 0 && entryPrice > 0) {
      const exitPrice = item.close;
      const profit = position * (exitPrice - entryPrice);
      const returnPct = ((exitPrice - entryPrice) / entryPrice) * 100;
      
      if (isFinite(profit) && isFinite(returnPct)) {
        trades.push({
          entryDate,
          exitDate: item.date,
          entryPrice,
          exitPrice,
          return: returnPct,
          profit
        });
      }
      
      capital += position * exitPrice;
      position = 0;
      entryPrice = 0;
      entryDate = "";
    }
  });
  
  if (position > 0 && validData.length > 0 && validData[validData.length - 1].close > 0) {
    capital += position * validData[validData.length - 1].close;
  }
  
  return calculateBacktestStats(trades, capital, initialCapital, strategyName);
};

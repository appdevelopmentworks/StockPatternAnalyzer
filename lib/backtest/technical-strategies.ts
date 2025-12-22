import { StockData, Trade, BacktestResult } from './types';
import { calculateBacktestStats, calculateMA, calculateRSI, calculateRCI, getInitialCapital, validateStockData } from './utils';

/**
 * 移動平均クロス戦略のバックテスト
 * @param data 株価データ
 * @param strategyName 戦略名
 */
export const runMovingAverageCrossStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";
  
  const validData = validateStockData(data);
  
  if (validData.length < 25) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }
  
  const ma5 = calculateMA(validData, 5);
  const ma20 = calculateMA(validData, 20);
  
  validData.forEach((item, index) => {
    if (index < 20) return;
    
    const prevMa5 = ma5[index - 1];
    const prevMa20 = ma20[index - 1];
    const currMa5 = ma5[index];
    const currMa20 = ma20[index];
    
    if (!prevMa5 || !prevMa20 || !currMa5 || !currMa20) return;
    if (!isFinite(prevMa5) || !isFinite(prevMa20) || !isFinite(currMa5) || !isFinite(currMa20)) return;
    
    // ゴールデンクロス（買いシグナル）
    if (prevMa5 <= prevMa20 && currMa5 > currMa20 && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);
      
      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }
    
    // デッドクロス（売りシグナル）
    if (prevMa5 >= prevMa20 && currMa5 < currMa20 && position > 0 && item.close > 0 && entryPrice > 0) {
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

/**
 * RSI戦略のバックテスト
 * @param data 株価データ
 * @param strategyName 戦略名
 */
export const runRSIStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";
  
  const validData = validateStockData(data);
  
  if (validData.length < 20) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }
  
  const rsi = calculateRSI(validData, 14);
  
  validData.forEach((item, index) => {
    if (index < 14) return;
    
    const rsiValue = rsi[index];
    if (!rsiValue || !isFinite(rsiValue)) return;
    
    // RSI < 30で買い（オーバーソールド）
    if (rsiValue < 30 && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);
      
      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }
    
    // RSI > 70で売り（オーバーボート）
    if (rsiValue > 70 && position > 0 && item.close > 0 && entryPrice > 0) {
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

/**
 * ボリンジャーバンド戦略のバックテスト
 * @param data 株価データ
 * @param strategyName 戦略名
 */
export const runBollingerBandStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";

  const validData = validateStockData(data);

  if (validData.length < 25) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }

  const period = 20;
  const multiplier = 2;

  validData.forEach((item, index) => {
    if (index < period) return;

    // 過去20日間の移動平均と標準偏差を計算
    const slice = validData.slice(index - period + 1, index + 1);
    const prices = slice.map(d => d.close);
    const sma = prices.reduce((sum, price) => sum + price, 0) / period;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const upperBand = sma + (multiplier * stdDev);
    const lowerBand = sma - (multiplier * stdDev);

    // 下位バンドタッチで買い
    if (item.close <= lowerBand && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

    // 上位バンドタッチで売り
    if (item.close >= upperBand && position > 0 && item.close > 0 && entryPrice > 0) {
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

/**
 * RCI戦略のバックテスト
 * @param data 株価データ
 * @param strategyName 戦略名
 */
export const runRCIStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";

  const validData = validateStockData(data);

  if (validData.length < 15) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }

  const rci = calculateRCI(validData, 9);

  validData.forEach((item, index) => {
    if (index < 9) return;

    const rciValue = rci[index];
    if (!rciValue || !isFinite(rciValue)) return;

    // RCI < -80で買い（売られ過ぎ）
    if (rciValue < -80 && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

    // RCI > 80で売り（買われ過ぎ）
    if (rciValue > 80 && position > 0 && item.close > 0 && entryPrice > 0) {
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

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

/**
 * 移動平均クロス戦略（10/50）のバックテスト
 */
export const runMovingAverageCross10_50Strategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";

  const validData = validateStockData(data);

  if (validData.length < 55) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }

  const ma10 = calculateMA(validData, 10);
  const ma50 = calculateMA(validData, 50);

  validData.forEach((item, index) => {
    if (index < 50) return;

    const prevMa10 = ma10[index - 1];
    const prevMa50 = ma50[index - 1];
    const currMa10 = ma10[index];
    const currMa50 = ma50[index];

    if (!prevMa10 || !prevMa50 || !currMa10 || !currMa50) return;
    if (!isFinite(prevMa10) || !isFinite(prevMa50) || !isFinite(currMa10) || !isFinite(currMa50)) return;

    if (prevMa10 <= prevMa50 && currMa10 > currMa50 && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

    if (prevMa10 >= prevMa50 && currMa10 < currMa50 && position > 0 && item.close > 0 && entryPrice > 0) {
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
 * 移動平均クロス戦略（20/200）のバックテスト
 */
export const runMovingAverageCross20_200Strategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";

  const validData = validateStockData(data);

  if (validData.length < 205) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }

  const ma20 = calculateMA(validData, 20);
  const ma200 = calculateMA(validData, 200);

  validData.forEach((item, index) => {
    if (index < 200) return;

    const prevMa20 = ma20[index - 1];
    const prevMa200 = ma200[index - 1];
    const currMa20 = ma20[index];
    const currMa200 = ma200[index];

    if (!prevMa20 || !prevMa200 || !currMa20 || !currMa200) return;
    if (!isFinite(prevMa20) || !isFinite(prevMa200) || !isFinite(currMa20) || !isFinite(currMa200)) return;

    if (prevMa20 <= prevMa200 && currMa20 > currMa200 && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

    if (prevMa20 >= prevMa200 && currMa20 < currMa200 && position > 0 && item.close > 0 && entryPrice > 0) {
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
 * エンベロープ戦略のバックテスト
 */
export const runEnvelopeStrategy = (data: StockData[], strategyName: string): BacktestResult => {
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
  const percentage = 0.025;

  validData.forEach((item, index) => {
    if (index < period) return;

    const slice = validData.slice(index - period + 1, index + 1);
    const sma = slice.reduce((sum, d) => sum + d.close, 0) / period;

    const upperBand = sma * (1 + percentage);
    const lowerBand = sma * (1 - percentage);

    if (item.close <= lowerBand && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

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

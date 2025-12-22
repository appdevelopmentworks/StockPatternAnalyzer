import { StockData, Trade, BacktestResult } from './types';
import { calculateBacktestStats, getInitialCapital, validateStockData, calculateADX, calculateWilliamsR, calculateCCI, calculateParabolicSAR, calculateATR, calculateMA, calculateSuperTrend, calculateHeikenAshi, calculateChoppinessIndex, calculateEMA, calculateAroon, calculateForceIndex, calculatePivotPoints, calculateFibonacciLevels, calculateROC } from './utils';

/**
 * モメンタム戦略のバックテスト
 */
export const runMomentumStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";
  
  const lookback = 10;
  const validData = validateStockData(data);
  
  if (validData.length < lookback + 5) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }
  
  validData.forEach((item, index) => {
    if (index < lookback) return;
    
    const prevPrice = validData[index - lookback].close;
    if (prevPrice <= 0 || !isFinite(prevPrice)) return;
    
    const momentum = (item.close - prevPrice) / prevPrice;
    
    if (!isFinite(momentum)) return;
    
    // 正のモメンタムで買い
    if (momentum > 0.02 && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);
      
      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }
    
    // 負のモメンタムまたは5%利益で売り
    if (position > 0 && entryPrice > 0 && (momentum < -0.01 || (item.close - entryPrice) / entryPrice > 0.05)) {
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
  
  if (position > 0 && validData.length > 0) {
    capital += position * validData[validData.length - 1].close;
  }
  
  return calculateBacktestStats(trades, capital, initialCapital, strategyName);
};

/**
 * MACD戦略のバックテスト
 */
export const runMACDStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";
  
  const validData = validateStockData(data);
  
  if (validData.length < 30) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }
  
  const macd = calculateMACD(validData);
  
  validData.forEach((item, index) => {
    if (index < 26) return;
    
    const currentMACD = macd.macdLine[index];
    const currentSignal = macd.signalLine[index];
    const prevMACD = macd.macdLine[index - 1];
    const prevSignal = macd.signalLine[index - 1];
    
    if (!currentMACD || !currentSignal || !prevMACD || !prevSignal) return;
    
    // MACDがシグナルラインを上抜け（買いシグナル）
    if (prevMACD <= prevSignal && currentMACD > currentSignal && position === 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);
      
      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }
    
    // MACDがシグナルラインを下抜け（売りシグナル）
    if (prevMACD >= prevSignal && currentMACD < currentSignal && position > 0) {
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
  
  if (position > 0 && validData.length > 0) {
    capital += position * validData[validData.length - 1].close;
  }
  
  return calculateBacktestStats(trades, capital, initialCapital, strategyName);
};

/**
 * ストキャスティクス戦略のバックテスト
 */
export const runStochasticStrategy = (data: StockData[], strategyName: string): BacktestResult => {
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
  
  const stochastic = calculateStochastic(validData, 14);
  
  validData.forEach((item, index) => {
    if (index < 14) return;
    
    const kValue = stochastic[index];
    if (!kValue || !isFinite(kValue)) return;
    
    // %K < 20で買い（過売り）
    if (kValue < 20 && position === 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);
      
      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }
    
    // %K > 80で売り（過買い）
    if (kValue > 80 && position > 0) {
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
  
  if (position > 0 && validData.length > 0) {
    capital += position * validData[validData.length - 1].close;
  }
  
  return calculateBacktestStats(trades, capital, initialCapital, strategyName);
};

/**
 * 平均回帰戦略のバックテスト
 */
export const runMeanReversionStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";
  
  const validData = validateStockData(data);
  const period = 20;
  
  if (validData.length < period + 5) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }
  
  validData.forEach((item, index) => {
    if (index < period) return;
    
    const slice = validData.slice(index - period + 1, index + 1);
    const prices = slice.map(d => d.close);
    const mean = prices.reduce((sum, price) => sum + price, 0) / period;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return;
    
    const zScore = (item.close - mean) / stdDev;
    
    // Z-score < -2で買い（過度に下落）
    if (zScore < -2 && position === 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);
      
      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }
    
    // Z-score > 0で売り（平均回帰）
    if (zScore > 0 && position > 0) {
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
  
  if (position > 0 && validData.length > 0) {
    capital += position * validData[validData.length - 1].close;
  }
  
  return calculateBacktestStats(trades, capital, initialCapital, strategyName);
};

/**
 * ブレイクアウト戦略のバックテスト
 */
export const runBreakoutStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";
  
  const validData = validateStockData(data);
  const lookback = 20;
  
  if (validData.length < lookback + 5) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }
  
  validData.forEach((item, index) => {
    if (index < lookback) return;
    
    const slice = validData.slice(index - lookback, index);
    const highestHigh = Math.max(...slice.map(d => d.high));
    const lowestLow = Math.min(...slice.map(d => d.low));
    
    // 高値ブレイクアウトで買い
    if (item.close > highestHigh && position === 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);
      
      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }
    
    // 安値ブレイクダウンまたは5%利益で売り
    if (position > 0 && (item.close < lowestLow || (item.close - entryPrice) / entryPrice > 0.05)) {
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
  
  if (position > 0 && validData.length > 0) {
    capital += position * validData[validData.length - 1].close;
  }
  
  return calculateBacktestStats(trades, capital, initialCapital, strategyName);
};

/**
 * ギャップ戦略のバックテスト
 */
export const runGapStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";
  
  const validData = validateStockData(data);
  
  if (validData.length < 3) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }
  
  validData.forEach((item, index) => {
    if (index === 0) return;
    
    const prevItem = validData[index - 1];
    const gapPercent = ((item.open - prevItem.close) / prevItem.close) * 100;
    
    // 2%以上のギャップアップで売り（ギャップ埋め期待）
    if (gapPercent > 2 && position === 0) {
      // ショート戦略として実装（簡易版として逆張り）
      const rawPosition = capital / item.open;
      position = Math.floor(rawPosition);
      
      if (position > 0) {
        entryPrice = item.open;
        entryDate = item.date;
        capital -= position * item.open;
      }
    }
    
    // ギャップ埋めまたは2%損失で決済
    if (position > 0 && (item.close <= prevItem.close || (entryPrice - item.close) / entryPrice < -0.02)) {
      const exitPrice = item.close;
      const profit = position * (entryPrice - exitPrice); // ショート損益
      const returnPct = ((entryPrice - exitPrice) / entryPrice) * 100;
      
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
      
      capital += position * entryPrice + profit;
      position = 0;
      entryPrice = 0;
      entryDate = "";
    }
  });
  
  if (position > 0 && validData.length > 0) {
    const lastPrice = validData[validData.length - 1].close;
    capital += position * entryPrice + position * (entryPrice - lastPrice);
  }
  
  return calculateBacktestStats(trades, capital, initialCapital, strategyName);
};

/**
 * ボラティリティーブレイクアウト戦略のバックテスト
 */
export const runVolatilityBreakoutStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";
  
  const validData = validateStockData(data);
  const period = 20;
  
  if (validData.length < period + 5) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }
  
  validData.forEach((item, index) => {
    if (index < period) return;
    
    const slice = validData.slice(index - period, index);
    const returns = slice.map((d, i) => i === 0 ? 0 : (d.close - slice[i-1].close) / slice[i-1].close);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    const prevItem = validData[index - 1];
    const todayReturn = (item.close - prevItem.close) / prevItem.close;
    
    // ボラティリティの2倍以上の動きで買い
    if (Math.abs(todayReturn) > volatility * 2 && todayReturn > 0 && position === 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);
      
      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }
    
    // 3日後または5%利益/損失で決済
    if (position > 0 && index - validData.findIndex(d => d.date === entryDate) >= 3) {
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
  
  if (position > 0 && validData.length > 0) {
    capital += position * validData[validData.length - 1].close;
  }
  
  return calculateBacktestStats(trades, capital, initialCapital, strategyName);
};

// ヘルパー関数

/**
 * MACDの計算
 */
function calculateMACD(data: StockData[]) {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macdLine = ema12.map((ema12Val, index) => {
    const ema26Val = ema26[index];
    return ema12Val && ema26Val ? ema12Val - ema26Val : null;
  });
  
  const signalLine = calculateEMAFromArray(macdLine.filter(val => val !== null) as number[], 9);
  
  return { macdLine, signalLine };
}

/**
 * 配列からEMAを計算
 */
function calculateEMAFromArray(data: number[], period: number): (number | null)[] {
  const multiplier = 2 / (period + 1);
  const ema: (number | null)[] = new Array(data.length).fill(null);
  
  if (data.length < period) return ema;
  
  const smaSum = data.slice(0, period).reduce((sum, val) => sum + val, 0);
  ema[period - 1] = smaSum / period;
  
  for (let i = period; i < data.length; i++) {
    const prevEma = ema[i - 1];
    if (prevEma !== null) {
      ema[i] = (data[i] * multiplier) + (prevEma * (1 - multiplier));
    }
  }
  
  return ema;
}

/**
 * ストキャスティクスの計算
 */
function calculateStochastic(data: StockData[], period: number): (number | null)[] {
  const stochastic: (number | null)[] = new Array(data.length).fill(null);

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const highest = Math.max(...slice.map(d => d.high));
    const lowest = Math.min(...slice.map(d => d.low));
    const current = data[i].close;

    if (highest !== lowest) {
      stochastic[i] = ((current - lowest) / (highest - lowest)) * 100;
    }
  }

  return stochastic;
}

/**
 * ADX戦略のバックテスト
 * @param data 株価データ
 * @param strategyName 戦略名
 */
export const runADXStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";

  const validData = validateStockData(data);

  if (validData.length < 30) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }

  const adx = calculateADX(validData, 14);

  // 簡易的なトレンド判定（価格が移動平均より上か下か）
  const ma20: number[] = [];
  for (let i = 0; i < validData.length; i++) {
    if (i < 19) {
      ma20.push(0);
    } else {
      const slice = validData.slice(i - 19, i + 1);
      const avg = slice.reduce((sum, d) => sum + d.close, 0) / 20;
      ma20.push(avg);
    }
  }

  validData.forEach((item, index) => {
    if (index < 28) return;

    const adxValue = adx[index];
    if (!adxValue || !isFinite(adxValue)) return;

    // ADX > 25で強いトレンド
    // 価格がMA20より上で買い、下で売り
    if (adxValue > 25 && position === 0 && item.close > ma20[index] && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

    // ADX < 20または価格がMA20を下回ったら売り
    if ((adxValue < 20 || item.close < ma20[index]) && position > 0 && item.close > 0 && entryPrice > 0) {
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
 * ドンチャンチャネル戦略のバックテスト
 * @param data 株価データ
 * @param strategyName 戦略名
 */
export const runDonchianChannelStrategy = (data: StockData[], strategyName: string): BacktestResult => {
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

  validData.forEach((item, index) => {
    if (index < period) return;

    // 過去20日間の最高値と最低値
    const slice = validData.slice(index - period, index);
    const upperChannel = Math.max(...slice.map(d => d.high));
    const lowerChannel = Math.min(...slice.map(d => d.low));

    // 上限ブレイクで買い
    if (item.close > upperChannel && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

    // 下限ブレイクで売り
    if (item.close < lowerChannel && position > 0 && item.close > 0 && entryPrice > 0) {
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
 * ウィリアムズ%R戦略のバックテスト
 * @param data 株価データ
 * @param strategyName 戦略名
 */
export const runWilliamsRStrategy = (data: StockData[], strategyName: string): BacktestResult => {
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

  const williamsR = calculateWilliamsR(validData, 14);

  validData.forEach((item, index) => {
    if (index < 14) return;

    const wrValue = williamsR[index];
    if (!wrValue || !isFinite(wrValue)) return;

    // %R < -80で買い（売られ過ぎ）
    if (wrValue < -80 && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

    // %R > -20で売り（買われ過ぎ）
    if (wrValue > -20 && position > 0 && item.close > 0 && entryPrice > 0) {
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
 * CCI戦略のバックテスト
 */
export const runCCIStrategy = (data: StockData[], strategyName: string): BacktestResult => {
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

  const cci = calculateCCI(validData, 20);

  validData.forEach((item, index) => {
    if (index < 20) return;

    const cciValue = cci[index];
    if (!cciValue || !isFinite(cciValue)) return;

    if (cciValue < -100 && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

    if (cciValue > 100 && position > 0 && item.close > 0 && entryPrice > 0) {
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
 * パラボリックSAR戦略のバックテスト
 */
export const runParabolicSARStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";

  const validData = validateStockData(data);

  if (validData.length < 10) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }

  const sar = calculateParabolicSAR(validData);

  validData.forEach((item, index) => {
    if (index < 2) return;

    const sarValue = sar[index];
    const prevSAR = sar[index - 1];

    if (!sarValue || !prevSAR || !isFinite(sarValue) || !isFinite(prevSAR)) return;

    if (prevSAR > validData[index - 1].close && sarValue < item.close && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

    if (prevSAR < validData[index - 1].close && sarValue > item.close && position > 0 && item.close > 0 && entryPrice > 0) {
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
 * ケルトナーチャネル戦略のバックテスト
 */
export const runKeltnerChannelStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";

  const validData = validateStockData(data);

  if (validData.length < 30) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }

  const period = 20;
  const multiplier = 2;

  const ema = calculateMA(validData, period);
  const atr = calculateATR(validData, period);

  validData.forEach((item, index) => {
    if (index < period) return;

    const emaValue = ema[index];
    const atrValue = atr[index];

    if (!emaValue || !atrValue || !isFinite(emaValue) || !isFinite(atrValue)) return;

    const upperBand = emaValue + (multiplier * atrValue);
    const lowerBand = emaValue - (multiplier * atrValue);

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

/**
 * スーパートレンド戦略のバックテスト
 */
export const runSuperTrendStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";

  const validData = validateStockData(data);

  console.log(`[スーパートレンド] データ数: ${validData.length}`);

  if (validData.length < 15) {
    console.log(`[スーパートレンド] データ不足 (${validData.length} < 15)`);
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }

  const superTrend = calculateSuperTrend(validData, 10, 3);
  const validSTValues = superTrend.filter(v => v !== null && isFinite(v));
  console.log(`[スーパートレンド] 有効なST値: ${validSTValues.length}/${superTrend.length}`);

  validData.forEach((item, index) => {
    if (index < 11) return;

    const stValue = superTrend[index];
    const prevSTValue = superTrend[index - 1];

    if (!stValue || !prevSTValue || !isFinite(stValue) || !isFinite(prevSTValue)) return;

    // 上昇トレンド中（正の値）でポジションがない場合は買い - 改善
    if (stValue > 0 && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

    // 下降トレンドに転換（負の値）したら売り - 改善
    if (stValue < 0 && position > 0 && item.close > 0 && entryPrice > 0) {
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
 * 平均足戦略のバックテスト
 */
export const runHeikenAshiStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";

  const validData = validateStockData(data);

  console.log(`[平均足] データ数: ${validData.length}`);

  if (validData.length < 5) {
    console.log(`[平均足] データ不足 (${validData.length} < 5)`);
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }

  const ha = calculateHeikenAshi(validData);
  const validHAValues = ha.filter(v => v !== null);
  console.log(`[平均足] 有効なHA値: ${validHAValues.length}/${ha.length}`);

  validData.forEach((item, index) => {
    if (index < 2) return;

    const currentHA = ha[index];
    const prevHA = ha[index - 1];
    const prev2HA = index >= 3 ? ha[index - 2] : null;

    if (!currentHA || !prevHA) return;

    // 平均足の状態判定
    const isBullish = currentHA.close > currentHA.open;
    const wasBullish = prevHA.close > prevHA.open;
    const was2Bullish = prev2HA ? prev2HA.close > prev2HA.open : false;

    // 連続2本以上の陽線で買い（より確実なトレンド）- 改善
    const bullishTrend = isBullish && wasBullish;

    if (bullishTrend && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

    // 陽線から陰線に転換で売り、または連続2本の陰線で売り
    const bearishSignal = (wasBullish && !isBullish) || (!isBullish && !wasBullish);

    if (bearishSignal && position > 0 && item.close > 0 && entryPrice > 0) {
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
 * チョピネス指数＋トレンドフォロー戦略のバックテスト
 */
export const runChoppinessStrategy = (data: StockData[], strategyName: string): BacktestResult => {
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

  const ci = calculateChoppinessIndex(validData, 14);
  const ma20 = calculateMA(validData, 20);

  validData.forEach((item, index) => {
    if (index < 20) return;

    const ciValue = ci[index];
    const ma20Value = ma20[index];
    const prevMA = ma20[index - 1];

    if (!ciValue || !ma20Value || !prevMA || !isFinite(ciValue) || !isFinite(ma20Value) || !isFinite(prevMA)) return;

    // チョピネス指数が50以下（トレンド相場）の時のみトレード - 緩和
    const isTrending = ciValue < 50;

    // トレンド相場で価格がMAより上にあれば買い - 緩和
    if (isTrending && item.close > ma20Value && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

    // レンジ相場になったら（CI > 61）または価格がMAを下抜けたら売り
    const isRanging = ciValue > 61;
    const belowMA = item.close < ma20Value * 0.98; // 2%下抜けで売り - 緩和
    if ((isRanging || belowMA) && position > 0 && item.close > 0 && entryPrice > 0) {
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
 * Aroon指標戦略のバックテスト
 */
export const runAroonStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";

  const validData = validateStockData(data);

  if (validData.length < 30) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }

  const aroon = calculateAroon(validData, 25);

  validData.forEach((item, index) => {
    if (index < 25) return;

    const aroonValue = aroon[index];
    const prevAroonValue = aroon[index - 1];

    if (!aroonValue || !prevAroonValue) return;

    // Aroon Up > 50 かつ Aroon Down < 50 で買い（上昇トレンド）- 緩和
    // またはAroon Upがクロスオーバーした時
    const bullishSignal = (aroonValue.aroonUp > 50 && aroonValue.aroonDown < 50) ||
                          (prevAroonValue.aroonUp <= prevAroonValue.aroonDown && aroonValue.aroonUp > aroonValue.aroonDown);

    if (bullishSignal && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

    // Aroon Down > 50 かつ Aroon Up < 50 で売り（下降トレンド）
    // または Aroon Up と Aroon Down が交差したら売り
    if (position > 0 && item.close > 0 && entryPrice > 0) {
      const shouldExit = (aroonValue.aroonDown > 50 && aroonValue.aroonUp < 50) ||
                         (prevAroonValue.aroonUp > prevAroonValue.aroonDown && aroonValue.aroonUp < aroonValue.aroonDown);

      if (shouldExit) {
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
    }
  });

  if (position > 0 && validData.length > 0 && validData[validData.length - 1].close > 0) {
    capital += position * validData[validData.length - 1].close;
  }

  return calculateBacktestStats(trades, capital, initialCapital, strategyName);
};

/**
 * Elder's Force Index戦略のバックテスト
 */
export const runForceIndexStrategy = (data: StockData[], strategyName: string): BacktestResult => {
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

  const forceIndex = calculateForceIndex(validData, 13);

  validData.forEach((item, index) => {
    if (index < 14) return;

    const fiValue = forceIndex[index];
    const prevFIValue = forceIndex[index - 1];

    if (fiValue === null || prevFIValue === null || !isFinite(fiValue) || !isFinite(prevFIValue)) return;

    // Force Indexがゼロラインを下から上に抜けたら買い（買い圧力）
    if (prevFIValue <= 0 && fiValue > 0 && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

    // Force Indexがゼロラインを上から下に抜けたら売り（売り圧力）
    if (prevFIValue >= 0 && fiValue < 0 && position > 0 && item.close > 0 && entryPrice > 0) {
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
 * EMAリボン戦略のバックテスト
 */
export const runEMARibbonStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";

  const validData = validateStockData(data);

  if (validData.length < 100) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }

  // EMAリボン：8, 13, 21, 34, 55, 89日
  const ema8 = calculateEMA(validData, 8);
  const ema13 = calculateEMA(validData, 13);
  const ema21 = calculateEMA(validData, 21);
  const ema34 = calculateEMA(validData, 34);
  const ema55 = calculateEMA(validData, 55);
  const ema89 = calculateEMA(validData, 89);

  validData.forEach((item, index) => {
    if (index < 89) return;

    const e8 = ema8[index];
    const e13 = ema13[index];
    const e21 = ema21[index];
    const e34 = ema34[index];
    const e55 = ema55[index];
    const e89 = ema89[index];

    if (!e8 || !e13 || !e21 || !e34 || !e55 || !e89 ||
        !isFinite(e8) || !isFinite(e13) || !isFinite(e21) ||
        !isFinite(e34) || !isFinite(e55) || !isFinite(e89)) return;

    // 全てのEMAが正しく並んでいる（短期 > 長期）かつ価格がリボンの上にある → 買い
    const bullishAlignment = e8 > e13 && e13 > e21 && e21 > e34 && e34 > e55 && e55 > e89;
    const priceAboveRibbon = item.close > e8;

    if (bullishAlignment && priceAboveRibbon && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

    // 価格が最短期EMAを下抜けたら売り、または順序が崩れたら売り
    const bearishCross = item.close < e8;
    const alignmentBroken = !(e8 > e13 && e13 > e21);

    if ((bearishCross || alignmentBroken) && position > 0 && item.close > 0 && entryPrice > 0) {
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
 * ピボットポイント戦略のバックテスト
 */
export const runPivotPointStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";

  const validData = validateStockData(data);

  if (validData.length < 5) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }

  const pivots = calculatePivotPoints(validData);

  validData.forEach((item, index) => {
    if (index < 1) return;

    const pivot = pivots[index];
    if (!pivot) return;

    const currentPrice = item.close;
    const threshold = 0.02; // 2%の許容範囲（緩和）

    // S1またはS2付近で買い
    const nearS1 = Math.abs(currentPrice - pivot.s1) / pivot.s1 < threshold;
    const nearS2 = Math.abs(currentPrice - pivot.s2) / pivot.s2 < threshold;

    if ((nearS1 || nearS2) && position === 0 && currentPrice > 0) {
      const rawPosition = capital / currentPrice;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = currentPrice;
        entryDate = item.date;
        capital -= position * currentPrice;
      }
    }

    // R1またはR2付近で売り、またはS2を下抜けたら損切り
    const nearR1 = Math.abs(currentPrice - pivot.r1) / pivot.r1 < threshold;
    const nearR2 = Math.abs(currentPrice - pivot.r2) / pivot.r2 < threshold;
    const belowS2 = currentPrice < pivot.s2 * 0.99; // S2を1%下抜け

    if ((nearR1 || nearR2 || belowS2) && position > 0 && currentPrice > 0 && entryPrice > 0) {
      const exitPrice = currentPrice;
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
 * フィボナッチリトレースメント戦略のバックテスト
 */
export const runFibonacciStrategy = (data: StockData[], strategyName: string): BacktestResult => {
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

  const fibs = calculateFibonacciLevels(validData, 20);

  validData.forEach((item, index) => {
    if (index < 20) return;

    const fib = fibs[index];
    if (!fib) return;

    const currentPrice = item.close;
    const threshold = 0.03; // 3%の許容範囲（緩和）

    // フィボナッチ61.8%レベル付近で反転を狙う
    const nearFib618 = Math.abs(currentPrice - fib.fib618) / fib.fib618 < threshold;
    const nearFib500 = Math.abs(currentPrice - fib.fib500) / fib.fib500 < threshold;

    if (fib.isUptrend) {
      // 上昇トレンド後の押し目買い
      if ((nearFib618 || nearFib500) && position === 0 && currentPrice > 0) {
        const rawPosition = capital / currentPrice;
        position = Math.floor(rawPosition);

        if (position > 0) {
          entryPrice = currentPrice;
          entryDate = item.date;
          capital -= position * currentPrice;
        }
      }

      // スイング高値付近またはフィボナッチ0%（高値）で売り
      const nearHigh = currentPrice > fib.high * 0.98;
      const stopLoss = currentPrice < fib.fib786; // 78.6%を下抜けで損切り

      if ((nearHigh || stopLoss) && position > 0 && currentPrice > 0 && entryPrice > 0) {
        const exitPrice = currentPrice;
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
    } else {
      // 下降トレンド後の反発売り（ショート想定を買いに変換）
      const nearLow = currentPrice < fib.low * 1.02;

      if (nearLow && position === 0 && currentPrice > 0) {
        const rawPosition = capital / currentPrice;
        position = Math.floor(rawPosition);

        if (position > 0) {
          entryPrice = currentPrice;
          entryDate = item.date;
          capital -= position * currentPrice;
        }
      }

      // フィボナッチ61.8%レベル到達で利確
      if ((nearFib618 || currentPrice > fib.fib500) && position > 0 && currentPrice > 0 && entryPrice > 0) {
        const exitPrice = currentPrice;
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
    }
  });

  if (position > 0 && validData.length > 0 && validData[validData.length - 1].close > 0) {
    capital += position * validData[validData.length - 1].close;
  }

  return calculateBacktestStats(trades, capital, initialCapital, strategyName);
};

/**
 * ROC（Rate of Change）戦略のバックテスト
 */
export const runROCStrategy = (data: StockData[], strategyName: string): BacktestResult => {
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

  const roc = calculateROC(validData, 12);

  validData.forEach((item, index) => {
    if (index < 13) return;

    const rocValue = roc[index];
    const prevROCValue = roc[index - 1];

    if (rocValue === null || prevROCValue === null || !isFinite(rocValue) || !isFinite(prevROCValue)) return;

    // ROCがゼロラインを下から上に抜けたら買い（上昇モメンタム）
    if (prevROCValue <= 0 && rocValue > 0 && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

    // ROCがゼロラインを上から下に抜けたら売り（下降モメンタム）
    // または過熱感（ROC > 8%）で利確
    if ((prevROCValue >= 0 && rocValue < 0) || rocValue > 8) {
      if (position > 0 && item.close > 0 && entryPrice > 0) {
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
    }
  });

  if (position > 0 && validData.length > 0 && validData[validData.length - 1].close > 0) {
    capital += position * validData[validData.length - 1].close;
  }

  return calculateBacktestStats(trades, capital, initialCapital, strategyName);
};

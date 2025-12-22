import { StockData, Trade, BacktestResult } from './types';
import { calculateBacktestStats, getInitialCapital, validateStockData, calculateADX, calculateWilliamsR, calculateCCI, calculateParabolicSAR, calculateATR, calculateMA, calculateSuperTrend, calculateHeikenAshi, calculateChoppinessIndex } from './utils';

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
 * EMAの計算
 */
function calculateEMA(data: StockData[], period: number): (number | null)[] {
  const multiplier = 2 / (period + 1);
  const ema: (number | null)[] = new Array(data.length).fill(null);
  
  if (data.length < period) return ema;
  
  // 初期値はSMA
  const smaSum = data.slice(0, period).reduce((sum, item) => sum + item.close, 0);
  ema[period - 1] = smaSum / period;
  
  // EMA計算
  for (let i = period; i < data.length; i++) {
    const prevEma = ema[i - 1];
    if (prevEma !== null) {
      ema[i] = (data[i].close * multiplier) + (prevEma * (1 - multiplier));
    }
  }
  
  return ema;
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

  if (validData.length < 15) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }

  const superTrend = calculateSuperTrend(validData, 10, 3);

  validData.forEach((item, index) => {
    if (index < 11) return;

    const stValue = superTrend[index];
    const prevSTValue = superTrend[index - 1];

    if (!stValue || !prevSTValue || !isFinite(stValue) || !isFinite(prevSTValue)) return;

    // トレンド転換：下降→上昇で買い
    if (prevSTValue < 0 && stValue > 0 && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

    // トレンド転換：上昇→下降で売り
    if (prevSTValue > 0 && stValue < 0 && position > 0 && item.close > 0 && entryPrice > 0) {
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

  if (validData.length < 5) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }

  const ha = calculateHeikenAshi(validData);

  validData.forEach((item, index) => {
    if (index < 2) return;

    const currentHA = ha[index];
    const prevHA = ha[index - 1];

    if (!currentHA || !prevHA) return;

    // 連続陽線（上昇トレンド）で買い
    const isBullish = currentHA.close > currentHA.open;
    const wasBullish = prevHA.close > prevHA.open;

    // 陰線から陽線に転換で買い
    if (!wasBullish && isBullish && position === 0 && item.close > 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);

      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }

    // 陽線から陰線に転換で売り
    if (wasBullish && !isBullish && position > 0 && item.close > 0 && entryPrice > 0) {
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

    // チョピネス指数が38以下（トレンド相場）の時のみトレード
    const isTrending = ciValue < 38;

    // トレンド相場で価格がMAを上抜けたら買い
    if (isTrending && item.close > ma20Value && validData[index - 1].close <= prevMA && position === 0 && item.close > 0) {
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
    if ((isRanging || item.close < ma20Value) && position > 0 && item.close > 0 && entryPrice > 0) {
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

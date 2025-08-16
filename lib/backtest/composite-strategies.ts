import { StockData, Trade, BacktestResult } from './types';
import { calculateBacktestStats, getInitialCapital, validateStockData } from './utils';

/**
 * 複合戦略のバックテスト（RSI + MACD + ボリンジャーバンド）
 */
export const runCompositeStrategy = (data: StockData[], strategyName: string): BacktestResult => {
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
  
  const rsi = calculateRSI(validData, 14);
  const macd = calculateMACD(validData);
  const bollinger = calculateBollingerBands(validData, 20, 2);
  
  validData.forEach((item, index) => {
    if (index < 26) return;
    
    const rsiValue = rsi[index];
    const macdValue = macd.macdLine[index];
    const macdSignal = macd.signalLine[index];
    const lowerBand = bollinger.lowerBand[index];
    const upperBand = bollinger.upperBand[index];
    
    if (!rsiValue || !macdValue || !macdSignal || !lowerBand || !upperBand) return;
    
    // 複合買いシグナル: RSI < 30 AND MACD > Signal AND 価格 < 下限バンド
    if (rsiValue < 30 && macdValue > macdSignal && item.close < lowerBand && position === 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);
      
      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }
    
    // 複合売りシグナル: RSI > 70 OR MACD < Signal OR 価格 > 上限バンド
    if (position > 0 && (rsiValue > 70 || macdValue < macdSignal || item.close > upperBand)) {
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
 * 季節性戦略のバックテスト（Sell in May and Go Away）
 */
export const runSeasonalStrategy = (data: StockData[], strategyName: string): BacktestResult => {
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
  
  validData.forEach((item, index) => {
    const date = new Date(item.date);
    const month = date.getMonth(); // 0-11
    
    // 11月(10)から4月(3)まで保有（冬季効果）
    if ((month >= 10 || month <= 3) && position === 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);
      
      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }
    
    // 5月(4)になったら売却
    if (month === 4 && position > 0) {
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
 * 一目均衡表戦略のバックテスト
 */
export const runIchimokuStrategy = (data: StockData[], strategyName: string): BacktestResult => {
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";
  
  const validData = validateStockData(data);
  
  if (validData.length < 52) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }
  
  const ichimoku = calculateIchimoku(validData);
  
  validData.forEach((item, index) => {
    if (index < 26) return;
    
    const tenkanSen = ichimoku.tenkanSen[index];
    const kijunSen = ichimoku.kijunSen[index];
    const senkouA = ichimoku.senkouSpanA[index];
    const senkouB = ichimoku.senkouSpanB[index];
    
    if (!tenkanSen || !kijunSen || !senkouA || !senkouB) return;
    
    const cloudTop = Math.max(senkouA, senkouB);
    const cloudBottom = Math.min(senkouA, senkouB);
    
    // 三役好転: 転換線 > 基準線 AND 価格 > 雲
    if (tenkanSen > kijunSen && item.close > cloudTop && position === 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);
      
      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }
    
    // 三役逆転: 転換線 < 基準線 OR 価格 < 雲
    if (position > 0 && (tenkanSen < kijunSen || item.close < cloudBottom)) {
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
 * OBV（オン・バランス・ボリューム）戦略のバックテスト
 */
export const runOBVStrategy = (data: StockData[], strategyName: string): BacktestResult => {
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
  
  const obv = calculateOBV(validData);
  const obvMA = calculateMAFromArray(obv, 10);
  
  validData.forEach((item, index) => {
    if (index < 10) return;
    
    const currentOBV = obv[index];
    const currentOBVMA = obvMA[index];
    const prevOBV = obv[index - 1];
    const prevOBVMA = obvMA[index - 1];
    
    if (!currentOBV || !currentOBVMA || !prevOBV || !prevOBVMA) return;
    
    // OBVが移動平均を上抜け（買いシグナル）
    if (prevOBV <= prevOBVMA && currentOBV > currentOBVMA && position === 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);
      
      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }
    
    // OBVが移動平均を下抜け（売りシグナル）
    if (prevOBV >= prevOBVMA && currentOBV < currentOBVMA && position > 0) {
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
 * VWMA（出来高加重移動平均）戦略のバックテスト
 */
export const runVWMAStrategy = (data: StockData[], strategyName: string): BacktestResult => {
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
  
  const vwma = calculateVWMA(validData, 10);
  const sma = calculateSMAFromArray(validData.map(d => d.close), 10);
  
  validData.forEach((item, index) => {
    if (index < 10) return;
    
    const currentVWMA = vwma[index];
    const currentSMA = sma[index];
    const prevVWMA = vwma[index - 1];
    const prevSMA = sma[index - 1];
    
    if (!currentVWMA || !currentSMA || !prevVWMA || !prevSMA) return;
    
    // VWMAがSMAを上抜け（買いシグナル）
    if (prevVWMA <= prevSMA && currentVWMA > currentSMA && position === 0) {
      const rawPosition = capital / item.close;
      position = Math.floor(rawPosition);
      
      if (position > 0) {
        entryPrice = item.close;
        entryDate = item.date;
        capital -= position * item.close;
      }
    }
    
    // VWMAがSMAを下抜け（売りシグナル）
    if (prevVWMA >= prevSMA && currentVWMA < currentSMA && position > 0) {
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
 * RSIの計算
 */
function calculateRSI(data: StockData[], period: number): (number | null)[] {
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
}

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
  
  const nonNullMACD = macdLine.filter(val => val !== null) as number[];
  const signalLine = calculateEMAFromArray(nonNullMACD, 9);
  
  return { macdLine, signalLine };
}

/**
 * ボリンジャーバンドの計算
 */
function calculateBollingerBands(data: StockData[], period: number, multiplier: number) {
  const sma = calculateSMAFromArray(data.map(d => d.close), period);
  const upperBand: (number | null)[] = [];
  const lowerBand: (number | null)[] = [];
  
  data.forEach((item, index) => {
    if (index < period - 1) {
      upperBand.push(null);
      lowerBand.push(null);
      return;
    }
    
    const slice = data.slice(index - period + 1, index + 1);
    const prices = slice.map(d => d.close);
    const mean = sma[index];
    
    if (mean === null) {
      upperBand.push(null);
      lowerBand.push(null);
      return;
    }
    
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    upperBand.push(mean + multiplier * stdDev);
    lowerBand.push(mean - multiplier * stdDev);
  });
  
  return { upperBand, lowerBand, sma };
}

/**
 * 一目均衡表の計算
 */
function calculateIchimoku(data: StockData[]) {
  const tenkanSen: (number | null)[] = [];
  const kijunSen: (number | null)[] = [];
  const senkouSpanA: (number | null)[] = [];
  const senkouSpanB: (number | null)[] = [];
  
  data.forEach((item, index) => {
    // 転換線 (9日間)
    if (index >= 8) {
      const slice9 = data.slice(index - 8, index + 1);
      const high9 = Math.max(...slice9.map(d => d.high));
      const low9 = Math.min(...slice9.map(d => d.low));
      tenkanSen.push((high9 + low9) / 2);
    } else {
      tenkanSen.push(null);
    }
    
    // 基準線 (26日間)
    if (index >= 25) {
      const slice26 = data.slice(index - 25, index + 1);
      const high26 = Math.max(...slice26.map(d => d.high));
      const low26 = Math.min(...slice26.map(d => d.low));
      kijunSen.push((high26 + low26) / 2);
    } else {
      kijunSen.push(null);
    }
    
    // 先行スパンA（転換線 + 基準線）/2、26日先行
    if (index >= 25) {
      const tenkan = tenkanSen[index];
      const kijun = kijunSen[index];
      if (tenkan !== null && kijun !== null) {
        senkouSpanA.push((tenkan + kijun) / 2);
      } else {
        senkouSpanA.push(null);
      }
    } else {
      senkouSpanA.push(null);
    }
    
    // 先行スパンB（52日間の高値+安値）/2、26日先行
    if (index >= 51) {
      const slice52 = data.slice(index - 51, index + 1);
      const high52 = Math.max(...slice52.map(d => d.high));
      const low52 = Math.min(...slice52.map(d => d.low));
      senkouSpanB.push((high52 + low52) / 2);
    } else {
      senkouSpanB.push(null);
    }
  });
  
  return { tenkanSen, kijunSen, senkouSpanA, senkouSpanB };
}

/**
 * OBVの計算
 */
function calculateOBV(data: StockData[]): number[] {
  const obv: number[] = [0];
  
  for (let i = 1; i < data.length; i++) {
    const prevClose = data[i - 1].close;
    const currentClose = data[i].close;
    const volume = data[i].volume;
    
    if (currentClose > prevClose) {
      obv.push(obv[i - 1] + volume);
    } else if (currentClose < prevClose) {
      obv.push(obv[i - 1] - volume);
    } else {
      obv.push(obv[i - 1]);
    }
  }
  
  return obv;
}

/**
 * VWMAの計算
 */
function calculateVWMA(data: StockData[], period: number): (number | null)[] {
  const vwma: (number | null)[] = [];
  
  data.forEach((item, index) => {
    if (index < period - 1) {
      vwma.push(null);
      return;
    }
    
    const slice = data.slice(index - period + 1, index + 1);
    let totalVolume = 0;
    let totalVolumePrice = 0;
    
    slice.forEach(d => {
      totalVolume += d.volume;
      totalVolumePrice += d.close * d.volume;
    });
    
    if (totalVolume > 0) {
      vwma.push(totalVolumePrice / totalVolume);
    } else {
      vwma.push(null);
    }
  });
  
  return vwma;
}

/**
 * EMAの計算
 */
function calculateEMA(data: StockData[], period: number): (number | null)[] {
  const multiplier = 2 / (period + 1);
  const ema: (number | null)[] = new Array(data.length).fill(null);
  
  if (data.length < period) return ema;
  
  const smaSum = data.slice(0, period).reduce((sum, item) => sum + item.close, 0);
  ema[period - 1] = smaSum / period;
  
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
 * 配列からSMAを計算
 */
function calculateSMAFromArray(data: number[], period: number): (number | null)[] {
  const sma: (number | null)[] = [];
  
  data.forEach((value, index) => {
    if (index < period - 1) {
      sma.push(null);
      return;
    }
    
    const slice = data.slice(index - period + 1, index + 1);
    const sum = slice.reduce((acc, val) => acc + val, 0);
    sma.push(sum / period);
  });
  
  return sma;
}

/**
 * 配列から移動平均を計算
 */
function calculateMAFromArray(data: number[], period: number): (number | null)[] {
  return calculateSMAFromArray(data, period);
}

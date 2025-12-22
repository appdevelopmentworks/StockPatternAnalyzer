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
 * RCI（順位相関指数）を計算する
 * @param data 株価データ
 * @param period 期間（デフォルト9日）
 * @returns RCI配列
 */
export const calculateRCI = (data: any[], period: number = 9): (number | null)[] => {
  const rci: (number | null)[] = new Array(data.length).fill(null);

  if (data.length < period) return rci;

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);

    // 日付順の順位（新しい日付ほど順位が高い = 大きい数値）
    const dateRanks = slice.map((_, index) => index + 1);

    // 価格順の順位（価格が高いほど順位が高い）
    const pricesWithIndex = slice.map((item, index) => ({ price: item.close, index }));
    pricesWithIndex.sort((a, b) => a.price - b.price);

    const priceRanks = new Array(period);
    pricesWithIndex.forEach((item, rank) => {
      priceRanks[item.index] = rank + 1;
    });

    // 順位差の2乗和を計算
    let sumOfSquaredDiffs = 0;
    for (let j = 0; j < period; j++) {
      const diff = dateRanks[j] - priceRanks[j];
      sumOfSquaredDiffs += diff * diff;
    }

    // RCI計算式: (1 - (6 * Σd^2) / (n * (n^2 - 1))) * 100
    const n = period;
    const rciValue = (1 - (6 * sumOfSquaredDiffs) / (n * (n * n - 1))) * 100;

    rci[i] = isFinite(rciValue) ? rciValue : null;
  }

  return rci;
};

/**
 * ウィリアムズ%Rを計算する
 * @param data 株価データ
 * @param period 期間（デフォルト14日）
 * @returns ウィリアムズ%R配列
 */
export const calculateWilliamsR = (data: any[], period: number = 14): (number | null)[] => {
  const williamsR: (number | null)[] = new Array(data.length).fill(null);

  if (data.length < period) return williamsR;

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const highestHigh = Math.max(...slice.map(d => d.high));
    const lowestLow = Math.min(...slice.map(d => d.low));
    const currentClose = data[i].close;

    if (highestHigh === lowestLow) {
      williamsR[i] = -50; // 中立値
    } else {
      const wr = ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
      williamsR[i] = isFinite(wr) ? wr : null;
    }
  }

  return williamsR;
};

/**
 * ADX（平均方向性指数）を計算する
 * @param data 株価データ
 * @param period 期間（デフォルト14日）
 * @returns ADX配列
 */
export const calculateADX = (data: any[], period: number = 14): (number | null)[] => {
  const adx: (number | null)[] = new Array(data.length).fill(null);

  if (data.length < period * 2) return adx;

  // True Range (TR) を計算
  const tr: number[] = new Array(data.length).fill(0);
  const plusDM: number[] = new Array(data.length).fill(0);
  const minusDM: number[] = new Array(data.length).fill(0);

  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevHigh = data[i - 1].high;
    const prevLow = data[i - 1].low;
    const prevClose = data[i - 1].close;

    // True Range
    tr[i] = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );

    // Directional Movement
    const upMove = high - prevHigh;
    const downMove = prevLow - low;

    if (upMove > downMove && upMove > 0) {
      plusDM[i] = upMove;
    }
    if (downMove > upMove && downMove > 0) {
      minusDM[i] = downMove;
    }
  }

  // スムージングされたTR, +DM, -DMを計算
  let smoothedTR = tr.slice(1, period + 1).reduce((a, b) => a + b, 0);
  let smoothedPlusDM = plusDM.slice(1, period + 1).reduce((a, b) => a + b, 0);
  let smoothedMinusDM = minusDM.slice(1, period + 1).reduce((a, b) => a + b, 0);

  const plusDI: number[] = new Array(data.length).fill(0);
  const minusDI: number[] = new Array(data.length).fill(0);
  const dx: number[] = new Array(data.length).fill(0);

  for (let i = period; i < data.length; i++) {
    if (i > period) {
      smoothedTR = smoothedTR - (smoothedTR / period) + tr[i];
      smoothedPlusDM = smoothedPlusDM - (smoothedPlusDM / period) + plusDM[i];
      smoothedMinusDM = smoothedMinusDM - (smoothedMinusDM / period) + minusDM[i];
    }

    plusDI[i] = smoothedTR > 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
    minusDI[i] = smoothedTR > 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;

    const diSum = plusDI[i] + minusDI[i];
    if (diSum > 0) {
      dx[i] = (Math.abs(plusDI[i] - minusDI[i]) / diSum) * 100;
    }
  }

  // ADXを計算（DXの移動平均）
  let adxValue = dx.slice(period, period * 2).reduce((a, b) => a + b, 0) / period;
  adx[period * 2 - 1] = adxValue;

  for (let i = period * 2; i < data.length; i++) {
    adxValue = ((adxValue * (period - 1)) + dx[i]) / period;
    adx[i] = isFinite(adxValue) ? adxValue : null;
  }

  return adx;
};

/**
 * ATR（平均真の範囲）を計算する
 * @param data 株価データ
 * @param period 期間（デフォルト14日）
 * @returns ATR配列
 */
export const calculateATR = (data: any[], period: number = 14): (number | null)[] => {
  const atr: (number | null)[] = new Array(data.length).fill(null);

  if (data.length < period + 1) return atr;

  const tr: number[] = new Array(data.length).fill(0);

  // True Rangeを計算
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;

    tr[i] = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
  }

  // 最初のATRは単純平均
  let atrValue = tr.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
  atr[period] = atrValue;

  // 以降はスムージング
  for (let i = period + 1; i < data.length; i++) {
    atrValue = ((atrValue * (period - 1)) + tr[i]) / period;
    atr[i] = isFinite(atrValue) ? atrValue : null;
  }

  return atr;
};

/**
 * CCI（商品チャンネル指数）を計算する
 * @param data 株価データ
 * @param period 期間（デフォルト20日）
 * @returns CCI配列
 */
export const calculateCCI = (data: any[], period: number = 20): (number | null)[] => {
  const cci: (number | null)[] = new Array(data.length).fill(null);

  if (data.length < period) return cci;

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);

    // Typical Price = (High + Low + Close) / 3
    const typicalPrices = slice.map(d => (d.high + d.low + d.close) / 3);
    const sma = typicalPrices.reduce((a, b) => a + b, 0) / period;

    // Mean Deviation
    const meanDeviation = typicalPrices.reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / period;

    const currentTP = (data[i].high + data[i].low + data[i].close) / 3;

    if (meanDeviation !== 0) {
      const cciValue = (currentTP - sma) / (0.015 * meanDeviation);
      cci[i] = isFinite(cciValue) ? cciValue : null;
    }
  }

  return cci;
};

/**
 * パラボリックSARを計算する
 * @param data 株価データ
 * @returns SAR配列
 */
export const calculateParabolicSAR = (data: any[]): (number | null)[] => {
  const sar: (number | null)[] = new Array(data.length).fill(null);

  if (data.length < 2) return sar;

  let isUptrend = true;
  let af = 0.02; // Acceleration Factor
  const maxAF = 0.2;
  let ep = data[0].high; // Extreme Point
  let sarValue = data[0].low;

  sar[0] = sarValue;

  for (let i = 1; i < data.length; i++) {
    // SARを更新
    sarValue = sarValue + af * (ep - sarValue);

    // トレンド反転チェック
    if (isUptrend) {
      if (data[i].low < sarValue) {
        isUptrend = false;
        sarValue = ep;
        ep = data[i].low;
        af = 0.02;
      } else {
        if (data[i].high > ep) {
          ep = data[i].high;
          af = Math.min(af + 0.02, maxAF);
        }
        // SARが過去2期間のローより高くならないように調整
        if (i >= 2) {
          sarValue = Math.min(sarValue, data[i - 1].low, data[i - 2].low);
        }
      }
    } else {
      if (data[i].high > sarValue) {
        isUptrend = true;
        sarValue = ep;
        ep = data[i].high;
        af = 0.02;
      } else {
        if (data[i].low < ep) {
          ep = data[i].low;
          af = Math.min(af + 0.02, maxAF);
        }
        // SARが過去2期間のハイより低くならないように調整
        if (i >= 2) {
          sarValue = Math.max(sarValue, data[i - 1].high, data[i - 2].high);
        }
      }
    }

    sar[i] = isFinite(sarValue) ? sarValue : null;
  }

  return sar;
};

/**
 * スーパートレンドを計算する
 * @param data 株価データ
 * @param period ATR期間（デフォルト10日）
 * @param multiplier 乗数（デフォルト3）
 * @returns スーパートレンド配列（上昇トレンドなら正、下降なら負）
 */
export const calculateSuperTrend = (data: any[], period: number = 10, multiplier: number = 3): (number | null)[] => {
  const superTrend: (number | null)[] = new Array(data.length).fill(null);

  if (data.length < period + 1) return superTrend;

  const atr = calculateATR(data, period);
  let trend = 1; // 1: 上昇トレンド, -1: 下降トレンド
  let upperBand = 0;
  let lowerBand = 0;

  for (let i = period; i < data.length; i++) {
    const atrValue = atr[i];
    if (!atrValue || !isFinite(atrValue)) continue;

    const hl2 = (data[i].high + data[i].low) / 2;
    const basicUpperBand = hl2 + (multiplier * atrValue);
    const basicLowerBand = hl2 - (multiplier * atrValue);

    // Final Bandsの計算
    if (i === period) {
      upperBand = basicUpperBand;
      lowerBand = basicLowerBand;
    } else {
      upperBand = basicUpperBand < upperBand || data[i - 1].close > upperBand ? basicUpperBand : upperBand;
      lowerBand = basicLowerBand > lowerBand || data[i - 1].close < lowerBand ? basicLowerBand : lowerBand;
    }

    // トレンド判定
    if (trend === 1) {
      if (data[i].close <= lowerBand) {
        trend = -1;
        superTrend[i] = upperBand;
      } else {
        superTrend[i] = lowerBand;
      }
    } else {
      if (data[i].close >= upperBand) {
        trend = 1;
        superTrend[i] = lowerBand;
      } else {
        superTrend[i] = upperBand;
      }
    }

    // トレンド方向を符号で表現（正：上昇、負：下降）
    superTrend[i] = trend === 1 ? superTrend[i]! : -superTrend[i]!;
  }

  return superTrend;
};

/**
 * 平均足（Heiken Ashi）を計算する
 * @param data 株価データ
 * @returns 平均足データ配列
 */
export const calculateHeikenAshi = (data: any[]): Array<{open: number, high: number, low: number, close: number} | null> => {
  const ha: Array<{open: number, high: number, low: number, close: number} | null> = new Array(data.length).fill(null);

  if (data.length === 0) return ha;

  for (let i = 0; i < data.length; i++) {
    const haClose = (data[i].open + data[i].high + data[i].low + data[i].close) / 4;

    let haOpen: number;
    if (i === 0) {
      haOpen = (data[i].open + data[i].close) / 2;
    } else {
      haOpen = (ha[i - 1]!.open + ha[i - 1]!.close) / 2;
    }

    const haHigh = Math.max(data[i].high, haOpen, haClose);
    const haLow = Math.min(data[i].low, haOpen, haClose);

    ha[i] = {
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose
    };
  }

  return ha;
};

/**
 * チョピネス指数を計算する
 * @param data 株価データ
 * @param period 期間（デフォルト14日）
 * @returns チョピネス指数配列（0-100、低い値＝トレンド、高い値＝レンジ）
 */
export const calculateChoppinessIndex = (data: any[], period: number = 14): (number | null)[] => {
  const ci: (number | null)[] = new Array(data.length).fill(null);

  if (data.length < period) return ci;

  const atr = calculateATR(data, period);

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);

    // ATRの合計
    let sumATR = 0;
    for (let j = i - period + 1; j <= i; j++) {
      if (atr[j] && isFinite(atr[j]!)) {
        sumATR += atr[j]!;
      }
    }

    // 期間内の最高値と最低値
    const highestHigh = Math.max(...slice.map(d => d.high));
    const lowestLow = Math.min(...slice.map(d => d.low));

    const range = highestHigh - lowestLow;

    if (range > 0 && sumATR > 0) {
      const ciValue = 100 * Math.log10(sumATR / range) / Math.log10(period);
      ci[i] = isFinite(ciValue) ? ciValue : null;
    }
  }

  return ci;
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

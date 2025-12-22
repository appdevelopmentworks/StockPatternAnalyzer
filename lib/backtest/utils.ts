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
 * EMA（指数移動平均）を計算する
 * @param data 株価データ
 * @param period 期間
 * @param field フィールド名（デフォルト: 'close'）
 * @returns EMA配列
 */
export const calculateEMA = (data: any[], period: number, field: string = 'close'): (number | null)[] => {
  const ema: (number | null)[] = new Array(data.length).fill(null);

  if (data.length < period) return ema;

  // 最初のEMAは単純移動平均
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i][field];
  }
  ema[period - 1] = sum / period;

  // 平滑化定数
  const multiplier = 2 / (period + 1);

  // 以降はEMA計算
  for (let i = period; i < data.length; i++) {
    ema[i] = (data[i][field] - ema[i - 1]!) * multiplier + ema[i - 1]!;
  }

  return ema;
};

/**
 * TRIX（トリプル指数移動平均）を計算する
 * @param data 株価データ
 * @param period 期間（デフォルト14日）
 * @returns TRIX配列（パーセント表示）
 */
export const calculateTRIX = (data: any[], period: number = 14): (number | null)[] => {
  const trix: (number | null)[] = new Array(data.length).fill(null);

  if (data.length < period * 3) return trix;

  // 第1段階：元データのEMA
  const firstEMA = calculateEMA(data, period, 'close');

  // 第2段階：第1EMAのEMA（データ形式を合わせる）
  const firstEMAData = firstEMA.map((value, index) => ({
    close: value ?? 0,
    date: data[index].date
  }));
  const secondEMA = calculateEMA(firstEMAData, period, 'close');

  // 第3段階：第2EMAのEMA（データ形式を合わせる）
  const secondEMAData = secondEMA.map((value, index) => ({
    close: value ?? 0,
    date: data[index].date
  }));
  const thirdEMA = calculateEMA(secondEMAData, period, 'close');

  // TRIXの計算：第3EMAの変化率（パーセント）
  for (let i = 1; i < data.length; i++) {
    if (thirdEMA[i] !== null && thirdEMA[i - 1] !== null && thirdEMA[i - 1] !== 0) {
      const change = ((thirdEMA[i]! - thirdEMA[i - 1]!) / thirdEMA[i - 1]!) * 100;
      trix[i] = isFinite(change) ? change : null;
    }
  }

  return trix;
};

/**
 * CMF（チェイキン・マネーフロー）を計算する
 * @param data 株価データ
 * @param period 期間（デフォルト20日）
 * @returns CMF配列
 */
export const calculateCMF = (data: any[], period: number = 20): (number | null)[] => {
  const cmf: (number | null)[] = new Array(data.length).fill(null);

  if (data.length < period) return cmf;

  for (let i = period - 1; i < data.length; i++) {
    let sumMoneyFlowVolume = 0;
    let sumVolume = 0;

    for (let j = i - period + 1; j <= i; j++) {
      const high = data[j].high;
      const low = data[j].low;
      const close = data[j].close;
      const volume = data[j].volume || 0;

      // マネーフロー乗数を計算
      const range = high - low;
      if (range === 0) continue;

      const moneyFlowMultiplier = ((close - low) - (high - close)) / range;
      const moneyFlowVolume = moneyFlowMultiplier * volume * close;

      sumMoneyFlowVolume += moneyFlowVolume;
      sumVolume += volume;
    }

    if (sumVolume > 0) {
      cmf[i] = sumMoneyFlowVolume / sumVolume;
    }
  }

  return cmf;
};

/**
 * KAMA（カウフマン適応型移動平均）を計算する
 * @param data 株価データ
 * @param period ER計算期間（デフォルト10日）
 * @param fastPeriod 最速期間（デフォルト2日）
 * @param slowPeriod 最遅期間（デフォルト30日）
 * @returns KAMA配列
 */
export const calculateKAMA = (
  data: any[],
  period: number = 10,
  fastPeriod: number = 2,
  slowPeriod: number = 30
): (number | null)[] => {
  const kama: (number | null)[] = new Array(data.length).fill(null);

  if (data.length < period + 1) return kama;

  // スムージング定数を計算
  const fastestSC = 2 / (fastPeriod + 1);
  const slowestSC = 2 / (slowPeriod + 1);

  // 最初のKAMAは単純移動平均
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  kama[period - 1] = sum / period;

  // 以降のKAMA計算
  for (let i = period; i < data.length; i++) {
    // ER（効率比）を計算
    const change = Math.abs(data[i].close - data[i - period].close);

    let volatility = 0;
    for (let j = i - period + 1; j <= i; j++) {
      volatility += Math.abs(data[j].close - data[j - 1].close);
    }

    const er = volatility > 0 ? change / volatility : 0;

    // スムージング定数を計算
    const sc = Math.pow(er * (fastestSC - slowestSC) + slowestSC, 2);

    // KAMAを計算
    const prevKAMA = kama[i - 1] ?? data[i].close;
    kama[i] = prevKAMA + sc * (data[i].close - prevKAMA);
  }

  return kama;
};

/**
 * Aroon指標を計算する
 * @param data 株価データ
 * @param period 期間（デフォルト25日）
 * @returns {aroonUp, aroonDown}の配列
 */
export const calculateAroon = (data: any[], period: number = 25): Array<{aroonUp: number, aroonDown: number} | null> => {
  const aroon: Array<{aroonUp: number, aroonDown: number} | null> = new Array(data.length).fill(null);

  if (data.length < period) return aroon;

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);

    // 最高値と最安値のインデックスを見つける
    let highestIndex = 0;
    let lowestIndex = 0;
    let highestPrice = slice[0].high;
    let lowestPrice = slice[0].low;

    for (let j = 1; j < slice.length; j++) {
      if (slice[j].high > highestPrice) {
        highestPrice = slice[j].high;
        highestIndex = j;
      }
      if (slice[j].low < lowestPrice) {
        lowestPrice = slice[j].low;
        lowestIndex = j;
      }
    }

    // 最高値/最安値からの日数
    const daysSinceHigh = period - 1 - highestIndex;
    const daysSinceLow = period - 1 - lowestIndex;

    // Aroon計算
    const aroonUp = ((period - daysSinceHigh) / period) * 100;
    const aroonDown = ((period - daysSinceLow) / period) * 100;

    aroon[i] = {
      aroonUp: isFinite(aroonUp) ? aroonUp : 0,
      aroonDown: isFinite(aroonDown) ? aroonDown : 0
    };
  }

  return aroon;
};

/**
 * Elder's Force Index（エルダーのフォースインデックス）を計算する
 * @param data 株価データ
 * @param period EMA期間（デフォルト13日）
 * @returns フォースインデックス配列
 */
export const calculateForceIndex = (data: any[], period: number = 13): (number | null)[] => {
  const forceIndex: (number | null)[] = new Array(data.length).fill(null);

  if (data.length < 2) return forceIndex;

  // Raw Force Indexを計算
  const rawForce: number[] = new Array(data.length).fill(0);
  for (let i = 1; i < data.length; i++) {
    const priceChange = data[i].close - data[i - 1].close;
    rawForce[i] = priceChange * data[i].volume;
  }

  // EMAでスムージング
  if (data.length < period + 1) return forceIndex;

  // 最初のEMAは単純移動平均
  let sum = 0;
  for (let i = 1; i <= period; i++) {
    sum += rawForce[i];
  }
  forceIndex[period] = sum / period;

  // 平滑化定数
  const multiplier = 2 / (period + 1);

  // 以降はEMA計算
  for (let i = period + 1; i < data.length; i++) {
    forceIndex[i] = (rawForce[i] - forceIndex[i - 1]!) * multiplier + forceIndex[i - 1]!;
  }

  return forceIndex;
};

/**
 * ピボットポイントを計算する
 * @param data 株価データ
 * @returns {pivot, s1, s2, r1, r2}の配列
 */
export const calculatePivotPoints = (data: any[]): Array<{pivot: number, s1: number, s2: number, r1: number, r2: number} | null> => {
  const pivots: Array<{pivot: number, s1: number, s2: number, r1: number, r2: number} | null> = new Array(data.length).fill(null);

  if (data.length < 2) return pivots;

  for (let i = 1; i < data.length; i++) {
    const prevHigh = data[i - 1].high;
    const prevLow = data[i - 1].low;
    const prevClose = data[i - 1].close;

    // ピボットポイント = (前日高値 + 前日安値 + 前日終値) / 3
    const pivot = (prevHigh + prevLow + prevClose) / 3;

    // サポート・レジスタンスレベル
    const r1 = (2 * pivot) - prevLow;
    const s1 = (2 * pivot) - prevHigh;
    const r2 = pivot + (prevHigh - prevLow);
    const s2 = pivot - (prevHigh - prevLow);

    pivots[i] = {
      pivot: isFinite(pivot) ? pivot : 0,
      s1: isFinite(s1) ? s1 : 0,
      s2: isFinite(s2) ? s2 : 0,
      r1: isFinite(r1) ? r1 : 0,
      r2: isFinite(r2) ? r2 : 0
    };
  }

  return pivots;
};

/**
 * フィボナッチリトレースメントレベルを計算する
 * @param data 株価データ
 * @param lookback スイング高値・安値を探す期間（デフォルト20日）
 * @returns {high, low, fib236, fib382, fib500, fib618, fib786}の配列
 */
export const calculateFibonacciLevels = (data: any[], lookback: number = 20): Array<{
  high: number,
  low: number,
  fib236: number,
  fib382: number,
  fib500: number,
  fib618: number,
  fib786: number,
  isUptrend: boolean
} | null> => {
  const fibs: Array<{
    high: number,
    low: number,
    fib236: number,
    fib382: number,
    fib500: number,
    fib618: number,
    fib786: number,
    isUptrend: boolean
  } | null> = new Array(data.length).fill(null);

  if (data.length < lookback) return fibs;

  for (let i = lookback; i < data.length; i++) {
    const slice = data.slice(i - lookback, i);

    // スイング高値・安値を検出
    const swingHigh = Math.max(...slice.map((d: any) => d.high));
    const swingLow = Math.min(...slice.map((d: any) => d.low));
    const range = swingHigh - swingLow;

    // 最近の価格動向を判定（上昇トレンドか下降トレンドか）
    const recentClose = data[i - 1].close;
    const isUptrend = recentClose > (swingHigh + swingLow) / 2;

    // フィボナッチレベルを計算（上昇トレンド後の調整を想定）
    let fib236, fib382, fib500, fib618, fib786;

    if (isUptrend) {
      // 上昇トレンド：高値からの調整レベル
      fib236 = swingHigh - (range * 0.236);
      fib382 = swingHigh - (range * 0.382);
      fib500 = swingHigh - (range * 0.500);
      fib618 = swingHigh - (range * 0.618);
      fib786 = swingHigh - (range * 0.786);
    } else {
      // 下降トレンド：安値からの反発レベル
      fib236 = swingLow + (range * 0.236);
      fib382 = swingLow + (range * 0.382);
      fib500 = swingLow + (range * 0.500);
      fib618 = swingLow + (range * 0.618);
      fib786 = swingLow + (range * 0.786);
    }

    fibs[i] = {
      high: swingHigh,
      low: swingLow,
      fib236: isFinite(fib236) ? fib236 : 0,
      fib382: isFinite(fib382) ? fib382 : 0,
      fib500: isFinite(fib500) ? fib500 : 0,
      fib618: isFinite(fib618) ? fib618 : 0,
      fib786: isFinite(fib786) ? fib786 : 0,
      isUptrend
    };
  }

  return fibs;
};

/**
 * ROC（Rate of Change / 変化率）を計算する
 * @param data 株価データ
 * @param period 期間（デフォルト12日）
 * @returns ROC配列
 */
export const calculateROC = (data: any[], period: number = 12): (number | null)[] => {
  const roc: (number | null)[] = new Array(data.length).fill(null);

  if (data.length < period + 1) return roc;

  for (let i = period; i < data.length; i++) {
    const currentPrice = data[i].close;
    const pastPrice = data[i - period].close;

    if (pastPrice > 0) {
      const rocValue = ((currentPrice - pastPrice) / pastPrice) * 100;
      roc[i] = isFinite(rocValue) ? rocValue : null;
    }
  }

  return roc;
};

/**
 * MFI（マネーフローインデックス）を計算する
 * @param data 株価データ
 * @param period 期間（デフォルト14日）
 * @returns MFI配列
 */
export const calculateMFI = (data: any[], period: number = 14): (number | null)[] => {
  const mfi: (number | null)[] = new Array(data.length).fill(null);

  if (data.length < period + 1) return mfi;

  for (let i = period; i < data.length; i++) {
    let positiveMoneyFlow = 0;
    let negativeMoneyFlow = 0;

    for (let j = i - period + 1; j <= i; j++) {
      // Typical Price = (High + Low + Close) / 3
      const typicalPrice = (data[j].high + data[j].low + data[j].close) / 3;
      const moneyFlow = typicalPrice * data[j].volume;

      if (j > i - period + 1) {
        const prevTypicalPrice = (data[j - 1].high + data[j - 1].low + data[j - 1].close) / 3;

        if (typicalPrice > prevTypicalPrice) {
          positiveMoneyFlow += moneyFlow;
        } else if (typicalPrice < prevTypicalPrice) {
          negativeMoneyFlow += moneyFlow;
        }
      }
    }

    if (negativeMoneyFlow === 0) {
      mfi[i] = 100;
    } else {
      const moneyFlowRatio = positiveMoneyFlow / negativeMoneyFlow;
      const mfiValue = 100 - (100 / (1 + moneyFlowRatio));
      mfi[i] = isFinite(mfiValue) ? mfiValue : null;
    }
  }

  return mfi;
};

/**
 * ATRトレーリングストップを計算する
 * @param data 株価データ
 * @param period ATR期間（デフォルト14日）
 * @param multiplier ATR乗数（デフォルト3）
 * @returns トレーリングストップ配列（正：ロング、負：ショート）
 */
export const calculateATRTrailingStop = (data: any[], period: number = 14, multiplier: number = 3): (number | null)[] => {
  const trailingStop: (number | null)[] = new Array(data.length).fill(null);

  if (data.length < period + 1) return trailingStop;

  const atr = calculateATR(data, period);
  let trend = 1; // 1: ロング, -1: ショート
  let stop = 0;

  for (let i = period; i < data.length; i++) {
    const atrValue = atr[i];
    if (!atrValue || !isFinite(atrValue)) continue;

    const longStop = data[i].close - (atrValue * multiplier);
    const shortStop = data[i].close + (atrValue * multiplier);

    if (i === period) {
      stop = longStop;
      trend = 1;
    } else {
      const prevStop = trailingStop[i - 1];
      if (!prevStop) continue;

      if (trend === 1) {
        // ロングトレンド
        stop = Math.max(longStop, Math.abs(prevStop));
        if (data[i].close < stop) {
          trend = -1;
          stop = shortStop;
        }
      } else {
        // ショートトレンド
        stop = Math.min(shortStop, Math.abs(prevStop));
        if (data[i].close > stop) {
          trend = 1;
          stop = longStop;
        }
      }
    }

    trailingStop[i] = trend === 1 ? stop : -stop;
  }

  return trailingStop;
};

/**
 * ボリンジャーバンド幅を計算する
 * @param data 株価データ
 * @param period 期間（デフォルト20日）
 * @param stdDev 標準偏差倍率（デフォルト2）
 * @returns {width: number, upper: number, middle: number, lower: number}の配列
 */
export const calculateBollingerBandWidth = (data: any[], period: number = 20, stdDev: number = 2): Array<{
  width: number,
  upper: number,
  middle: number,
  lower: number,
  percentB: number
} | null> => {
  const bbWidth: Array<{
    width: number,
    upper: number,
    middle: number,
    lower: number,
    percentB: number
  } | null> = new Array(data.length).fill(null);

  if (data.length < period) return bbWidth;

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const prices = slice.map((d: any) => d.close);

    // 移動平均（ミドルバンド）
    const middle = prices.reduce((sum: number, price: number) => sum + price, 0) / period;

    // 標準偏差
    const variance = prices.reduce((sum: number, price: number) => sum + Math.pow(price - middle, 2), 0) / period;
    const sd = Math.sqrt(variance);

    const upper = middle + (stdDev * sd);
    const lower = middle - (stdDev * sd);

    // バンド幅 = (上限 - 下限) / 中央
    const width = middle > 0 ? ((upper - lower) / middle) * 100 : 0;

    // %B = (価格 - 下限) / (上限 - 下限)
    const percentB = (upper - lower) > 0 ? ((data[i].close - lower) / (upper - lower)) * 100 : 50;

    bbWidth[i] = {
      width: isFinite(width) ? width : 0,
      upper: isFinite(upper) ? upper : 0,
      middle: isFinite(middle) ? middle : 0,
      lower: isFinite(lower) ? lower : 0,
      percentB: isFinite(percentB) ? percentB : 50
    };
  }

  return bbWidth;
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

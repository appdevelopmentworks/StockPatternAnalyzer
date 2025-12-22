import { StockData, BacktestResult } from './types';
import { 
  runWeekdayStrategy, 
  runNDaysStrategy, 
  runMonthlyStrategy 
} from './strategies';
import {
  runMovingAverageCrossStrategy,
  runRSIStrategy,
  runBollingerBandStrategy,
  runRCIStrategy,
  runMovingAverageCross10_50Strategy,
  runMovingAverageCross20_200Strategy,
  runEnvelopeStrategy
} from './technical-strategies';
import {
  runMomentumStrategy,
  runMACDStrategy,
  runStochasticStrategy,
  runMeanReversionStrategy,
  runBreakoutStrategy,
  runGapStrategy,
  runVolatilityBreakoutStrategy,
  runADXStrategy,
  runDonchianChannelStrategy,
  runWilliamsRStrategy,
  runCCIStrategy,
  runParabolicSARStrategy,
  runKeltnerChannelStrategy,
  runSuperTrendStrategy,
  runHeikenAshiStrategy,
  runChoppinessStrategy,
  runAroonStrategy,
  runForceIndexStrategy,
  runEMARibbonStrategy,
  runPivotPointStrategy,
  runFibonacciStrategy,
  runROCStrategy,
  runMFIStrategy,
  runATRTrailingStopStrategy,
  runBollingerSqueezeStrategy,
  runTRIXStrategy,
  runCMFStrategy,
  runTurtleTradingStrategy,
  runKAMAStrategy
} from './advanced-strategies';
import {
  runCompositeStrategy,
  runSeasonalStrategy,
  runIchimokuStrategy,
  runOBVStrategy,
  runVWMAStrategy
} from './composite-strategies';
import { validateStockData } from './utils';

/**
 * 全ての戦略でバックテストを実行
 * @param data 株価データ
 * @returns バックテスト結果の配列
 */
export const runAllBacktests = (data: StockData[]): BacktestResult[] => {
  console.log(`バックテスト開始: ${data.length}件のデータ`);
  
  // データの妥当性チェック
  const validData = validateStockData(data);
  
  console.log(`有効なデータ: ${validData.length}/${data.length}件`);
  
  if (validData.length < 20) {
    console.warn('バックテストに必要なデータが不十分です');
    return [];
  }
  
  const results: BacktestResult[] = [];
  
  try {
    // 曜日戦略
    console.log('曜日戦略を実行中...');
    results.push(runWeekdayStrategy(validData, 1, 5, "月曜買い・金曜売り"));
    results.push(runWeekdayStrategy(validData, 2, 4, "火曜買い・木曜売り"));
    results.push(runWeekdayStrategy(validData, 3, 1, "水曜買い・月曜売り"));
    results.push(runWeekdayStrategy(validData, 5, 2, "金曜買い・火曜売り"));
    
    // N営業日戦略
    console.log('N日保有戦略を実行中...');
    results.push(runNDaysStrategy(validData, 1, "1日保有"));
    results.push(runNDaysStrategy(validData, 3, "3日保有"));
    results.push(runNDaysStrategy(validData, 5, "5日保有"));
    results.push(runNDaysStrategy(validData, 10, "10日保有"));
    results.push(runNDaysStrategy(validData, 20, "20日保有（1ヶ月）"));
    
    // その他の戦略
    console.log('その他の戦略を実行中...');
    results.push(runMonthlyStrategy(validData, "月初買い・月末売り"));
    results.push(runMovingAverageCrossStrategy(validData, "移動平均クロス(5/20)"));
    results.push(runMovingAverageCross10_50Strategy(validData, "移動平均クロス(10/50)"));
    results.push(runMovingAverageCross20_200Strategy(validData, "移動平均クロス(20/200)"));
    results.push(runRSIStrategy(validData, "RSI戦略(30/70)"));
    results.push(runBollingerBandStrategy(validData, "ボリンジャーバンド"));
    results.push(runRCIStrategy(validData, "RCI戦略(-80/80)"));
    results.push(runEnvelopeStrategy(validData, "エンベロープ戦略"));
    
    // 高度な戦略
    console.log('高度な戦略を実行中...');
    results.push(runMomentumStrategy(validData, "モメンタム戦略"));
    results.push(runMACDStrategy(validData, "MACD戦略"));
    results.push(runStochasticStrategy(validData, "ストキャスティクス戦略"));
    results.push(runMeanReversionStrategy(validData, "平均回帰戦略"));
    results.push(runBreakoutStrategy(validData, "ブレイクアウト戦略"));
    results.push(runGapStrategy(validData, "ギャップ戦略"));
    results.push(runVolatilityBreakoutStrategy(validData, "ボラティリティーブレイクアウト"));
    results.push(runADXStrategy(validData, "ADX戦略"));
    results.push(runDonchianChannelStrategy(validData, "ドンチャンチャネル"));
    results.push(runWilliamsRStrategy(validData, "ウィリアムズ%R"));
    results.push(runCCIStrategy(validData, "CCI戦略"));
    results.push(runParabolicSARStrategy(validData, "パラボリックSAR"));
    results.push(runKeltnerChannelStrategy(validData, "ケルトナーチャネル"));
    console.log('スーパートレンド戦略を実行中...');
    const superTrendResult = runSuperTrendStrategy(validData, "スーパートレンド");
    console.log('スーパートレンド結果:', {
      strategy: superTrendResult.strategy,
      totalTrades: superTrendResult.totalTrades,
      totalReturn: superTrendResult.totalReturn,
      winRate: superTrendResult.winRate
    });
    results.push(superTrendResult);

    console.log('平均足戦略を実行中...');
    const heikenAshiResult = runHeikenAshiStrategy(validData, "平均足");
    console.log('平均足結果:', {
      strategy: heikenAshiResult.strategy,
      totalTrades: heikenAshiResult.totalTrades,
      totalReturn: heikenAshiResult.totalReturn,
      winRate: heikenAshiResult.winRate
    });
    results.push(heikenAshiResult);

    results.push(runChoppinessStrategy(validData, "チョピネス指数"));
    results.push(runAroonStrategy(validData, "アルーン指標"));
    results.push(runForceIndexStrategy(validData, "エルダーのフォースインデックス"));
    results.push(runEMARibbonStrategy(validData, "EMAリボン戦略"));
    results.push(runPivotPointStrategy(validData, "ピボットポイント"));
    results.push(runFibonacciStrategy(validData, "フィボナッチリトレースメント"));
    results.push(runROCStrategy(validData, "ROC（変化率）"));
    results.push(runMFIStrategy(validData, "MFI（マネーフローインデックス）"));
    results.push(runATRTrailingStopStrategy(validData, "ATRトレーリングストップ"));
    results.push(runBollingerSqueezeStrategy(validData, "ボリンジャースクイーズ"));
    results.push(runTRIXStrategy(validData, "TRIX（トリプルEMA）"));
    results.push(runCMFStrategy(validData, "CMF（チェイキン・マネーフロー）"));
    results.push(runTurtleTradingStrategy(validData, "タートルトレーディング"));
    results.push(runKAMAStrategy(validData, "KAMA（適応型移動平均）"));

    // 複合・特殊戦略
    console.log('複合・特殊戦略を実行中...');
    results.push(runCompositeStrategy(validData, "複合戦略"));
    results.push(runSeasonalStrategy(validData, "季節性戦略"));
    results.push(runIchimokuStrategy(validData, "一目均衡表（三役好転/三役逆転）"));
    results.push(runOBVStrategy(validData, "OBV (オン・バランス・ボリューム)"));
    results.push(runVWMAStrategy(validData, "出来高加重移動平均（VWMA）"));
    
    // 結果のフィルタリング
    const validResults = results.filter(result =>
      result &&
      isFinite(result.totalReturn) &&
      isFinite(result.winRate) &&
      result.totalTrades >= 0
    );

    // デバッグ：フィルタリングされた戦略を表示
    const filteredOut = results.filter(result =>
      !result ||
      !isFinite(result.totalReturn) ||
      !isFinite(result.winRate) ||
      result.totalTrades < 0
    );

    if (filteredOut.length > 0) {
      console.warn(`フィルタリングされた戦略 (${filteredOut.length}):`,
        filteredOut.map(r => r?.strategy || 'unknown').join(', '));
    }

    // 取引がゼロの戦略を表示
    const noTrades = validResults.filter(r => r.totalTrades === 0);
    if (noTrades.length > 0) {
      console.warn(`取引がゼロの戦略 (${noTrades.length}):`,
        noTrades.map(r => r.strategy).join(', '));
    }

    console.log(`バックテスト完了: ${validResults.length}/${results.length}戦略が有効`);
    return validResults;
    
  } catch (error) {
    console.error('バックテスト中にエラーが発生:', error);
    return [];
  }
};

/**
 * 特定の戦略のみ実行
 * @param data 株価データ
 * @param strategyType 戦略タイプ
 * @returns バックテスト結果
 */
export const runSingleBacktest = (
  data: StockData[], 
  strategyType: 'weekday' | 'ndays' | 'ma-cross' | 'rsi' | 'bollinger',
  params?: any
): BacktestResult | null => {
  const validData = validateStockData(data);
  
  if (validData.length < 20) {
    console.warn('バックテストに必要なデータが不十分です');
    return null;
  }
  
  try {
    switch (strategyType) {
      case 'weekday':
        return runWeekdayStrategy(
          validData, 
          params?.buyDay || 1, 
          params?.sellDay || 5, 
          params?.name || "曜日戦略"
        );
      
      case 'ndays':
        return runNDaysStrategy(
          validData, 
          params?.holdDays || 5, 
          params?.name || "N日保有戦略"
        );
      
      case 'ma-cross':
        return runMovingAverageCrossStrategy(validData, "移動平均クロス戦略");
      
      case 'rsi':
        return runRSIStrategy(validData, "RSI戦略");
      
      case 'bollinger':
        return runBollingerBandStrategy(validData, "ボリンジャーバンド戦略");
      
      default:
        console.error('未知の戦略タイプ:', strategyType);
        return null;
    }
  } catch (error) {
    console.error('バックテスト実行中にエラー:', error);
    return null;
  }
};

// エクスポート用の便利関数
export const getStrategyPerformanceRanking = (results: BacktestResult[]) => {
  return {
    byTotalReturn: [...results].sort((a, b) => b.totalReturn - a.totalReturn),
    byWinRate: [...results].sort((a, b) => b.winRate - a.winRate),
    bySharpeRatio: [...results].sort((a, b) => b.sharpeRatio - a.sharpeRatio),
    byMaxDrawdown: [...results].sort((a, b) => a.maxDrawdown - b.maxDrawdown)
  };
};

export const getBestStrategy = (results: BacktestResult[]) => {
  if (results.length === 0) return null;
  
  // 複数の指標を組み合わせたスコア計算
  const scoredResults = results.map(result => ({
    ...result,
    score: (
      (result.totalReturn * 0.4) +        // 総リターン 40%
      (result.winRate * 0.3) +            // 勝率 30%
      (result.sharpeRatio * 10 * 0.2) +   // シャープレシオ 20%
      (-result.maxDrawdown * 0.1)         // 最大ドローダウン 10%
    )
  }));
  
  return scoredResults.sort((a, b) => b.score - a.score)[0];
};

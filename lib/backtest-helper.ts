// バックテスト機能の簡単な統合ヘルパー
import { runAllBacktests } from '@/lib/backtest';

export const addBacktestFunctionality = () => {
  
  // データ取得とバックテスト実行関数
  const fetchStockDataWithBacktest = async (ticker: string, period: string, setStockData: any, setStats: any, setBacktestResults: any, setLoading: any, setError: any, processAnalytics: any) => {
    setLoading(true);
    setError(null);
    console.log(`データ取得開始: ${ticker}, 期間: ${period}`);
    
    try {
      const response = await fetch(`/api/stock?ticker=${ticker}&period=${period}`);
      const data = await response.json();
      
      console.log('APIレスポンス:', data);
      
      if (data.error) {
        console.warn(`APIエラー: ${data.error}`);
      }
      
      if (data.demo) {
        console.log('デモデータを使用中');
      }
      
      if (data.data && data.data.length > 0) {
        // データの妥当性チェック
        const validDataPoints = data.data.filter((item: any) => 
          item.close > 0 && 
          isFinite(item.close) && 
          item.date
        );
        
        console.log(`有効なデータポイント: ${validDataPoints.length}/${data.data.length}`);
        
        if (validDataPoints.length < 10) {
          setError(`有効なデータが不十分です (${validDataPoints.length}件)。異なる期間を選択してください。`);
          return;
        }
        
        setStockData(data.data);
        setStats(data.stats);
        
        console.log('アナリティクス処理開始');
        processAnalytics(data.data);
        
        console.log('バックテスト開始');
        const backtestResults = runAllBacktests(data.data);
        setBacktestResults(backtestResults);
        
        console.log('データ処理完了');
      } else {
        const errorMsg = "データを取得できませんでした。異なるティッカーまたは期間を試してください。";
        console.error(errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      const errorMsg = `データの取得に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg, error);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // アナリティクス処理関数
  const processAnalytics = (data: any[]) => {
    if (!data || data.length < 2) {
      return { weekdayData: [], monthlyData: [], heatmapData: [] };
    }

    // 曜日別分析
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const weekdayReturns: { [key: number]: number[] } = {};
    
    data.forEach((item, index) => {
      if (index === 0) return;
      const date = new Date(item.date);
      const dayOfWeek = date.getDay();
      const returns = ((item.close - data[index - 1].close) / data[index - 1].close) * 100;
      
      if (!weekdayReturns[dayOfWeek]) {
        weekdayReturns[dayOfWeek] = [];
      }
      weekdayReturns[dayOfWeek].push(returns);
    });

    const weekdayAnalysis = weekdays.map((day, index) => ({
      day,
      avgReturn: weekdayReturns[index] 
        ? weekdayReturns[index].reduce((a, b) => a + b, 0) / weekdayReturns[index].length 
        : 0,
      count: weekdayReturns[index]?.length || 0
    }));

    // 月別分析
    const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
    const monthlyReturns: { [key: number]: number[] } = {};
    
    data.forEach((item, index) => {
      if (index === 0) return;
      const date = new Date(item.date);
      const month = date.getMonth();
      const returns = ((item.close - data[index - 1].close) / data[index - 1].close) * 100;
      
      if (!monthlyReturns[month]) {
        monthlyReturns[month] = [];
      }
      monthlyReturns[month].push(returns);
    });

    const monthlyAnalysis = months.map((month, index) => ({
      month,
      avgReturn: monthlyReturns[index] 
        ? monthlyReturns[index].reduce((a, b) => a + b, 0) / monthlyReturns[index].length 
        : 0,
      count: monthlyReturns[index]?.length || 0
    }));

    // ヒートマップデータ作成
    const heatmap: { [key: string]: number } = {};
    data.forEach((item, index) => {
      if (index === 0) return;
      const date = new Date(item.date);
      const month = date.getMonth();
      const dayOfWeek = date.getDay();
      const key = `${month}-${dayOfWeek}`;
      const returns = ((item.close - data[index - 1].close) / data[index - 1].close) * 100;
      
      if (!heatmap[key]) {
        heatmap[key] = 0;
      }
      heatmap[key] += returns;
    });

    const heatmapArray = [];
    for (let m = 0; m < 12; m++) {
      for (let d = 0; d < 7; d++) {
        const key = `${m}-${d}`;
        heatmapArray.push({
          month: months[m],
          weekday: weekdays[d],
          value: heatmap[key] || 0,
          x: d,
          y: m
        });
      }
    }

    return { weekdayAnalysis, monthlyAnalysis, heatmapArray };
  };

  return { fetchStockDataWithBacktest, processAnalytics };
};

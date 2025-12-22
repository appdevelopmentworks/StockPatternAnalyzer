"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, Cell } from "recharts";
import { TrendingUp, TrendingDown, Activity, DollarSign, Calendar, BarChart3, Loader2, Moon, Sun, BarChart2 } from "lucide-react";
import { useTheme } from "next-themes";
import CandlestickChart from "@/components/CandlestickChart";
import Image from "next/image";
import { runAllBacktests } from "@/lib/backtest/index";
import { addBacktestFunctionality } from "@/lib/backtest-helper";

interface StockData {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockStats {
  currentPrice: number;
  previousClose: number;
  dayChange: number;
  dayChangePercent: number;
  high52Week: number;
  low52Week: number;
  avgVolume: number;
}

interface BacktestResult {
  strategy: string;
  totalReturn: number;
  winRate: number;
  totalTrades: number;
  avgReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: Trade[];
}

interface Trade {
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  return: number;
  profit: number;
}

const popularTickers = [
  { value: "AAPL", label: "Apple" },
  { value: "GOOGL", label: "Google" },
  { value: "MSFT", label: "Microsoft" },
  { value: "TSLA", label: "Tesla" },
  { value: "META", label: "Meta" },
  { value: "AMZN", label: "Amazon" },
  { value: "NVDA", label: "NVIDIA" },
  { value: "BTC-USD", label: "ビットコイン" },
  { value: "ETH-USD", label: "イーサリアム" },
  { value: "SPY", label: "S&P 500" },
  { value: "^N225", label: "日経平均" },
  { value: "GC=F", label: "金先物" },
  { value: "^TNX", label: "米10年債" },
  { value: "IYR", label: "不動産ETF" },
];

export default function Home() {
  const [ticker, setTicker] = useState("AAPL");
  const [period, setPeriod] = useState("10y");
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [stats, setStats] = useState<StockStats | null>(null);
  const [weekdayData, setWeekdayData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("0");
  const [error, setError] = useState<string | null>(null);
  const [showCandlestick, setShowCandlestick] = useState(true);
  const [chartSortBy, setChartSortBy] = useState<'totalReturn' | 'winRate'>('totalReturn');
  const [displayCount, setDisplayCount] = useState<string>('50');
  const [tradeFilter, setTradeFilter] = useState<string>('all');
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 戦略の説明
  const strategyDescriptions: { [key: string]: string } = {
    "月曜買い・金曜売り": "月曜日の朝に買い、金曜日に売却する曜日効果を活用した戦略",
    "火曜買い・木曜売り": "火曜日に買い、木曜日に売却する短期的な曜日パターンを狙う戦略",
    "水曜買い・月曜売り": "水曜日に買い、翌週月曜日に売却するクロスウィーク戦略",
    "金曜買い・火曜売り": "金曜日に買い、翌週火曜日に売却する週末効果を活用する戦略",
    "1日保有": "1営業日のみ保有するデイトレーディング風の超短期戦略",
    "3日保有": "3営業日保有する短期スイングトレード戦略",
    "5日保有": "1週間程度保有する中期的なトレンド追従戦略",
    "10日保有": "2週間程度保有する中期投資戦略",
    "20日保有（1ヶ月）": "約1ヶ月保有する長期的なトレンド戦略",
    "移動平均クロス(5/20)": "5日移動平均が20日移動平均を上抜け/下抜けでエントリー/エグジット",
    "移動平均クロス(10/50)": "10日移動平均が50日移動平均を上抜け/下抜けでエントリー/エグジット",
    "移動平均クロス(20/200)": "20日移動平均が200日移動平均を上抜け/下抜けでエントリー/エグジット",
    "RSI戦略(30/70)": "RSIが30以下で買い、70以上で売る逆張り戦略",
    "ボリンジャーバンド": "価格がボリンジャーバンドの上下限に触れた時の逆張り戦略",
    "RCI戦略(-80/80)": "RCI(順位相関指数)が-80以下で買い、80以上で売る逆張り戦略",
    "エンベロープ戦略": "移動平均の上下2.5%のバンドで逆張りする戦略",
    "月初買い・月末売り": "月初に買い、月末に売却する月次効果を活用した戦略",
    "モメンタム戦略": "過去10日間の価格変化率を基にトレンド方向への順張り戦略",
    "MACD戦略": "MACDラインがシグナルラインを上抜け/下抜けでエントリー/エグジット",
    "ストキャスティクス戦略": "ストキャスティクス%Kが20以下で買い、80以上で売る逆張り戦略",
    "平均回帰戦略": "価格が平均から大きく乖離した時の逆張り戦略（Zスコア使用）",
    "ブレイクアウト戦略": "過去20日間の最高値を上抜けした時の順張り戦略",
    "ギャップ戦略": "前日終値から2%以上のギャップアップ時の逆張り戦略",
    "ボラティリティーブレイクアウト": "通常の2倍以上のボラティリティ発生時の順張り戦略",
    "ADX戦略": "ADX(平均方向性指数)が25以上の強いトレンド時にのみトレードする順張り戦略",
    "ドンチャンチャネル": "過去20日間の最高値ブレイクで買い、最低値ブレイクで売るタートルトレーディング戦略",
    "ウィリアムズ%R": "ウィリアムズ%Rが-80以下で買い、-20以上で売る逆張り戦略",
    "CCI戦略": "CCI(商品チャンネル指数)が-100以下で買い、100以上で売る逆張り戦略",
    "パラボリックSAR": "SARがトレンド転換を示したタイミングでエントリー/エグジットする順張り戦略",
    "ケルトナーチャネル": "ATRベースのチャネル上下限で逆張りする戦略",
    "複合戦略": "RSI、MACD、ボリンジャーバンドを組み合わせた高度な戦略",
    "季節性戦略": "\"Sell in May and Go Away\"効果を活用した季節性投資戦略",
    "一目均衡表（三役好転/三役逆転）": "転換線、基準線、雲の位置関係による三役好転/逆転戦略",
    "OBV (オン・バランス・ボリューム)": "出来高の累積指標OBVと移動平均のクロスオーバー戦略",
    "出来高加重移動平均（VWMA）": "出来高を加味したVWMAと通常のSMAのクロスオーバー戦略",
    "スーパートレンド": "ATRベースの動的サポート/レジスタンスによるトレンドフォロー戦略",
    "平均足": "価格を平滑化した平均足チャートによるトレンド転換検出戦略",
    "チョピネス指数": "市場のトレンド/レンジ状態を判定し、トレンド時のみトレードする戦略",
    "アルーン指標": "期間内の最高値/最安値からの経過日数でトレンドの強さと方向を判定する戦略",
    "エルダーのフォースインデックス": "価格変化と出来高を組み合わせた買い圧力/売り圧力を測定する戦略",
    "EMAリボン戦略": "複数のEMA(8,13,21,34,55,89日)の整列状態でトレンドの強さを判定する戦略"
  };

  // バックテスト機能の初期化
  const { fetchStockDataWithBacktest, processAnalytics } = addBacktestFunctionality();

  // データ取得関数
  const handleFetchStockData = async () => {
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
        const validDataPoints = data.data.filter((item: StockData) => 
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
        
        // アナリティクス処理
        console.log('アナリティクス処理開始');
        const analyticsResult = processAnalytics(data.data);
        setWeekdayData(analyticsResult.weekdayAnalysis || []);
        setMonthlyData(analyticsResult.monthlyAnalysis || []);
        setHeatmapData(analyticsResult.heatmapArray || []);
        
        // バックテスト実行
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

  // 日本株判定
  const isJapaneseStock = (symbol: string) => {
    return symbol.includes('^N225') || symbol.endsWith('.T');
  };

  const currencySymbol = isJapaneseStock(ticker) ? '¥' : '$';

  // メタデータ設定
  useEffect(() => {
    document.title = 'Stock Pattern Analyzer - 高度な株価分析ツール';
    
    const updateOrCreateMeta = (property: string, content: string, type: 'property' | 'name' = 'property') => {
      let meta = document.querySelector(`meta[${type}="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(type, property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    updateOrCreateMeta('og:title', 'Stock Pattern Analyzer');
    updateOrCreateMeta('og:description', '高度なテクニカル分析とバックテスト機能を備えた株価分析ツール');
    updateOrCreateMeta('og:image', `${window.location.origin}/logo.png`);
    updateOrCreateMeta('og:url', window.location.href);
    updateOrCreateMeta('og:type', 'website');
    
    updateOrCreateMeta('twitter:card', 'summary_large_image', 'name');
    updateOrCreateMeta('twitter:title', 'Stock Pattern Analyzer', 'name');
    updateOrCreateMeta('twitter:description', '高度なテクニカル分析とバックテスト機能を備えた株価分析ツール', 'name');
    updateOrCreateMeta('twitter:image', `${window.location.origin}/logo.png`, 'name');
    
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.setAttribute('rel', 'icon');
      document.head.appendChild(favicon);
    }
    favicon.setAttribute('href', '/logo.png');
  }, []);

  // 初期データ読み込み
  useEffect(() => {
    handleFetchStockData();
  }, []);

  // チャートデータの準備用の移動平均計算（簡易版）
  const calculateChartMA = (data: StockData[], period: number) => {
    return data.map((item, index) => {
      if (index < period - 1) return null;
      const sum = data.slice(index - period + 1, index + 1).reduce((acc, curr) => acc + curr.close, 0);
      return sum / period;
    });
  };

  const ma5 = stockData.length > 0 ? calculateChartMA(stockData, 5) : [];
  const ma20 = stockData.length > 0 ? calculateChartMA(stockData, 20) : [];
  const ma200 = stockData.length > 0 ? calculateChartMA(stockData, 200) : [];

  // チャートデータの準備
  const chartData = stockData.length > 0 ? stockData.map((item, index) => ({
    ...item,
    ma5: ma5[index],
    ma20: ma20[index],
    ma200: ma200[index],
    displayDate: new Date(item.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
  })) : [];

  // ローソク足用のデータ準備
  const candlestickData = stockData.length > 0 ? stockData.map((item, index) => ({
    date: item.date,
    displayDate: new Date(item.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    volume: item.volume,
    ma5: ma5[index],
    ma20: ma20[index],
    ma200: ma200[index]
  })) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4 lg:p-8">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="relative w-16 h-16">
              <Image
                src="/logo.png"
                alt="Stock Pattern Analyzer Logo"
                width={64}
                height={64}
                className="rounded-lg shadow-lg"
                priority
              />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Stock Pattern Analyzer
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">リアルタイムデータで最適な売買タイミングを分析</p>
        </div>

        {/* コントロールパネル */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">ティッカー</label>
                <Input
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="例: AAPL"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">人気銘柄</label>
                <Select value={ticker} onValueChange={setTicker}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {popularTickers.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">期間</label>
                <Select value={period} onValueChange={setPeriod} defaultValue="10y">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1mo">1ヶ月</SelectItem>
                    <SelectItem value="3mo">3ヶ月</SelectItem>
                    <SelectItem value="6mo">6ヶ月</SelectItem>
                    <SelectItem value="1y">1年</SelectItem>
                    <SelectItem value="2y">2年</SelectItem>
                    <SelectItem value="5y">5年</SelectItem>
                    <SelectItem value="10y">10年</SelectItem>
                    <SelectItem value="max">全期間</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleFetchStockData} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      取得中...
                    </>
                  ) : (
                    <>
                      <Activity className="mr-2 h-4 w-4" />
                      分析開始
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* エラー表示 */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* 統計情報 */}
        {stats && !error && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">現在価格</p>
                    <p className="text-2xl font-bold">
                      {currencySymbol}{stats.currentPrice.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">日次変動</p>
                    <p className={`text-2xl font-bold ${stats.dayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.dayChangePercent >= 0 ? '+' : ''}{stats.dayChangePercent.toFixed(2)}%
                    </p>
                  </div>
                  {stats.dayChangePercent >= 0 ? (
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">52週高値</p>
                    <p className="text-2xl font-bold">{currencySymbol}{stats.high52Week.toFixed(2)}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">52週安値</p>
                    <p className="text-2xl font-bold">{currencySymbol}{stats.low52Week.toFixed(2)}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* メインコンテンツ */}
        <Tabs defaultValue="price" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 relative z-10 mb-20">
            <TabsTrigger value="price">価格推移</TabsTrigger>
            <TabsTrigger value="weekday">曜日効果</TabsTrigger>
            <TabsTrigger value="monthly">月別分析</TabsTrigger>
            <TabsTrigger value="heatmap">ヒートマップ</TabsTrigger>
            <TabsTrigger value="backtest">バックテスト</TabsTrigger>
          </TabsList>

          <TabsContent value="price" className="relative z-0">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>価格推移と移動平均線</CardTitle>
                    <CardDescription>
                      5日移動平均（橙）、20日移動平均（紫）、200日移動平均（緑）
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCandlestick(!showCandlestick)}
                  >
                    <BarChart2 className="h-4 w-4 mr-2" />
                    {showCandlestick ? 'ライン' : 'ローソク足'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showCandlestick && candlestickData.length > 0 ? (
                  <CandlestickChart data={candlestickData} currencySymbol={currencySymbol} />
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="displayDate" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="high" stroke="#e5e7eb" name="高値" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="low" stroke="#e5e7eb" name="安値" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="close" stroke="#3b82f6" name="終値" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ma5" stroke="#f97316" name="MA5" strokeWidth={1} dot={false} />
                      <Line type="monotone" dataKey="ma20" stroke="#8b5cf6" name="MA20" strokeWidth={1} dot={false} />
                      <Line type="monotone" dataKey="ma200" stroke="#10b981" name="MA200" strokeWidth={1} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekday" className="relative z-0">
            <Card>
              <CardHeader>
                <CardTitle>曜日別平均リターン</CardTitle>
                <CardDescription>各曜日の平均リターン率を分析</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={weekdayData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgReturn" name="平均リターン(%)">
                      {weekdayData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.avgReturn >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {weekdayData.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm">
                      <strong>最適な購入曜日:</strong> {weekdayData.reduce((min, curr) => curr.avgReturn < min.avgReturn ? curr : min, weekdayData[0]).day}曜日
                    </p>
                    <p className="text-sm mt-1">
                      <strong>最適な売却曜日:</strong> {weekdayData.reduce((max, curr) => curr.avgReturn > max.avgReturn ? curr : max, weekdayData[0]).day}曜日
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="relative z-0">
            <Card>
              <CardHeader>
                <CardTitle>月別パフォーマンス</CardTitle>
                <CardDescription>各月の平均リターン率を分析</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="avgReturn" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="平均リターン(%)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heatmap" className="relative z-0">
            <Card>
              <CardHeader>
                <CardTitle>月×曜日 ヒートマップ</CardTitle>
                <CardDescription>最適な売買タイミングを視覚化</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-8 gap-1">
                  <div></div>
                  {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
                    <div key={day} className="text-center text-sm font-medium">{day}</div>
                  ))}
                  {["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"].map((month, mIndex) => (
                    <React.Fragment key={month}>
                      <div className="text-sm font-medium">{month}</div>
                      {[0, 1, 2, 3, 4, 5, 6].map((dIndex) => {
                        const data = heatmapData.find(d => d.x === dIndex && d.y === mIndex);
                        const value = data?.value || 0;
                        const intensity = Math.abs(value) / 2;
                        const color = value > 0 
                          ? `rgba(16, 185, 129, ${Math.min(intensity, 1)})`
                          : `rgba(239, 68, 68, ${Math.min(intensity, 1)})`;
                        return (
                          <div
                            key={`${mIndex}-${dIndex}`}
                            className="aspect-square rounded flex items-center justify-center text-sm font-medium"
                            style={{ backgroundColor: color }}
                            title={`${value.toFixed(2)}%`}
                          >
                            {value !== 0 && Math.abs(value) > 0.5 && value.toFixed(1)}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backtest" className="relative z-0">
            <Card>
              <CardHeader>
                <CardTitle>バックテスト結果</CardTitle>
                <CardDescription>複数の売買戦略のシミュレーション結果</CardDescription>
              </CardHeader>
              <CardContent>
                {backtestResults.length > 0 ? (
                  <>
                    {/* ベストパフォーマンス戦略 */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3">🏆 ベストパフォーマンス</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 総リターン最高 */}
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">総リターン最高</p>
                          <Card>
                            <CardContent className="p-3">
                              <p className="font-semibold">{backtestResults.reduce((max, curr) => curr.totalReturn > max.totalReturn ? curr : max).strategy}</p>
                              <p className="text-2xl font-bold text-green-600">
                                +{backtestResults.reduce((max, curr) => curr.totalReturn > max.totalReturn ? curr : max).totalReturn.toFixed(2)}%
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                        {/* 勝率最高 */}
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">勝率最高</p>
                          <Card>
                            <CardContent className="p-3">
                              <p className="font-semibold">{backtestResults.reduce((max, curr) => curr.winRate > max.winRate ? curr : max).strategy}</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {backtestResults.reduce((max, curr) => curr.winRate > max.winRate ? curr : max).winRate.toFixed(1)}%
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                        {/* シャープレシオ最高 */}
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">リスク調整後リターン最高</p>
                          <Card>
                            <CardContent className="p-3">
                              <p className="font-semibold">{backtestResults.reduce((max, curr) => curr.sharpeRatio > max.sharpeRatio ? curr : max).strategy}</p>
                              <p className="text-2xl font-bold text-purple-600">
                                {backtestResults.reduce((max, curr) => curr.sharpeRatio > max.sharpeRatio ? curr : max).sharpeRatio.toFixed(2)}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>

                    {/* 戦略パフォーマンス比較チャート */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold">📊 テクニカル戦略パフォーマンス比較</h3>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium">ソート順:</label>
                          <Select value={chartSortBy} onValueChange={(value: 'totalReturn' | 'winRate') => setChartSortBy(value)}>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="totalReturn">総リターン順</SelectItem>
                              <SelectItem value="winRate">勝率順</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart
                            data={[...backtestResults]
                              .sort((a, b) => chartSortBy === 'totalReturn' 
                                ? b.totalReturn - a.totalReturn 
                                : b.winRate - a.winRate
                              ) // 選択された指標でソート
                              .slice(0, 15)} // 上位15戦略を表示
                            margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="strategy" 
                              angle={-45}
                              textAnchor="end"
                              height={120}
                              fontSize={12}
                            />
                            <YAxis 
                              label={{ value: chartSortBy === 'totalReturn' ? '総リターン (%)' : '勝率 (%)', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip 
                              formatter={(value: number, name: string) => [
                                `${value.toFixed(2)}%`,
                                name === 'totalReturn' ? '総リターン' : '勝率'
                              ]}
                              labelFormatter={(label) => `戦略: ${label}`}
                              content={({ active, payload, label }: any) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  const description = strategyDescriptions[label as string] || '戦略の説明がありません';
                                  return (
                                    <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg max-w-xs">
                                      <p className="font-semibold text-sm mb-1">{label}</p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{description}</p>
                                      <div className="space-y-1">
                                        <p className="text-sm">総リターン: <span className={data.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}>{data.totalReturn >= 0 ? '+' : ''}{data.totalReturn.toFixed(2)}%</span></p>
                                        <p className="text-sm">勝率: {data.winRate.toFixed(1)}%</p>
                                        <p className="text-sm">取引回数: {data.totalTrades}回</p>
                                        <p className="text-sm">シャープ比: {data.sharpeRatio.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend content={() => null} /> {/* デフォルト凡例を非表示 */}
                            <Bar 
                              dataKey={chartSortBy}
                              name={chartSortBy === 'totalReturn' ? '総リターン (%)' : '勝率 (%)'}
                              fill={chartSortBy === 'totalReturn' ? '#10b981' : '#10b981'} // デフォルト色を緑に
                            >
                              {[...backtestResults]
                                .sort((a, b) => chartSortBy === 'totalReturn' 
                                  ? b.totalReturn - a.totalReturn 
                                  : b.winRate - a.winRate
                                )
                                .slice(0, 15)
                                .map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={chartSortBy === 'totalReturn' 
                                    ? (entry.totalReturn >= 0 ? '#10b981' : '#ef4444')
                                    : (entry.winRate >= 50 ? '#10b981' : '#ef4444')
                                  } 
                                />
                              ))}
                            </Bar>
                            {chartSortBy === 'totalReturn' && (
                              <Bar 
                                dataKey="winRate" 
                                name="勝率 (%)"
                                fill="#8b5cf6"
                                fillOpacity={0.7}
                              />
                            )}
                            {chartSortBy === 'winRate' && (
                              <Bar 
                                dataKey="totalReturn" 
                                name="総リターン (%)"
                                fill="#8b5cf6"
                                fillOpacity={0.7}
                              />
                            )}
                          </BarChart>
                        </ResponsiveContainer>
                        
                        {/* カスタム凡例 */}
                        <div className="flex items-center justify-center mt-4 space-x-6 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span>
                              {chartSortBy === 'totalReturn' ? 'プラスリターン' : '50%以上の勝率'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span>
                              {chartSortBy === 'totalReturn' ? 'マイナスリターン' : '50%未満の勝率'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-purple-500 rounded"></div>
                            <span>
                              {chartSortBy === 'totalReturn' ? '勝率 (%)' : '総リターン (%)'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 戦略選択 */}
                    <div className="mb-6">
                      <h4 className="text-md font-semibold mb-2">🔍 戦略詳細と売買履歴を表示</h4>
                      <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                        <SelectTrigger className="w-full md:w-64">
                          <SelectValue placeholder="戦略を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {backtestResults.map((result, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {result.strategy}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 戦略カテゴリー別表示 */}
                    <div className="space-y-6 mb-6">
                      {/* 曜日戦略 */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">曜日戦略</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          {backtestResults.filter(r => r.strategy.includes("曜日")).map((result, index) => (
                            <Card key={result.strategy} 
                                  className={`cursor-pointer transition-all hover:shadow-lg ${selectedStrategy === backtestResults.indexOf(result).toString() ? 'border-2 border-blue-500' : ''} group relative`}
                                  onClick={() => setSelectedStrategy(backtestResults.indexOf(result).toString())}
                                  title={strategyDescriptions[result.strategy] || '戦略の説明がありません'}>
                              <CardContent className="p-4">
                                <h4 className="font-semibold text-sm mb-2">{result.strategy}</h4>
                                {/* ホバー時の説明ポップアップ */}
                                <div className="invisible group-hover:visible absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <div className="text-center">
                                    <p className="font-semibold mb-1">{result.strategy}</p>
                                    <p className="text-gray-300">{strategyDescriptions[result.strategy] || '戦略の説明がありません'}</p>
                                  </div>
                                  {/* 矢印 */}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">総リターン:</span>
                                    <span className={`font-bold ${result.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn.toFixed(2)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">勝率:</span>
                                    <span className={result.winRate >= 50 ? 'text-green-600' : 'text-red-600'}>{result.winRate.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">取引回数:</span>
                                    <span>{result.totalTrades}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">最大DD:</span>
                                    <span className="text-red-600">-{result.maxDrawdown.toFixed(1)}%</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* N日保有戦略 */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">N日保有戦略</h3>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          {backtestResults.filter(r => r.strategy.includes("日保有")).map((result, index) => (
                            <Card key={result.strategy} 
                                  className={`cursor-pointer transition-all hover:shadow-lg ${selectedStrategy === backtestResults.indexOf(result).toString() ? 'border-2 border-blue-500' : ''} group relative`}
                                  onClick={() => setSelectedStrategy(backtestResults.indexOf(result).toString())}
                                  title={strategyDescriptions[result.strategy] || '戦略の説明がありません'}>
                              <CardContent className="p-4">
                                <h4 className="font-semibold text-sm mb-2">{result.strategy}</h4>
                                {/* ホバー時の説明ポップアップ */}
                                <div className="invisible group-hover:visible absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <div className="text-center">
                                    <p className="font-semibold mb-1">{result.strategy}</p>
                                    <p className="text-gray-300">{strategyDescriptions[result.strategy] || '戦略の説明がありません'}</p>
                                  </div>
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">総リターン:</span>
                                    <span className={`font-bold ${result.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn.toFixed(2)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">平均リターン:</span>
                                    <span className={result.avgReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      {result.avgReturn >= 0 ? '+' : ''}{result.avgReturn.toFixed(2)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">シャープ比:</span>
                                    <span>{result.sharpeRatio.toFixed(2)}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* テクニカル戦略（基本） */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">テクニカル戦略（基本）</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          {backtestResults.filter(r =>
                            r.strategy.includes("移動平均クロス") ||
                            r.strategy.includes("RSI戦略") ||
                            r.strategy.includes("ボリンジャーバンド") ||
                            r.strategy.includes("RCI戦略") ||
                            r.strategy.includes("エンベロープ") ||
                            r.strategy.includes("月初買い")
                          ).map((result, index) => (
                            <Card key={result.strategy} 
                                  className={`cursor-pointer transition-all hover:shadow-lg ${selectedStrategy === backtestResults.indexOf(result).toString() ? 'border-2 border-blue-500' : ''} group relative`}
                                  onClick={() => setSelectedStrategy(backtestResults.indexOf(result).toString())}
                                  title={strategyDescriptions[result.strategy] || '戦略の説明がありません'}>
                              <CardContent className="p-4">
                                <h4 className="font-semibold text-sm mb-2">{result.strategy}</h4>
                                {/* ホバー時の説明ポップアップ */}
                                <div className="invisible group-hover:visible absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <div className="text-center">
                                    <p className="font-semibold mb-1">{result.strategy}</p>
                                    <p className="text-gray-300">{strategyDescriptions[result.strategy] || '戦略の説明がありません'}</p>
                                  </div>
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">総リターン:</span>
                                    <span className={`font-bold ${result.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn.toFixed(2)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">勝率:</span>
                                    <span className={result.winRate >= 50 ? 'text-green-600' : 'text-red-600'}>{result.winRate.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">取引回数:</span>
                                    <span>{result.totalTrades}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">シャープ比:</span>
                                    <span>{result.sharpeRatio.toFixed(2)}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* 高度な戦略 */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">高度な戦略</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          {backtestResults.filter(r =>
                            r.strategy.includes("モメンタム") ||
                            r.strategy.includes("MACD") ||
                            r.strategy.includes("ストキャスティクス") ||
                            r.strategy.includes("平均回帰") ||
                            r.strategy.includes("ブレイクアウト") ||
                            r.strategy.includes("ギャップ") ||
                            r.strategy.includes("ボラティリティー") ||
                            r.strategy.includes("ADX戦略") ||
                            r.strategy.includes("ドンチャンチャネル") ||
                            r.strategy.includes("ウィリアムズ%R") ||
                            r.strategy.includes("CCI戦略") ||
                            r.strategy.includes("パラボリックSAR") ||
                            r.strategy.includes("ケルトナーチャネル")
                          ).map((result, index) => (
                            <Card key={result.strategy} 
                                  className={`cursor-pointer transition-all hover:shadow-lg ${selectedStrategy === backtestResults.indexOf(result).toString() ? 'border-2 border-blue-500' : ''} group relative`}
                                  onClick={() => setSelectedStrategy(backtestResults.indexOf(result).toString())}
                                  title={strategyDescriptions[result.strategy] || '戦略の説明がありません'}>
                              <CardContent className="p-4">
                                <h4 className="font-semibold text-sm mb-2">{result.strategy}</h4>
                                {/* ホバー時の説明ポップアップ */}
                                <div className="invisible group-hover:visible absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <div className="text-center">
                                    <p className="font-semibold mb-1">{result.strategy}</p>
                                    <p className="text-gray-300">{strategyDescriptions[result.strategy] || '戦略の説明がありません'}</p>
                                  </div>
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">総リターン:</span>
                                    <span className={`font-bold ${result.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn.toFixed(2)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">勝率:</span>
                                    <span className={result.winRate >= 50 ? 'text-green-600' : 'text-red-600'}>{result.winRate.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">取引回数:</span>
                                    <span>{result.totalTrades}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">シャープ比:</span>
                                    <span>{result.sharpeRatio.toFixed(2)}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* 複合・特殊戦略 */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">複合・特殊戦略</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          {backtestResults.filter(r => 
                            r.strategy.includes("複合") || 
                            r.strategy.includes("季節性") || 
                            r.strategy.includes("一目均衡表") ||
                            r.strategy.includes("OBV") ||
                            r.strategy.includes("VWMA") ||
                            r.strategy.includes("出来高加重")
                          ).map((result, index) => (
                            <Card key={result.strategy} 
                                  className={`cursor-pointer transition-all hover:shadow-lg ${selectedStrategy === backtestResults.indexOf(result).toString() ? 'border-2 border-blue-500' : ''} group relative`}
                                  onClick={() => setSelectedStrategy(backtestResults.indexOf(result).toString())}
                                  title={strategyDescriptions[result.strategy] || '戦略の説明がありません'}>
                              <CardContent className="p-4">
                                <h4 className="font-semibold text-sm mb-2">{result.strategy}</h4>
                                {/* ホバー時の説明ポップアップ */}
                                <div className="invisible group-hover:visible absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <div className="text-center">
                                    <p className="font-semibold mb-1">{result.strategy}</p>
                                    <p className="text-gray-300">{strategyDescriptions[result.strategy] || '戦略の説明がありません'}</p>
                                  </div>
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">総リターン:</span>
                                    <span className={`font-bold ${result.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn.toFixed(2)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">勝率:</span>
                                    <span className={result.winRate >= 50 ? 'text-green-600' : 'text-red-600'}>{result.winRate.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">取引回数:</span>
                                    <span>{result.totalTrades}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">シャープ比:</span>
                                    <span>{result.sharpeRatio.toFixed(2)}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 選択された戦略の詳細情報 */}
                    {selectedStrategy && backtestResults[parseInt(selectedStrategy)] && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-3">戦略詳細: {backtestResults[parseInt(selectedStrategy)].strategy}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400">総リターン</p>
                              <p className={`text-xl font-bold ${backtestResults[parseInt(selectedStrategy)].totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {backtestResults[parseInt(selectedStrategy)].totalReturn >= 0 ? '+' : ''}{backtestResults[parseInt(selectedStrategy)].totalReturn.toFixed(2)}%
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400">勝率</p>
                              <p className="text-xl font-bold">{backtestResults[parseInt(selectedStrategy)].winRate.toFixed(1)}%</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400">取引回数</p>
                              <p className="text-xl font-bold">{backtestResults[parseInt(selectedStrategy)].totalTrades}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400">平均リターン</p>
                              <p className="text-xl font-bold">{backtestResults[parseInt(selectedStrategy)].avgReturn.toFixed(2)}%</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400">最大ドローダウン</p>
                              <p className="text-xl font-bold text-red-600">-{backtestResults[parseInt(selectedStrategy)].maxDrawdown.toFixed(1)}%</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400">シャープレシオ</p>
                              <p className="text-xl font-bold">{backtestResults[parseInt(selectedStrategy)].sharpeRatio.toFixed(2)}</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}

                    {/* 売買履歴テーブル */}
                    {selectedStrategy && backtestResults[parseInt(selectedStrategy)] && backtestResults[parseInt(selectedStrategy)].trades.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-3">📈 売買履歴: {backtestResults[parseInt(selectedStrategy)].strategy}</h3>
                        
                        {/* フィルターオプション */}
                        <div className="mb-4 flex flex-wrap gap-4">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">表示件数:</label>
                            <Select value={displayCount} onValueChange={setDisplayCount}>
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="20">20件</SelectItem>
                                <SelectItem value="50">50件</SelectItem>
                                <SelectItem value="100">100件</SelectItem>
                                <SelectItem value="all">全件</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">フィルター:</label>
                            <Select value={tradeFilter} onValueChange={setTradeFilter}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">全て</SelectItem>
                                <SelectItem value="wins">勝ちのみ</SelectItem>
                                <SelectItem value="losses">負けのみ</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    #
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    エントリー日
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    エグジット日
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    エントリー価格
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    エグジット価格
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    リターン (%)
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    损益 ({currencySymbol})
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    保有日数
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    結果
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {(() => {
                                  // フィルター処理
                                  let filteredTrades = backtestResults[parseInt(selectedStrategy)].trades;
                                  
                                  if (tradeFilter === 'wins') {
                                    filteredTrades = filteredTrades.filter(trade => trade.return > 0);
                                  } else if (tradeFilter === 'losses') {
                                    filteredTrades = filteredTrades.filter(trade => trade.return < 0);
                                  }
                                  
                                  // 表示件数処理
                                  const displayLimit = displayCount === 'all' ? filteredTrades.length : parseInt(displayCount);
                                  const displayedTrades = filteredTrades.slice(0, displayLimit);
                                  
                                  return displayedTrades.map((trade, index) => {
                                    const entryDate = new Date(trade.entryDate);
                                    const exitDate = new Date(trade.exitDate);
                                    const holdingDays = Math.ceil((exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
                                    const isWin = trade.return > 0;
                                    
                                    return (
                                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                          {index + 1}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                          {entryDate.toLocaleDateString('ja-JP')}
                                          <div className="text-xs text-gray-500">
                                            {entryDate.toLocaleDateString('ja-JP', { weekday: 'short' })}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                          {exitDate.toLocaleDateString('ja-JP')}
                                          <div className="text-xs text-gray-500">
                                            {exitDate.toLocaleDateString('ja-JP', { weekday: 'short' })}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                                          {currencySymbol}{trade.entryPrice.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                                          {currencySymbol}{trade.exitPrice.toFixed(2)}
                                        </td>
                                        <td className={`px-4 py-3 text-sm text-right font-medium ${
                                          trade.return >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                          {trade.return >= 0 ? '+' : ''}{trade.return.toFixed(2)}%
                                        </td>
                                        <td className={`px-4 py-3 text-sm text-right font-medium ${
                                          trade.profit >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                          {trade.profit >= 0 ? '+' : ''}{currencySymbol}{trade.profit.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-gray-100">
                                          {holdingDays}日
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            isWin 
                                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                          }`}>
                                            {isWin ? '勝ち' : '負け'}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  });
                                })()}
                              </tbody>
                            </table>
                          </div>
                          {(() => {
                            // フィルター処理
                            let filteredTrades = backtestResults[parseInt(selectedStrategy)].trades;
                            
                            if (tradeFilter === 'wins') {
                              filteredTrades = filteredTrades.filter(trade => trade.return > 0);
                            } else if (tradeFilter === 'losses') {
                              filteredTrades = filteredTrades.filter(trade => trade.return < 0);
                            }
                            
                            const totalTrades = backtestResults[parseInt(selectedStrategy)].trades.length;
                            const filteredCount = filteredTrades.length;
                            const displayLimit = displayCount === 'all' ? filteredCount : parseInt(displayCount);
                            const displayedCount = Math.min(filteredCount, displayLimit);
                            
                            if (filteredCount < totalTrades || displayedCount < filteredCount) {
                              return (
                                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-sm text-gray-500 dark:text-gray-400 text-center">
                                  表示中: {displayedCount}件 / フィルター結果: {filteredCount}件 / 全{totalTrades}件の取引
                                  {tradeFilter !== 'all' && (
                                    <span className="ml-2 text-blue-600 dark:text-blue-400">
                                      (
                                      {tradeFilter === 'wins' ? '勝ちトレードのみ' : '負けトレードのみ'}
                                      )
                                    </span>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        
                        {/* 詳細な取引統計サマリー */}
                        <div className="mt-6">
                          <h4 className="text-md font-semibold mb-3">取引統計詳細
                            {tradeFilter !== 'all' && (
                              <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
                                ({tradeFilter === 'wins' ? '勝ちトレードのみ' : '負けトレードのみ'})
                              </span>
                            )}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            {(() => {
                              // フィルター処理
                              let filteredTrades = backtestResults[parseInt(selectedStrategy)].trades;
                              
                              if (tradeFilter === 'wins') {
                                filteredTrades = filteredTrades.filter(trade => trade.return > 0);
                              } else if (tradeFilter === 'losses') {
                                filteredTrades = filteredTrades.filter(trade => trade.return < 0);
                              }
                              
                              const winTrades = filteredTrades.filter(t => t.return > 0);
                              const lossTrades = filteredTrades.filter(t => t.return < 0);
                              const totalFiltered = filteredTrades.length;
                              
                              const maxWin = filteredTrades.length > 0 ? Math.max(...filteredTrades.map(t => t.return)) : 0;
                              const maxLoss = filteredTrades.length > 0 ? Math.min(...filteredTrades.map(t => t.return)) : 0;
                              
                              const avgWin = winTrades.length > 0 
                                ? winTrades.reduce((sum, t) => sum + t.return, 0) / winTrades.length 
                                : 0;
                              const avgLoss = lossTrades.length > 0 
                                ? lossTrades.reduce((sum, t) => sum + t.return, 0) / lossTrades.length 
                                : 0;
                              
                              return (
                                <>
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="text-center">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">勝ちトレード</p>
                                        <p className="text-2xl font-bold text-green-600">
                                          {winTrades.length}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          ({totalFiltered > 0 ? ((winTrades.length / totalFiltered) * 100).toFixed(1) : 0}%)
                                        </p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="text-center">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">負けトレード</p>
                                        <p className="text-2xl font-bold text-red-600">
                                          {lossTrades.length}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          ({totalFiltered > 0 ? ((lossTrades.length / totalFiltered) * 100).toFixed(1) : 0}%)
                                        </p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="text-center">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">最大勝ち</p>
                                        <p className="text-2xl font-bold text-green-600">
                                          +{maxWin.toFixed(2)}%
                                        </p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="text-center">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">最大負け</p>
                                        <p className="text-2xl font-bold text-red-600">
                                          {maxLoss.toFixed(2)}%
                                        </p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="text-center">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">平均勝ち</p>
                                        <p className="text-2xl font-bold text-green-600">
                                          +{avgWin.toFixed(2)}%
                                        </p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="text-center">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">平均負け</p>
                                        <p className="text-2xl font-bold text-red-600">
                                          {avgLoss.toFixed(2)}%
                                        </p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* 月別パフォーマンス */}
                        <div className="mt-6">
                          <h4 className="text-md font-semibold mb-3">月別パフォーマンス分析</h4>
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart
                                data={(() => {
                                  const monthlyStats: { [key: string]: { wins: number, losses: number, totalReturn: number } } = {};
                                  backtestResults[parseInt(selectedStrategy)].trades.forEach(trade => {
                                    const month = new Date(trade.entryDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' });
                                    if (!monthlyStats[month]) {
                                      monthlyStats[month] = { wins: 0, losses: 0, totalReturn: 0 };
                                    }
                                    if (trade.return > 0) {
                                      monthlyStats[month].wins++;
                                    } else {
                                      monthlyStats[month].losses++;
                                    }
                                    monthlyStats[month].totalReturn += trade.return;
                                  });
                                  return Object.entries(monthlyStats)
                                    .map(([month, stats]) => ({
                                      month,
                                      wins: stats.wins,
                                      losses: stats.losses,
                                      totalReturn: stats.totalReturn,
                                      winRate: (stats.wins / (stats.wins + stats.losses)) * 100
                                    }))
                                    .slice(-12); // 直近12ヶ月
                                })()}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="wins" stackId="a" fill="#10b981" name="勝ち" />
                                <Bar dataKey="losses" stackId="a" fill="#ef4444" name="負け" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    データを取得してバックテストを実行してください
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

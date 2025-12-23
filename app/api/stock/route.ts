import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const originalTicker = searchParams.get('ticker') || 'AAPL';
  const period = searchParams.get('period') || '1y';
  const interval = searchParams.get('interval') || '1d';

  // 日本企業の証券コード（4桁の数字のみ）の場合、.T を自動追加
  let ticker = originalTicker;
  if (/^\d{4}$/.test(ticker)) {
    ticker = `${ticker}.T`;
    console.log(`日本企業の証券コード検出: ${originalTicker} → ${ticker}`);
  }

  try {
    // Yahoo Finance APIのプロキシエンドポイントを使用
    const baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/';

    // 期間の計算
    const now = Math.floor(Date.now() / 1000);
    let period1;
    
    switch(period) {
      case '1mo': period1 = now - 30 * 24 * 60 * 60; break;
      case '3mo': period1 = now - 90 * 24 * 60 * 60; break;
      case '6mo': period1 = now - 180 * 24 * 60 * 60; break;
      case '1y': period1 = now - 365 * 24 * 60 * 60; break;
      case '2y': period1 = now - 730 * 24 * 60 * 60; break;
      case '5y': period1 = now - 1825 * 24 * 60 * 60; break;
      case '10y': period1 = now - 3650 * 24 * 60 * 60; break;
      case 'max': period1 = 0; break;
      default: period1 = now - 3650 * 24 * 60 * 60; // デフォルト10年
    }

    // ティッカーシンボルのエンコード（特殊文字対応）
    const encodedTicker = encodeURIComponent(ticker);
    const url = `${baseUrl}${encodedTicker}?period1=${period1}&period2=${now}&interval=${interval}&includePrePost=false`;
    
    console.log(`Fetching data for ${ticker} from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      console.error(`Yahoo Finance API error: ${response.status} ${response.statusText}`);
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      console.error('No data found in Yahoo Finance response');
      throw new Error('No data found');
    }

    const result = data.chart.result[0];
    
    // データの存在確認
    if (!result.indicators || !result.indicators.quote || !result.indicators.quote[0] || !result.timestamp) {
      console.error('Invalid data structure from Yahoo Finance');
      throw new Error('Invalid data structure');
    }
    
    const quotes = result.indicators.quote[0];
    const timestamps = result.timestamp;

    // データを整形（null値をフィルタリング）
    const formattedData = timestamps.map((timestamp: number, i: number) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      timestamp: timestamp * 1000,
      open: quotes.open[i] || quotes.close[i] || 0,
      high: quotes.high[i] || quotes.close[i] || 0,
      low: quotes.low[i] || quotes.close[i] || 0,
      close: quotes.close[i] || 0,
      volume: quotes.volume[i] || 0
    })).filter((d: any) => d.close !== null && d.close > 0);

    if (formattedData.length === 0) {
      throw new Error('No valid data points found');
    }

    // 統計データを計算
    const currentPrice = formattedData[formattedData.length - 1].close;
    const previousClose = formattedData.length > 1 ? formattedData[formattedData.length - 2].close : currentPrice;
    const dayChange = currentPrice - previousClose;
    const dayChangePercent = previousClose > 0 ? (dayChange / previousClose) * 100 : 0;
    
    // 52週高値・安値の計算（最大252営業日）
    const recent252Days = formattedData.slice(-252);
    const high52Week = Math.max(...recent252Days.map((d: any) => d.high));
    const low52Week = Math.min(...recent252Days.map((d: any) => d.low));
    const avgVolume = formattedData.reduce((sum: number, d: any) => sum + d.volume, 0) / formattedData.length;

    const stats = {
      currentPrice,
      previousClose,
      dayChange,
      dayChangePercent,
      high52Week,
      low52Week,
      avgVolume,
    };

    console.log(`Successfully fetched ${formattedData.length} data points for ${ticker}`);
    console.log('Meta data:', JSON.stringify(result.meta, null, 2));

    // 日本企業および主要企業の名称マッピング
    const companyNameMap: { [key: string]: string } = {
      // 日本企業
      '7203': 'トヨタ自動車',
      '7203.T': 'トヨタ自動車',
      '9984': 'ソフトバンクグループ',
      '9984.T': 'ソフトバンクグループ',
      '6758': 'ソニーグループ',
      '6758.T': 'ソニーグループ',
      '9983': 'ファーストリテイリング',
      '9983.T': 'ファーストリテイリング',
      '6861': 'キーエンス',
      '6861.T': 'キーエンス',
      '7974': '任天堂',
      '7974.T': '任天堂',
      '8306': '三菱UFJフィナンシャル・グループ',
      '8306.T': '三菱UFJフィナンシャル・グループ',
      '6098': 'リクルートホールディングス',
      '6098.T': 'リクルートホールディングス',
      '4063': '信越化学工業',
      '4063.T': '信越化学工業',
      '8035': '東京エレクトロン',
      '8035.T': '東京エレクトロン',
      '4568': '第一三共',
      '4568.T': '第一三共',
      '4519': '中外製薬',
      '4519.T': '中外製薬',
      '4502': '武田薬品工業',
      '4502.T': '武田薬品工業',
      '9433': 'KDDI',
      '9433.T': 'KDDI',
      '9432': '日本電信電話',
      '9432.T': '日本電信電話',
      '8058': '三菱商事',
      '8058.T': '三菱商事',
      '8031': '三井物産',
      '8031.T': '三井物産',
      '2914': '日本たばこ産業',
      '2914.T': '日本たばこ産業',
      '4755': '楽天グループ',
      '4755.T': '楽天グループ',
      '7267': '本田技研工業',
      '7267.T': '本田技研工業',
      '7751': 'キヤノン',
      '7751.T': 'キヤノン',
      '6954': 'ファナック',
      '6954.T': 'ファナック',
      '6981': '村田製作所',
      '6981.T': '村田製作所',
      '6752': 'パナソニック ホールディングス',
      '6752.T': 'パナソニック ホールディングス',
      '6503': '三菱電機',
      '6503.T': '三菱電機',
      '8001': '伊藤忠商事',
      '8001.T': '伊藤忠商事',
      '9434': 'ソフトバンク',
      '9434.T': 'ソフトバンク',
      '8151': '東京海上ホールディングス',
      '8151.T': '東京海上ホールディングス',
      '4449': 'ギフティ',
      '4449.T': 'ギフティ',
      '8252': '丸井グループ',
      '8252.T': '丸井グループ',
      '9020': '東日本旅客鉄道',
      '9020.T': '東日本旅客鉄道',
      '9021': '西日本旅客鉄道',
      '9021.T': '西日本旅客鉄道',
      '2802': '味の素',
      '2802.T': '味の素',
      '4503': 'アステラス製薬',
      '4503.T': 'アステラス製薬',
      '4452': '花王',
      '4452.T': '花王',
      '7201': '日産自動車',
      '7201.T': '日産自動車',
      '7269': 'スズキ',
      '7269.T': 'スズキ',
      '7270': 'SUBARU',
      '7270.T': 'SUBARU',
      '^N225': '日経平均株価'
    };

    // 企業名を取得（複数のフィールドを試行）
    let companyName = result.meta?.longName ||
                      result.meta?.shortName ||
                      result.meta?.displayName ||
                      result.meta?.name ||
                      companyNameMap[ticker] ||
                      ticker;

    console.log('Extracted company name:', companyName);

    return NextResponse.json({
      ticker: originalTicker,  // 元のティッカーを返す
      displayTicker: ticker,   // APIリクエストに使用したティッカー
      companyName,
      data: formattedData,
      stats,
      meta: result.meta
    });

  } catch (error) {
    console.error('Error fetching stock data:', error);
    
    // フォールバック: デモデータを返す（特に仮想通貨や指数の場合）
    const demoData = generateDemoData(ticker, period);
    const demoStats = calculateDemoStats(demoData);

    // デモデータ用の企業名マッピング
    const companyNameMap: { [key: string]: string } = {
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'MSFT': 'Microsoft Corporation',
      'TSLA': 'Tesla, Inc.',
      'META': 'Meta Platforms, Inc.',
      'AMZN': 'Amazon.com, Inc.',
      'NVDA': 'NVIDIA Corporation',
      'BTC-USD': 'Bitcoin USD',
      'ETH-USD': 'Ethereum USD',
      'SPY': 'S&P 500 ETF',
      '^N225': '日経平均株価',
      'GC=F': '金先物',
      '^TNX': '米国10年国債利回り',
      'IYR': 'iShares U.S. Real Estate ETF',
      // 日本企業
      '7203': 'トヨタ自動車',
      '7203.T': 'トヨタ自動車',
      '9984': 'ソフトバンクグループ',
      '9984.T': 'ソフトバンクグループ',
      '6758': 'ソニーグループ',
      '6758.T': 'ソニーグループ',
      '9983': 'ファーストリテイリング',
      '9983.T': 'ファーストリテイリング',
      '6861': 'キーエンス',
      '6861.T': 'キーエンス',
      '7974': '任天堂',
      '7974.T': '任天堂',
      '8306': '三菱UFJフィナンシャル・グループ',
      '8306.T': '三菱UFJフィナンシャル・グループ',
      '6098': 'リクルートホールディングス',
      '6098.T': 'リクルートホールディングス',
      '4063': '信越化学工業',
      '4063.T': '信越化学工業',
      '8035': '東京エレクトロン',
      '8035.T': '東京エレクトロン',
      '4568': '第一三共',
      '4568.T': '第一三共',
      '4519': '中外製薬',
      '4519.T': '中外製薬',
      '4502': '武田薬品工業',
      '4502.T': '武田薬品工業',
      '9433': 'KDDI',
      '9433.T': 'KDDI',
      '9432': '日本電信電話',
      '9432.T': '日本電信電話',
      '8058': '三菱商事',
      '8058.T': '三菱商事',
      '8031': '三井物産',
      '8031.T': '三井物産',
      '2914': '日本たばこ産業',
      '2914.T': '日本たばこ産業',
      '4755': '楽天グループ',
      '4755.T': '楽天グループ',
      '7267': '本田技研工業',
      '7267.T': '本田技研工業',
      '7751': 'キヤノン',
      '7751.T': 'キヤノン',
      '6954': 'ファナック',
      '6954.T': 'ファナック',
      '6981': '村田製作所',
      '6981.T': '村田製作所',
      '6752': 'パナソニック ホールディングス',
      '6752.T': 'パナソニック ホールディングス',
      '6503': '三菱電機',
      '6503.T': '三菱電機',
      '8001': '伊藤忠商事',
      '8001.T': '伊藤忠商事',
      '9434': 'ソフトバンク',
      '9434.T': 'ソフトバンク',
      '8151': '東京海上ホールディングス',
      '8151.T': '東京海上ホールディングス',
      '4449': 'ギフティ',
      '4449.T': 'ギフティ',
      '8252': '丸井グループ',
      '8252.T': '丸井グループ',
      '9020': '東日本旅客鉄道',
      '9020.T': '東日本旅客鉄道',
      '9021': '西日本旅客鉄道',
      '9021.T': '西日本旅客鉄道',
      '2802': '味の素',
      '2802.T': '味の素',
      '4503': 'アステラス製薬',
      '4503.T': 'アステラス製薬',
      '4452': '花王',
      '4452.T': '花王',
      '7201': '日産自動車',
      '7201.T': '日産自動車',
      '7269': 'スズキ',
      '7269.T': 'スズキ',
      '7270': 'SUBARU',
      '7270.T': 'SUBARU'
    };
    const companyName = companyNameMap[ticker] || ticker;

    console.log(`Using demo data for ${ticker}`);

    return NextResponse.json({
      ticker: originalTicker,  // 元のティッカーを返す
      displayTicker: ticker,   // APIリクエストに使用したティッカー
      companyName,
      data: demoData,
      stats: demoStats,
      demo: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function generateDemoData(ticker: string, period: string) {
  const days = period === '1mo' ? 30 : 
               period === '3mo' ? 90 : 
               period === '6mo' ? 180 : 
               period === '1y' ? 252 : 
               period === '2y' ? 504 : 
               period === '5y' ? 1260 : 
               period === '10y' ? 2520 : 
               period === 'max' ? 5040 : 2520; // デフォルト10年
  
  const data = [];
  
  // ティッカーに応じた初期価格設定
  let price = 100;
  if (ticker.includes('BTC')) price = 45000;
  else if (ticker.includes('ETH')) price = 3000;
  else if (ticker === '^N225') price = 33000;
  else if (ticker === '^TNX') price = 4.5;
  else if (ticker === 'GC=F') price = 1950;
  
  const now = new Date();
  
  for (let i = days; i > 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // リアルな変動をシミュレート
    const dayOfWeek = date.getDay();
    const month = date.getMonth();
    
    // 月別効果（11月、12月は上昇傾向）
    const monthEffect = (month === 10 || month === 11) ? 1.002 : 0.999;
    
    // 曜日効果（月曜日は下落、金曜日は上昇傾向）
    const weekdayEffect = dayOfWeek === 1 ? 0.998 : dayOfWeek === 5 ? 1.002 : 1;
    
    // ボラティリティ設定（仮想通貨は高ボラティリティ）
    const volatility = ticker.includes('BTC') || ticker.includes('ETH') ? 0.08 : 0.02;
    
    const change = (Math.random() - 0.5) * volatility * weekdayEffect * monthEffect;
    price *= (1 + change);
    
    // OHLCデータの生成
    const open = price * (1 + (Math.random() - 0.5) * 0.01);
    const high = Math.max(open, price) * (1 + Math.random() * 0.02);
    const low = Math.min(open, price) * (1 - Math.random() * 0.02);
    const close = price;
    
    // ボリューム設定
    let baseVolume = 1000000;
    if (ticker.includes('BTC')) baseVolume = 20000;
    else if (ticker.includes('ETH')) baseVolume = 300000;
    else if (ticker === '^N225') baseVolume = 500000;
    
    const volume = Math.floor(baseVolume * (0.5 + Math.random()));
    
    data.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
      open,
      high,
      low,
      close,
      volume
    });
  }
  
  return data;
}

function calculateDemoStats(data: any[]) {
  if (data.length === 0) {
    return {
      currentPrice: 0,
      previousClose: 0,
      dayChange: 0,
      dayChangePercent: 0,
      high52Week: 0,
      low52Week: 0,
      avgVolume: 0,
    };
  }
  
  const currentPrice = data[data.length - 1].close;
  const previousClose = data.length > 1 ? data[data.length - 2].close : currentPrice;
  const dayChange = currentPrice - previousClose;
  const dayChangePercent = previousClose > 0 ? (dayChange / previousClose) * 100 : 0;
  
  // 52週高値・安値（最大252日）
  const recent252Days = data.slice(-252);
  const high52Week = Math.max(...recent252Days.map(d => d.high));
  const low52Week = Math.min(...recent252Days.map(d => d.low));
  const avgVolume = data.reduce((sum, d) => sum + d.volume, 0) / data.length;
  
  return {
    currentPrice,
    previousClose,
    dayChange,
    dayChangePercent,
    high52Week,
    low52Week,
    avgVolume,
  };
}

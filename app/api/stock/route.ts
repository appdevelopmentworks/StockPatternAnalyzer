import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker') || 'AAPL';
  const period = searchParams.get('period') || '1y';
  const interval = searchParams.get('interval') || '1d';

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

    return NextResponse.json({
      ticker,
      data: formattedData,
      stats,
      meta: result.meta
    });

  } catch (error) {
    console.error('Error fetching stock data:', error);
    
    // フォールバック: デモデータを返す（特に仮想通貨や指数の場合）
    const demoData = generateDemoData(ticker, period);
    const demoStats = calculateDemoStats(demoData);
    
    console.log(`Using demo data for ${ticker}`);
    
    return NextResponse.json({
      ticker,
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

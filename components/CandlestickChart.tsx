"use client";

import React from 'react';

interface CandlestickData {
  date: string;
  displayDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma5: number | null;
  ma20: number | null;
  ma200: number | null;
}

interface CandlestickChartProps {
  data: CandlestickData[];
  currencySymbol: string;
}

export default function CandlestickChart({ data, currencySymbol }: CandlestickChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-gray-500">
        データがありません
      </div>
    );
  }

  // データの範囲を計算
  const prices = data.flatMap(d => [d.high, d.low, d.open, d.close, d.ma5, d.ma20, d.ma200].filter(p => p !== null && p > 0));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const paddedMin = minPrice - priceRange * 0.05;
  const paddedMax = maxPrice + priceRange * 0.05;
  const adjustedRange = paddedMax - paddedMin;

  // 価格をピクセル座標に変換する関数
  const priceToY = (price: number) => {
    return ((paddedMax - price) / adjustedRange) * 350 + 20; // 350pxの高さ、20pxのマージン
  };

  // チャートの幅とキャンドルの幅を計算
  const chartWidth = 800;
  const candleWidth = Math.max(chartWidth / data.length * 0.6, 2);
  const candleSpacing = chartWidth / data.length;

  return (
    <div className="w-full h-[400px] bg-white dark:bg-gray-800 border rounded-lg p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">ローソク足チャート</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          5日移動平均（橙）、3週間移動平均（紫）、200日移動平均（緑）
        </p>
      </div>
      
      <div className="relative w-full h-[350px] overflow-x-auto">
        <div className="flex justify-end"> {/* チャートを右寄せに */}
          <svg 
            width={Math.max(chartWidth + 100, data.length * 10 + 100)} 
            height="350" 
            className="border rounded"
          >
            {/* 背景グリッド */}
            <defs>
              <pattern id="grid" width="40" height="35" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 35" fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* 移動平均線 */}
            {/* MA5 */}
            <polyline
              fill="none"
              stroke="#f97316"
              strokeWidth="1.5"
              points={data
                .map((item, index) => item.ma5 ? `${50 + index * candleSpacing + candleSpacing / 2},${priceToY(item.ma5)}` : null)
                .filter(point => point !== null)
                .join(' ')}
            />
            
            {/* MA20 */}
            <polyline
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="1.5"
              points={data
                .map((item, index) => item.ma20 ? `${50 + index * candleSpacing + candleSpacing / 2},${priceToY(item.ma20)}` : null)
                .filter(point => point !== null)
                .join(' ')}
            />
            
            {/* MA200 */}
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
              points={data
                .map((item, index) => item.ma200 ? `${50 + index * candleSpacing + candleSpacing / 2},${priceToY(item.ma200)}` : null)
                .filter(point => point !== null)
                .join(' ')}
            />
            
            {/* ローソク足 */}
            {data.map((item, index) => {
              const isUp = item.close >= item.open;
              const color = isUp ? '#10b981' : '#ef4444';
              const fillColor = isUp ? '#ffffff' : '#ef4444';
              
              const x = 50 + index * candleSpacing + candleSpacing / 2; // 50pxのオフセットを追加
              const highY = priceToY(item.high);
              const lowY = priceToY(item.low);
              const openY = priceToY(item.open);
              const closeY = priceToY(item.close);
              
              const bodyTop = Math.min(openY, closeY);
              const bodyBottom = Math.max(openY, closeY);
              const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
              
              return (
                <g key={index}>
                  {/* 上ヒゲ */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={bodyTop}
                    stroke={color}
                    strokeWidth="1"
                  />
                  
                  {/* 下ヒゲ */}
                  <line
                    x1={x}
                    y1={bodyBottom}
                    x2={x}
                    y2={lowY}
                    stroke={color}
                    strokeWidth="1"
                  />
                  
                  {/* 実体 */}
                  <rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={fillColor}
                    stroke={color}
                    strokeWidth="1"
                  >
                    <title>
                      {item.displayDate}
                      {'\n'}始値: {currencySymbol}{item.open?.toFixed(2)}
                      {'\n'}高値: {currencySymbol}{item.high?.toFixed(2)}
                      {'\n'}安値: {currencySymbol}{item.low?.toFixed(2)}
                      {'\n'}終値: {currencySymbol}{item.close?.toFixed(2)}
                      {'\n'}出来高: {(item.volume / 1000000).toFixed(1)}M
                      {item.ma5 && `\nMA5: ${currencySymbol}${item.ma5.toFixed(2)}`}
                      {item.ma20 && `\nMA20: ${currencySymbol}${item.ma20.toFixed(2)}`}
                      {item.ma200 && `\nMA200: ${currencySymbol}${item.ma200.toFixed(2)}`}
                    </title>
                  </rect>
                </g>
              );
            })}
            
            {/* Y軸ラベルをSVG内に移動 */}
            <g className="text-xs fill-gray-600 dark:fill-gray-400">
              <text x="5" y="25" textAnchor="start">{currencySymbol}{paddedMax.toFixed(0)}</text>
              <text x="5" y="180" textAnchor="start">{currencySymbol}{((paddedMax + paddedMin) / 2).toFixed(0)}</text>
              <text x="5" y="340" textAnchor="start">{currencySymbol}{paddedMin.toFixed(0)}</text>
            </g>
          </svg>
        </div>
        
        {/* X軸ラベル */}
        <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400 px-12">
          <span>{data[0]?.displayDate}</span>
          <span>{data[Math.floor(data.length / 2)]?.displayDate}</span>
          <span>{data[data.length - 1]?.displayDate}</span>
        </div>
      </div>
      
      {/* 凡例 */}
      <div className="flex items-center justify-center mt-4 space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-2 bg-white border border-green-500"></div>
          <span>上昇</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-2 bg-red-500"></div>
          <span>下降</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-orange-500"></div>
          <span>MA5</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-purple-500"></div>
          <span>MA20</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-green-500"></div>
          <span>MA200</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from 'react';

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

interface TooltipData {
  date: string;
  displayDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  ma5?: number | null;
  ma20?: number | null;
  ma200?: number | null;
}

export default function CandlestickChart({ data, currencySymbol }: CandlestickChartProps) {
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);

  // ツールチップのイベントハンドラー
  const handleMouseEnter = (event: React.MouseEvent, item: CandlestickData, index: number) => {
    const prevItem = index > 0 ? data[index - 1] : item;
    const change = item.close - prevItem.close;
    const changePercent = ((change / prevItem.close) * 100);
    
    const tooltipInfo: TooltipData = {
      date: item.date,
      displayDate: item.displayDate,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      change: change,
      changePercent: changePercent,
      ma5: item.ma5,
      ma20: item.ma20,
      ma200: item.ma200
    };
    
    setTooltipData(tooltipInfo);
    setShowTooltip(true);
  };
  
  const handleMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
    // SVG要素からの相対位置を正確に取得
    const svg = event.currentTarget.ownerSVGElement;
    if (svg) {
      const svgRect = svg.getBoundingClientRect();
      setTooltipPosition({
        x: event.clientX - svgRect.left,
        y: event.clientY - svgRect.top
      });
    }
  };
  
  const handleMouseLeave = () => {
    setShowTooltip(false);
    setTooltipData(null);
  };
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
    return ((paddedMax - price) / adjustedRange) * 380 + 20; // 380pxの高さに変更、1ラベルマージン
  };

  // チャートの幅とキャンドルの幅を計算
  const chartWidth = 800;
  const candleWidth = Math.max(chartWidth / data.length * 0.6, 2);
  const candleSpacing = chartWidth / data.length;

  return (
    <div className="w-full h-[500px] bg-white dark:bg-gray-800 border rounded-lg p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">ローソク足チャート</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          5日移動平均（橙）、3週間移動平均（紫）、200日移動平均（緑）
        </p>
      </div>
      
      <div className="relative w-full h-[450px] overflow-x-auto">
        <div className="flex justify-end"> {/* チャートを右寄せに */}
          <svg 
            width={Math.max(chartWidth + 100, data.length * 10 + 100)} 
            height="420" 
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
                  />
                  
                  {/* 透明なホバー領域 */}
                  <rect
                    x={x - candleSpacing / 2}
                    y={20}
                    width={candleSpacing}
                    height={380}
                    fill="transparent"
                    style={{ cursor: 'crosshair' }}
                    onMouseEnter={(e) => handleMouseEnter(e, item, index)}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  />
                </g>
              );
            })}
            
            {/* Y軸目盛り線 */}
            <g className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="1" strokeDasharray="2,2">
              {/* 水平グリッドライン */}
              <line x1="50" y1="20" x2={Math.max(chartWidth + 100, data.length * 10 + 100)} y2="20" stroke="currentColor" />
              <line x1="50" y1="210" x2={Math.max(chartWidth + 100, data.length * 10 + 100)} y2="210" stroke="currentColor" />
              <line x1="50" y1="400" x2={Math.max(chartWidth + 100, data.length * 10 + 100)} y2="400" stroke="currentColor" strokeDasharray="none" />
            </g>
            
            {/* Y軸ラベルをSVG内に移動 */}
            <g className="text-xs fill-gray-600 dark:fill-gray-400">
              <text x="5" y="25" textAnchor="start">{currencySymbol}{paddedMax.toFixed(0)}</text>
              <text x="5" y="210" textAnchor="start">{currencySymbol}{((paddedMax + paddedMin) / 2).toFixed(0)}</text>
              <text x="5" y="400" textAnchor="start">{currencySymbol}{paddedMin.toFixed(0)}</text>
            </g>
            
            {/* X軸目盛り線と垂直グリッド */}
            <g className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="1">
              {/* X軸ベースライン */}
              <line x1="50" y1="400" x2={Math.max(chartWidth + 100, data.length * 10 + 100)} y2="400" stroke="currentColor" />
              
              {(() => {
                const tickCount = Math.min(10, Math.floor(data.length / 5));
                const interval = Math.floor(data.length / tickCount);
                const ticks = [];
                
                for (let i = 0; i < tickCount; i++) {
                  const index = i * interval;
                  if (index < data.length) {
                    const x = 50 + index * candleSpacing + candleSpacing / 2;
                    // 目盛り線
                    ticks.push(
                      <line
                        key={`tick-${index}`}
                        x1={x}
                        y1="400"
                        x2={x}
                        y2="410"
                        stroke="currentColor"
                      />
                    );
                    // 垂直グリッドライン
                    ticks.push(
                      <line
                        key={`grid-${index}`}
                        x1={x}
                        y1="20"
                        x2={x}
                        y2="400"
                        stroke="currentColor"
                        strokeDasharray="2,2"
                        opacity="0.3"
                      />
                    );
                  }
                }
                
                // 最後の目盛りを追加
                if (data.length > 0 && tickCount > 0) {
                  const lastIndex = data.length - 1;
                  const lastInterval = (tickCount - 1) * interval;
                  if (lastIndex > lastInterval) {
                    const x = 50 + lastIndex * candleSpacing + candleSpacing / 2;
                    ticks.push(
                      <line
                        key={`tick-${lastIndex}`}
                        x1={x}
                        y1="400"
                        x2={x}
                        y2="410"
                        stroke="currentColor"
                      />
                    );
                    ticks.push(
                      <line
                        key={`grid-${lastIndex}`}
                        x1={x}
                        y1="20"
                        x2={x}
                        y2="400"
                        stroke="currentColor"
                        strokeDasharray="2,2"
                        opacity="0.3"
                      />
                    );
                  }
                }
                
                return ticks;
              })()}
            </g>
          </svg>
        </div>
        
        {/* カスタムツールチップ */}
        {showTooltip && tooltipData && (
          <div
            className="absolute z-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3 text-sm pointer-events-none"
            style={{
              left: `${tooltipPosition.x + (tooltipPosition.x > 250 ? -220 : 10)}px`,
              top: `${tooltipPosition.y + (tooltipPosition.y > 200 ? -120 : 10)}px`,
              maxWidth: '250px',
              minWidth: '200px'
            }}
          >
            <div className="font-semibold text-base mb-2 text-gray-900 dark:text-gray-100">
              {new Date(tooltipData.date).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                weekday: 'short'
              })}
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="text-gray-600 dark:text-gray-400">始値:</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {currencySymbol}{tooltipData.open.toFixed(2)}
              </div>
              
              <div className="text-gray-600 dark:text-gray-400">高値:</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {currencySymbol}{tooltipData.high.toFixed(2)}
              </div>
              
              <div className="text-gray-600 dark:text-gray-400">安値:</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {currencySymbol}{tooltipData.low.toFixed(2)}
              </div>
              
              <div className="text-gray-600 dark:text-gray-400">終値:</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {currencySymbol}{tooltipData.close.toFixed(2)}
              </div>
              
              <div className="text-gray-600 dark:text-gray-400">変動:</div>
              <div className={`font-medium ${
                tooltipData.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {tooltipData.change >= 0 ? '+' : ''}{currencySymbol}{tooltipData.change.toFixed(2)}
                <span className="ml-1">({tooltipData.changePercent >= 0 ? '+' : ''}{tooltipData.changePercent.toFixed(2)}%)</span>
              </div>
              
              <div className="text-gray-600 dark:text-gray-400">出来高:</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {(tooltipData.volume / 1000000).toFixed(1)}M
              </div>
            </div>
            
            {/* 移動平均線 */}
            {(tooltipData.ma5 || tooltipData.ma20 || tooltipData.ma200) && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">移動平均</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {tooltipData.ma5 && (
                      <div>
                        <span className="text-orange-500">MA5:</span>
                        <div className="font-medium">{currencySymbol}{tooltipData.ma5.toFixed(2)}</div>
                      </div>
                    )}
                    {tooltipData.ma20 && (
                      <div>
                        <span className="text-purple-500">MA20:</span>
                        <div className="font-medium">{currencySymbol}{tooltipData.ma20.toFixed(2)}</div>
                      </div>
                    )}
                    {tooltipData.ma200 && (
                      <div>
                        <span className="text-green-500">MA200:</span>
                        <div className="font-medium">{currencySymbol}{tooltipData.ma200.toFixed(2)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* X軸ラベル */}
        <div className="mt-4">
          <div className="relative w-full" style={{ marginLeft: '50px', marginRight: '50px' }}>
            <div className="relative" style={{ width: `${Math.max(chartWidth, data.length * 10)}px` }}>
              {(() => {
                const tickCount = Math.min(10, Math.floor(data.length / 5));
                const interval = Math.floor(data.length / tickCount);
                const labels = [];
                
                for (let i = 0; i < tickCount; i++) {
                  const index = i * interval;
                  if (index < data.length) {
                    const leftPosition = (index * candleSpacing + candleSpacing / 2) / Math.max(chartWidth, data.length * 10) * 100;
                    labels.push(
                      <span 
                        key={index} 
                        className="absolute text-xs text-gray-600 dark:text-gray-400 text-center transform -translate-x-1/2"
                        style={{ 
                          left: `${leftPosition}%`,
                          minWidth: '60px'
                        }}
                      >
                        {data[index]?.displayDate}
                      </span>
                    );
                  }
                }
                
                // 最後のデータポイントを追加
                if (data.length > 0 && tickCount > 0) {
                  const lastIndex = data.length - 1;
                  const lastInterval = (tickCount - 1) * interval;
                  if (lastIndex > lastInterval) {
                    const leftPosition = (lastIndex * candleSpacing + candleSpacing / 2) / Math.max(chartWidth, data.length * 10) * 100;
                    labels.push(
                      <span 
                        key={lastIndex} 
                        className="absolute text-xs text-gray-600 dark:text-gray-400 text-center transform -translate-x-1/2"
                        style={{ 
                          left: `${leftPosition}%`,
                          minWidth: '60px'
                        }}
                      >
                        {data[lastIndex]?.displayDate}
                      </span>
                    );
                  }
                }
                
                return labels;
              })()}
            </div>
          </div>
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

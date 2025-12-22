# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stock Pattern Analyzer (株価パターン分析ツール) is a Next.js 14 application that performs advanced stock market analysis with backtesting capabilities. It fetches real-time stock data from Yahoo Finance API and runs 30+ trading strategies to identify optimal buy/sell patterns.

## Development Commands

### Local Development
```bash
npm run dev          # Start development server at localhost:3000
npm run build        # Build production bundle
npm start            # Start production server
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run type-check   # Run TypeScript type checking (no emit)
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

### Maintenance
```bash
npm run clean        # Clean .next, out, and node_modules/.cache
npm run analyze      # Build with bundle analyzer
npm run audit        # Check for security vulnerabilities
npm run audit:fix    # Fix security vulnerabilities
```

## Architecture Overview

### App Structure (Next.js 14 App Router)

The application uses Next.js 14 with the App Router pattern:

- **`app/page.tsx`**: Main client component containing all UI logic, state management, and data visualization. This is a large monolithic component (~1000+ lines) that handles:
  - Stock data fetching and state
  - Multiple chart types (candlestick, line, bar, heatmap)
  - Backtest execution and results display
  - Theme switching and responsive layout

- **`app/api/stock/route.ts`**: API route that fetches stock data from Yahoo Finance. Includes fallback demo data generation for when API fails or for testing purposes.

- **`app/layout.tsx`**: Root layout with theme provider, metadata, and global styles.

### Component Architecture

**UI Components** (`components/ui/`): shadcn/ui components (Button, Card, Tabs, Select, Input, etc.). These are standard Radix UI-based components.

**Custom Components**:
- **`CandlestickChart.tsx`**: Custom Recharts-based candlestick chart implementation with OHLC data visualization.
- **`theme-provider.tsx`**: next-themes wrapper for dark/light mode.

### Backtest Engine (`lib/backtest/`)

The backtesting system is modular and organized by strategy complexity:

**Core Files**:
- **`types.ts`**: Type definitions for `StockData`, `Trade`, `BacktestResult`, `BacktestParams`
- **`utils.ts`**: Shared calculation functions (stats, indicators, validation)
- **`index.ts`**: Main entry point that runs all 30+ strategies via `runAllBacktests()`

**Strategy Categories**:
1. **`strategies.ts`**: Basic strategies (weekday patterns, N-day hold, monthly patterns)
2. **`technical-strategies.ts`**: Technical indicators (MA cross, RSI, Bollinger Bands, RCI, Envelope)
3. **`advanced-strategies.ts`**: Advanced indicators (Momentum, MACD, Stochastic, ADX, Donchian, Williams %R, CCI, Parabolic SAR, Keltner Channel, SuperTrend, Heiken Ashi, Choppiness)
4. **`composite-strategies.ts`**: Multi-indicator strategies (Composite, Seasonal, Ichimoku, OBV, VWMA)

**Helper**:
- **`backtest-helper.ts`**: Integration helper that connects the backtest engine to the UI components.

### Data Flow

1. User selects ticker & period → `app/page.tsx` state updates
2. `fetchStockData()` calls `/api/stock?ticker=X&period=Y`
3. API route fetches from Yahoo Finance (or returns demo data)
4. Stock data flows to `runAllBacktests(data)` in `lib/backtest/index.ts`
5. Each strategy processes data and returns `BacktestResult`
6. Results are displayed in tabs: Charts, Weekday Analysis, Monthly Analysis, Heatmap, Backtest

### Key Technical Details

**Path Aliases**: Uses `@/*` for root imports (configured in `tsconfig.json`)

**Styling**: TailwindCSS with shadcn/ui design system. Dark mode via `next-themes`.

**Charts**: Recharts library for all visualizations (Line, Bar, Area, Candlestick, Heatmap).

**API Integration**: Direct Yahoo Finance API calls from server-side API route. No external API keys required, but includes fallback demo data generator.

**Type Safety**: Full TypeScript with strict mode enabled.

## Adding New Trading Strategies

To add a new strategy:

1. Determine complexity level and choose the appropriate file:
   - Simple patterns → `lib/backtest/strategies.ts`
   - Technical indicators → `lib/backtest/technical-strategies.ts`
   - Advanced/complex → `lib/backtest/advanced-strategies.ts`
   - Multi-indicator → `lib/backtest/composite-strategies.ts`

2. Create strategy function following this pattern:
```typescript
export const runYourStrategy = (
  data: StockData[],
  strategyName: string
): BacktestResult => {
  // Implementation using utils from lib/backtest/utils.ts
  // Must return BacktestResult with all required fields
}
```

3. Add to `lib/backtest/index.ts`:
   - Import the function
   - Add to `runAllBacktests()` results array
   - Optionally add to `runSingleBacktest()` switch case

4. Add strategy description to `app/page.tsx` in `strategyDescriptions` object (Japanese).

## Important Patterns

**Data Validation**: Always use `validateStockData()` from `utils.ts` before processing to filter out invalid/null values.

**Calculation Utilities**: Technical indicators (SMA, EMA, RSI, MACD, Bollinger, etc.) are implemented in `lib/backtest/utils.ts` - reuse these rather than reimplementing.

**Error Handling**: The API route includes comprehensive error handling with demo data fallback. UI shows loading states and error messages.

**Responsive Design**: All components are mobile-responsive. Test changes on different screen sizes.

**Japanese Language**: UI text and strategy descriptions are in Japanese. Maintain this convention for consistency.

## State Management

The app uses React useState hooks in the main page component. Key state variables:
- `stockData`: Array of OHLC data
- `backtestResults`: Array of strategy results
- `selectedStrategy`: Index for trade details view
- `showCandlestick`: Toggle between candlestick/line chart
- Theme state managed by `next-themes`

## Performance Considerations

- Backtesting 30+ strategies on large datasets can be CPU-intensive
- Results are memoized in state after initial calculation
- Chart rendering uses Recharts ResponsiveContainer for optimization
- Large trade arrays are filtered/paginated in UI

## Testing Approach

No formal test suite currently exists. Manual testing workflow:
1. Test with various tickers (US stocks, Japanese indices, crypto, commodities)
2. Test different time periods (1mo to max)
3. Verify backtest calculations with known patterns
4. Check responsive layout on mobile
5. Test dark/light mode switching

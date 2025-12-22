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

To add a new strategy, follow these steps **in order**:

### Step 1: Add Technical Indicator Calculation (if needed)

If your strategy requires a new technical indicator:
- Add the calculation function to `lib/backtest/utils.ts`
- Follow the pattern: `export const calculateYourIndicator = (data: any[], period: number): (number | null)[] => { ... }`
- Return an array with the same length as input data, using `null` for insufficient data points
- Validate all values with `isFinite()` checks

### Step 2: Implement Strategy Function

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
  const initialCapital = getInitialCapital(data);
  let capital = initialCapital;
  let position = 0;
  const trades: Trade[] = [];
  let entryPrice = 0;
  let entryDate = "";

  const validData = validateStockData(data);

  if (validData.length < MINIMUM_REQUIRED_DATA) {
    return calculateBacktestStats([], capital, initialCapital, strategyName);
  }

  // Your strategy logic here

  return calculateBacktestStats(trades, capital, initialCapital, strategyName);
}
```

### Step 3: Register Strategy in Backtest Engine

Add to `lib/backtest/index.ts`:

1. **Import the function** at the top of the file
2. **Add to `runAllBacktests()`** results array with a meaningful Japanese name
3. (Optional) Add to `runSingleBacktest()` switch case if needed

```typescript
// Example:
results.push(runYourStrategy(validData, "あなたの戦略"));
```

### Step 4: Add UI Description

Add strategy description to `app/page.tsx` in the `strategyDescriptions` object:

```typescript
const strategyDescriptions: { [key: string]: string } = {
  // ... existing strategies
  "あなたの戦略": "戦略の簡潔な説明（日本語）",
};
```

### Step 5: ⚠️ **CRITICAL** - Add to UI Filter

**This step is commonly forgotten but essential!** If you skip this, your strategy will execute but won't display as a card in the UI.

In `app/page.tsx`, find the appropriate strategy category section and add your strategy name to the filter:

```typescript
// For advanced strategies (高度な戦略):
{backtestResults.filter(r =>
  r.strategy.includes("モメンタム") ||
  r.strategy.includes("MACD") ||
  // ... existing strategies
  r.strategy.includes("あなたの戦略") ||  // ← ADD YOUR STRATEGY HERE
  r.strategy.includes("他の戦略")
).map((result, index) => (
```

**Common UI Filter Locations**:
- **曜日戦略** (Weekday strategies): Filter contains `"曜日"`
- **N日保有戦略** (N-day hold): Filter contains `"日保有"`
- **テクニカル戦略（基本）** (Basic technical): Filter contains specific indicator names
- **高度な戦略** (Advanced strategies): Filter contains advanced indicator names (~line 951)
- **複合・特殊戦略** (Composite strategies): Filter contains composite strategy names

### Step 6: Verify Implementation

After adding the strategy:

1. **Run type check**: `npm run type-check` or `npx tsc --noEmit`
2. **Start dev server**: `npm run dev`
3. **Test with real data**: Select a ticker and verify:
   - Strategy appears in dropdown list
   - Strategy card displays in the correct category
   - Clicking the card shows trade details
   - Console shows execution logs (if you added debug logging)
4. **Check for edge cases**:
   - Small datasets (< 20 data points)
   - Volatile stocks
   - Sideways/ranging markets
   - Stocks with zero trades generated

### Common Mistakes to Avoid

❌ **Forgetting to add strategy to UI filter** → Strategy executes but doesn't display
❌ **Inconsistent strategy names** → Filter won't match, card won't show
❌ **Not validating data** → Crashes on invalid/null values
❌ **Not handling zero trades** → Returns undefined instead of valid BacktestResult
❌ **Incorrect Japanese naming** → UI looks inconsistent
❌ **Missing isFinite() checks** → NaN values break calculations and filtering

### Debug Checklist

If a strategy doesn't display:

1. ✅ Check browser console for execution logs
2. ✅ Verify strategy name exactly matches between `index.ts` and UI filter
3. ✅ Confirm strategy returns valid `BacktestResult` with finite values
4. ✅ Check that `totalTrades >= 0` (negative values are filtered out)
5. ✅ Verify the UI filter includes your strategy name (most common issue)
6. ✅ Look for TypeScript errors in terminal/console

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

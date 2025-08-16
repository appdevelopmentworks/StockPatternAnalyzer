# 📈 Stock Pattern Analyzer

> 高度な株価分析ツール - 最適な売買タイミングを科学的に分析

![Stock Pattern Analyzer Logo](./public/logo.png)

## ✨ 特徴

- 📈 **リアルタイム株価データ**: Yahoo Finance APIから最新データを取得
- 📊 **高度なチャート機能**: ローソク足・ライン表示切替、移動平均線表示
- 📅 **曜日効果分析**: 統計的に最適な売買曜日を特定
- 📆 **月別パフォーマンス**: 季節性やアノマリーを視覚化
- 🔥 **ヒートマップ分析**: 月×曜日の最適売買タイミング
- 💰 **バックテスト機能**: 複数の投資戦略をシミュレーション
- 🎨 **美しいUI/UX**: shadcn/ui + TailwindCSSによるモダンデザイン
- 📱 **完全レスポンシブ**: スマートフォン・タブレット完全対応
- 🌙 **ダークモード**: 目に優しいテーマ切替
- 🔍 **SEO最適化**: Open Graph・Twitter Card対応

## 🚀 デモ

[Live Demo](https://your-demo-url.com) で実際に体験してみてください！

## 🛠 技術スタック

### フロントエンド
- **Framework**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: TailwindCSS
- **UIコンポーネント**: shadcn/ui
- **チャート**: Recharts
- **テーマ**: next-themes
- **アイコン**: Lucide React

### バックエンド
- **API**: Next.js API Routes
- **データソース**: Yahoo Finance API

## 📦 インストール

### 前提条件
- Node.js 18.0.0以上
- npm または yarn

### セットアップ手順

1. **リポジトリをクローン**
```bash
git clone https://github.com/your-username/stock-pattern-analyzer.git
cd stock-pattern-analyzer
```

2. **依存関係をインストール**
```bash
npm install
# または
yarn install
```

3. **開発サーバーを起動**
```bash
npm run dev
# または
yarn dev
```

4. **ブラウザでアクセス**
http://localhost:3000 を開いてください

## 🎯 使用方法

### 基本的な使い方

1. **銘柄選択**: ティッカーシンボルを入力または人気銘柄から選択
   - 🇺🇸 米国株: `AAPL`, `GOOGL`, `TSLA`, `NVDA`
   - 🇯🇵 日本株: `^N225`（日経平均）
   - 💰 コモディティ: `GC=F`（金先物）
   - 📊 ETF: `SPY`（S&P 500）

2. **期間設定**: 分析期間を選択（1ヶ月〜全期間）

3. **分析実行**: 「分析開始」ボタンをクリック

### 高度な機能

#### 📊 チャート分析
- **ローソク足表示**: OHLC（始値・高値・安値・終値）の詳細分析
- **移動平均線**: 5日・20日・200日の短期・長期トレンド
- **インタラクティブ**: ズーム・パン機能

#### 📈 パターン分析
- **曜日効果**: 各曜日の平均リターン率を統計分析
- **季節性**: 月別パフォーマンスの傾向を把握
- **ヒートマップ**: 最適な売買タイミングを色で視覚化

#### 💼 バックテスト
- **複数戦略**: 様々な投資手法をシミュレーション
- **リスク指標**: 最大ドローダウン・シャープレシオ
- **統計情報**: 勝率・平均リターン・取引回数

## 🌐 API エンドポイント

### GET /api/stock

株価データを取得します。

**パラメータ:**
- `ticker` (required): ティッカーシンボル
- `period` (optional): 期間 (`1mo`, `3mo`, `6mo`, `1y`, `2y`, `5y`, `10y`, `max`)
- `interval` (optional): インターバル (`1d`, `1wk`, `1mo`)

**レスポンス例:**
```json
{
  "data": [
    {
      "date": "2024-01-01",
      "open": 150.00,
      "high": 155.00,
      "low": 148.00,
      "close": 152.00,
      "volume": 1000000
    }
  ],
  "stats": {
    "currentPrice": 152.00,
    "dayChange": 2.00,
    "dayChangePercent": 1.33,
    "high52Week": 200.00,
    "low52Week": 120.00
  }
}
```

## 🚀 デプロイ

### Vercel (推奨)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/stock-pattern-analyzer)

1. Vercelアカウントでログイン
2. このリポジトリをインポート
3. 自動デプロイ完了！

### Netlify

1. Netlifyにプロジェクトをインポート
2. ビルド設定:
   - **ビルドコマンド**: `npm run build`
   - **公開ディレクトリ**: `.next`
   - **Node.js バージョン**: 18以上

## 📁 プロジェクト構造

```
stock-pattern-analyzer/
├── 📁 app/                  # Next.js App Router
│   ├── 📁 api/             # API routes
│   ├── 📄 globals.css      # グローバルスタイル
│   ├── 📄 layout.tsx       # ルートレイアウト
│   └── 📄 page.tsx         # メインページ
├── 📁 components/          # UIコンポーネント
│   ├── 📁 ui/             # shadcn/ui コンポーネント
│   └── 📄 CandlestickChart.tsx # カスタムチャート
├── 📁 lib/                # ユーティリティ
├── 📁 public/             # 静的ファイル
│   └── 📄 logo.png        # ロゴ
├── 📄 .env.example        # 環境変数テンプレート
├── 📄 .gitignore          # Git除外設定
├── 📄 README.md           # このファイル
├── 📄 package.json        # 依存関係
└── 📄 tailwind.config.ts  # Tailwind設定
```

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成: `git checkout -b feature/amazing-feature`
3. 変更をコミット: `git commit -m 'Add amazing feature'`
4. ブランチにプッシュ: `git push origin feature/amazing-feature`
5. Pull Requestを作成

詳細は [CONTRIBUTING.md](./CONTRIBUTING.md) をご確認ください。

## 📝 ライセンス

このプロジェクトは [MIT License](./LICENSE) の下で公開されています。

## 🛡 セキュリティ

セキュリティの問題を発見した場合は、[SECURITY.md](./SECURITY.md) の手順に従って報告してください。

## 📧 サポート

- 🐛 **バグ報告**: [Issues](https://github.com/your-username/stock-pattern-analyzer/issues)
- 💡 **機能要望**: [Feature Requests](https://github.com/your-username/stock-pattern-analyzer/issues)
- 📧 **その他**: your-email@example.com

## 🏆 アクノレッジメント

- [Yahoo Finance API](https://finance.yahoo.com) - 株価データ提供
- [shadcn/ui](https://ui.shadcn.com) - UIコンポーネント
- [Recharts](https://recharts.org) - チャートライブラリ
- [Next.js](https://nextjs.org) - React フレームワーク

---

⭐ このプロジェクトが役に立ったら、GitHubスターをお願いします！

![GitHub stars](https://img.shields.io/github/stars/your-username/stock-pattern-analyzer?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-username/stock-pattern-analyzer?style=social)
![GitHub issues](https://img.shields.io/github/issues/your-username/stock-pattern-analyzer)
![GitHub license](https://img.shields.io/github/license/your-username/stock-pattern-analyzer)

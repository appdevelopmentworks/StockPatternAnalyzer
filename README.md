# 📈 Stock Pattern Analyzer

> 高度な株価分析ツール - 最適な売買タイミングを科学的に分析

![Stock Pattern Analyzer Logo](./public/logo.png)

## ✨ 特徴

- 📈 **リアルタイム株価データ**: Yahoo Finance APIから最新データを取得
- 📊 **高度なチャート機能**: ローソク足・ライン表示切替、移動平均線表示
- 📅 **曜日効果分析**: 統計的に最適な売買曜日を特定
- 📆 **月別パフォーマンス**: 季節性やアノマリーを視覚化
- 🔥 **ヒートマップ分析**: 月×曜日の最適売買タイミング
- 💰 **バックテスト機能**: **42種類**の投資戦略をシミュレーション
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

**42種類の投資戦略**を実装し、過去データで検証可能：

**基本戦略**
- 曜日戦略（4種）: 月曜買い・金曜売り、など
- N日保有戦略（5種）: 1日、3日、5日、10日、20日保有
- 月次戦略: 月初買い・月末売り

**テクニカル戦略（基本）**
- 移動平均クロス（3種）: 5/20日、10/50日、20/200日
- RSI戦略: 30/70の過買い・過売り判定
- ボリンジャーバンド: バンドタッチで逆張り
- RCI戦略: 順位相関指数による売買
- エンベロープ戦略: 移動平均からの乖離率

**高度な戦略（25種）**
- モメンタム系: モメンタム、MACD、ストキャスティクス、ROC
- トレンド系: ADX、スーパートレンド、平均足、ドンチャンチャネル、パラボリックSAR
- ボラティリティ系: ボリンジャースクイーズ、ATRトレーリングストップ、ケルトナーチャネル
- オシレーター系: RSI、ウィリアムズ%R、CCI、MFI（マネーフローインデックス）
- 出来高系: エルダーのフォースインデックス
- その他: 平均回帰、ブレイクアウト、ギャップ、チョピネス指数、アルーン指標、EMAリボン、ピボットポイント、フィボナッチリトレースメント

**複合・特殊戦略（5種）**
- 複合戦略: 複数指標の組み合わせ
- 季節性戦略: 月別パターン活用
- 一目均衡表: 三役好転/三役逆転
- OBV: オン・バランス・ボリューム
- VWMA: 出来高加重移動平均

**分析指標**
- **パフォーマンス**: 総リターン、勝率、平均リターン、取引回数
- **リスク指標**: 最大ドローダウン、シャープレシオ
- **取引詳細**: エントリー/エグジット価格、日付、損益

## 📝 更新履歴

### 最新アップデート（2024-12）

#### 🎉 新戦略追加（3種）
- **MFI（マネーフローインデックス）**: RSIに出来高を加味した指標で、20以下で買い80以上で売る逆張り戦略
- **ATRトレーリングストップ**: ATR（平均真の範囲）を使った動的トレーリングストップでトレンドフォローする戦略
- **ボリンジャースクイーズ**: ボラティリティ収縮後のブレイクアウトを狙う戦略、バンド幅最小時に待機しブレイクで仕掛ける

#### 🐛 バグ修正
- 戦略カードが表示されない問題を修正
  - UIフィルター漏れにより一部戦略（スーパートレンド、平均足、アルーン指標など9戦略）が表示されていなかった問題を解決
  - すべての戦略が正常に表示されるように修正

#### 📚 ドキュメント改善
- **CLAUDE.md**: 開発者向けガイドを追加
  - 戦略追加の詳細手順（6ステップ）
  - よくある間違いとデバッグチェックリスト
  - UIフィルター追加の重要性を強調
- **README.md**: 全42戦略の詳細リストを追加

#### 🔧 技術的改善
- 戦略実装の標準化: すべての戦略が一貫したパターンに従うよう整理
- デバッグログの追加: 戦略実行状況を追跡可能に
- TypeScript型安全性の向上

### 以前のアップデート

#### 2024-11
- スーパートレンド、平均足（Heiken Ashi）、フィッシャー変換戦略を追加
- 移動平均の異なる組合せ、CCI戦略、エンベロープ戦略、パラボリックSAR戦略、ケルトナーチャネル戦略を実装
- ADX戦略、ドンチャンチャネル、ウィリアムズ%R 戦略を実装
- スマホ対応を改善
- バックテストにRCIを追加

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
├── 📁 app/                       # Next.js App Router
│   ├── 📁 api/                  # API routes
│   │   └── 📁 stock/           # 株価データAPI
│   ├── 📄 globals.css           # グローバルスタイル
│   ├── 📄 layout.tsx            # ルートレイアウト
│   └── 📄 page.tsx              # メインページ（1000+行）
├── 📁 components/               # UIコンポーネント
│   ├── 📁 ui/                  # shadcn/ui コンポーネント
│   ├── 📄 CandlestickChart.tsx # カスタムローソク足チャート
│   └── 📄 theme-provider.tsx   # テーマプロバイダー
├── 📁 lib/                      # ユーティリティとバックテストエンジン
│   ├── 📁 backtest/            # バックテストシステム
│   │   ├── 📄 index.ts         # メインエントリーポイント
│   │   ├── 📄 types.ts         # 型定義
│   │   ├── 📄 utils.ts         # 計算関数とユーティリティ
│   │   ├── 📄 strategies.ts    # 基本戦略
│   │   ├── 📄 technical-strategies.ts    # テクニカル指標戦略
│   │   ├── 📄 advanced-strategies.ts     # 高度な戦略（25種）
│   │   └── 📄 composite-strategies.ts    # 複合戦略
│   ├── 📄 backtest-helper.ts   # バックテスト統合ヘルパー
│   └── 📄 utils.ts             # 共通ユーティリティ
├── 📁 public/                   # 静的ファイル
│   └── 📄 logo.png             # ロゴ
├── 📄 CLAUDE.md                # 開発者向けガイド（AI支援）
├── 📄 README.md                # このファイル
├── 📄 package.json             # 依存関係
├── 📄 tailwind.config.ts       # Tailwind設定
├── 📄 tsconfig.json            # TypeScript設定
└── 📄 next.config.js           # Next.js設定
```

### 重要ファイルの説明

- **app/page.tsx**: メインUIコンポーネント。すべてのチャート、分析、バックテスト結果の表示を担当
- **lib/backtest/**: バックテストエンジン全体。42種類の戦略を実装
- **CLAUDE.md**: 新しい戦略追加の詳細ガイド。開発者とAI支援ツール向け

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！

### 一般的な貢献

1. このリポジトリをフォーク
2. フィーチャーブランチを作成: `git checkout -b feature/amazing-feature`
3. 変更をコミット: `git commit -m 'Add amazing feature'`
4. ブランチにプッシュ: `git push origin feature/amazing-feature`
5. Pull Requestを作成

### 新しいバックテスト戦略の追加

バックテスト戦略を追加する場合は、**必ず [CLAUDE.md](./CLAUDE.md) をお読みください**。

CLAUDE.mdには以下が含まれています：
- ✅ 戦略追加の6ステップガイド
- ✅ よくある間違いとその回避方法
- ✅ デバッグチェックリスト
- ✅ UIフィルター追加の重要性（**最も見落とされやすい！**）

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

# Contributing to Stock Pattern Analyzer

🎉 貢献いただき、ありがとうございます！

このガイドでは、Stock Pattern Analyzerプロジェクトに貢献する方法について説明します。

## 📋 目次

- [行動規範](#行動規範)
- [始める前に](#始める前に)
- [開発環境のセットアップ](#開発環境のセットアップ)
- [貢献の種類](#貢献の種類)
- [プルリクエストの手順](#プルリクエストの手順)
- [コーディング規約](#コーディング規約)
- [コミットメッセージ](#コミットメッセージ)
- [レビュープロセス](#レビュープロセス)

## 🤝 行動規範

私たちは包括的で歓迎的なコミュニティを維持することをお約束します。すべての参加者は以下を遵守してください：

- 他者を尊重し、建設的なフィードバックを提供する
- 多様な視点や経験を歓迎する
- 迷惑行為、差別的言動、嫌がらせは禁止
- プロフェッショナルで友好的な態度を保つ

## 🚀 始める前に

### Issues の確認

新しい機能やバグ修正を始める前に：

1. 既存の [Issues](https://github.com/your-username/stock-pattern-analyzer/issues) を確認
2. 同様の問題や提案がないかチェック
3. 新しいIssueを作成する場合は、詳細な説明を記載

### Discussion

- 大きな変更の場合は、まず [Discussions](https://github.com/your-username/stock-pattern-analyzer/discussions) で相談
- 新しい機能のアイデアや設計について議論

## 🛠 開発環境のセットアップ

### 前提条件

- Node.js 18.0.0以上
- npm または yarn
- Git

### セットアップ手順

1. **リポジトリをフォーク**
```bash
# GitHubでフォークボタンをクリック
```

2. **ローカルにクローン**
```bash
git clone https://github.com/YOUR_USERNAME/stock-pattern-analyzer.git
cd stock-pattern-analyzer
```

3. **上流リポジトリを追加**
```bash
git remote add upstream https://github.com/original-username/stock-pattern-analyzer.git
```

4. **依存関係をインストール**
```bash
npm install
```

5. **開発サーバーを起動**
```bash
npm run dev
```

## 🎯 貢献の種類

### 🐛 バグ報告

バグを発見した場合：

1. [Issues](https://github.com/your-username/stock-pattern-analyzer/issues/new) で新しいバグレポートを作成
2. 以下の情報を含める：
   - **環境**: OS、ブラウザ、Node.jsバージョン
   - **再現手順**: 詳細なステップ
   - **期待される動作**: 何が起こるべきか
   - **実際の動作**: 何が起こったか
   - **スクリーンショット**: 可能であれば添付

### 💡 機能要望

新しい機能の提案：

1. [Feature Request](https://github.com/your-username/stock-pattern-analyzer/issues/new) を作成
2. 以下を記載：
   - **問題**: 解決したい問題
   - **解決策**: 提案する機能
   - **代替案**: 他の可能な解決方法
   - **追加情報**: 関連するコンテキスト

### 📚 ドキュメント改善

- README.mdの更新
- コメントの追加・修正
- 新しいガイドの作成

### 🔧 コード貢献

- バグ修正
- 新機能の実装
- パフォーマンス改善
- リファクタリング

## 🔄 プルリクエストの手順

### 1. ブランチ作成

```bash
git checkout -b feature/your-feature-name
# または
git checkout -b fix/bug-description
```

### 2. 変更を実装

- 小さく、焦点を絞った変更を心がける
- テストを追加（該当する場合）
- ドキュメントを更新

### 3. コミット

```bash
git add .
git commit -m "feat: add new stock analysis feature"
```

### 4. 上流の変更を取得

```bash
git fetch upstream
git rebase upstream/main
```

### 5. プッシュ

```bash
git push origin feature/your-feature-name
```

### 6. プルリクエスト作成

1. GitHubでプルリクエストを作成
2. 詳細な説明を記載
3. 関連するIssueをリンク

## 📝 コーディング規約

### TypeScript

- 型安全性を重視
- `any` の使用は避ける
- インターフェースを適切に定義

```typescript
// ✅ Good
interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ❌ Avoid
const data: any = { ... };
```

### React/Next.js

- 関数コンポーネントを使用
- カスタムフックを活用
- Server Componentsの適切な使用

```tsx
// ✅ Good
export default function StockChart({ data }: { data: StockData[] }) {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

### CSS/Styling

- TailwindCSSクラスを使用
- カスタムCSSは最小限に
- レスポンシブデザインを考慮

```tsx
// ✅ Good
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Content */}
</div>
```

### ファイル構成

```
components/
├── ui/           # shadcn/ui components
├── charts/       # Chart components
└── analysis/     # Analysis components
```

## 💬 コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/) 形式を使用：

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント更新
- `style`: コードスタイル（機能に影響しない）
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: その他のタスク

### Examples

```bash
feat(charts): add candlestick chart component
fix(api): handle API rate limiting
docs(readme): update installation instructions
style: format code with prettier
refactor(utils): extract common data processing logic
```

## 👀 レビュープロセス

### レビュー基準

- **機能性**: 期待通りに動作するか
- **コード品質**: 読みやすく、保守しやすいか
- **パフォーマンス**: 最適化されているか
- **セキュリティ**: セキュリティ上の問題はないか
- **テスト**: 適切なテストが含まれているか

### レビューの心得

**レビュアー**:
- 建設的で親切なフィードバック
- 具体的な改善提案
- 良い点も積極的に評価

**貢献者**:
- フィードバックを受け入れる姿勢
- 質問や懸念は遠慮なく相談
- 迅速な対応

## 🚀 リリースプロセス

1. **セマンティックバージョニング**: `MAJOR.MINOR.PATCH`
2. **変更ログ**: すべての変更を記録
3. **テスト**: 本番環境での動作確認

## 🆘 ヘルプが必要な場合

- 💬 [Discussions](https://github.com/your-username/stock-pattern-analyzer/discussions) で質問
- 📧 メール: your-email@example.com
- 📝 [Issues](https://github.com/your-username/stock-pattern-analyzer/issues) でサポート要請

## 🎉 認識

貢献いただいたすべての方を [Contributors](https://github.com/your-username/stock-pattern-analyzer/graphs/contributors) ページで紹介しています。

---

**再度、ご貢献いただきありがとうございます！🙏**

あなたの貢献が Stock Pattern Analyzer をより良いツールにします。

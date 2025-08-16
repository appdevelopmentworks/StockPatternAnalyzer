# ファビコン設定手順

添付画像をファビコンとして設定するには、以下の手順を行ってください：

## 1. 画像ファイルの配置

添付画像を以下の場所に配置してください：

### Next.js App Router用（推奨）
- `app/icon.png` - 自動的にファビコンとして認識されます
- `app/apple-icon.png` - Apple用アイコン（オプション）

### または public フォルダー
- `public/favicon.ico` - 従来のファビコン形式
- `public/favicon.png` - PNG形式

## 2. 画像のサイズ調整

理想的なサイズ：
- icon.png: 32x32 または 16x16
- apple-icon.png: 180x180
- favicon.ico: 16x16, 32x32, 48x48 のマルチサイズ

## 3. 画像変換ツール

オンラインツールを使用して画像を適切な形式に変換：
- https://favicon.io/favicon-converter/
- https://realfavicongenerator.net/

## 4. 配置後の確認

1. 画像ファイルを `app/icon.png` として保存
2. 開発サーバーを再起動: `npm run dev`
3. ブラウザでファビコンが表示されることを確認

## 注意事項

- Next.js 13以降のApp Routerでは、app/ディレクトリ直下のicon.pngが自動的に認識されます
- ブラウザのキャッシュをクリアする必要がある場合があります
- 開発環境と本番環境で表示が異なる場合があります

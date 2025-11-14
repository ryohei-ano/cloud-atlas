# Google Analytics 4 セットアップガイド

Cloud AtlasにGoogle Analytics 4（GA4）を設定する手順を説明します。

## 📋 前提条件

- Googleアカウント
- 本番環境のURL（https://cloud-atlas-space.vercel.app）

## 🚀 セットアップ手順

### 1. GA4プロパティの作成

1. [Google Analytics](https://analytics.google.com/)にアクセス
2. 「管理」→「プロパティを作成」をクリック
3. プロパティ名を入力（例: Cloud Atlas）
4. タイムゾーン: 「日本」を選択
5. 通貨: 「日本円 (¥)」を選択
6. 「次へ」をクリック

### 2. ビジネス情報の入力

1. 業種: 適切なカテゴリを選択
2. ビジネスの規模: 該当するものを選択
3. 利用目的: 「ウェブサイトまたはアプリのユーザー行動を調べる」など
4. 「作成」をクリック

### 3. データストリームの設定

1. プラットフォーム: 「ウェブ」を選択
2. ウェブサイトのURL: `https://cloud-atlas-space.vercel.app`
3. ストリーム名: `Cloud Atlas Production`
4. 「ストリームを作成」をクリック

### 4. 測定IDの取得

作成されたストリームの詳細ページで、**測定ID**（`G-XXXXXXXXXX`形式）をコピーします。

### 5. 環境変数の設定

#### ローカル開発環境

`.env.local`ファイルを作成（存在しない場合）:

```bash
# .env.local
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX  # ← ここに測定IDを貼り付け
```

#### Vercel本番環境

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. プロジェクト「cloud-atlas」を選択
3. 「Settings」→「Environment Variables」
4. 新しい変数を追加:
   - **Name**: `NEXT_PUBLIC_GA_ID`
   - **Value**: `G-XXXXXXXXXX`（測定ID）
   - **Environment**: `Production`のみ
5. 「Save」をクリック
6. 再デプロイが必要な場合は「Redeploy」

### 6. 動作確認

#### 本番環境で確認

1. https://cloud-atlas-space.vercel.app にアクセス
2. ブラウザの開発者ツールを開く（F12）
3. 「Console」タブで以下のメッセージを確認:
   ```
   Google tag (gtag.js) - UA-XXXXXXXXXX loaded
   ```

#### GA4リアルタイムレポートで確認

1. [Google Analytics](https://analytics.google.com/)にアクセス
2. 「レポート」→「リアルタイム」
3. 自分のアクセスが表示されることを確認

## 📊 計測されるデータ

### 自動計測

- ✅ **ページビュー**: ユーザーがページを閲覧した回数
- ✅ **セッション**: ユーザーの訪問回数
- ✅ **ユニークユーザー数**: 訪問した個別ユーザー数
- ✅ **離脱率**: ページを見てすぐに離脱したユーザーの割合
- ✅ **セッション時間**: 平均滞在時間

### カスタムイベント

以下のイベントが自動的に送信されます:

| イベント名 | 説明 | パラメータ |
|-----------|------|-----------|
| `memory_posted` | メモリーが投稿された | `value`: 文字数 |
| `memories_fetched` | メモリーを取得 | `value`: 取得数 |
| `rate_limit_hit` | Rate limitに到達 | `endpoint`, `value`: retryAfter |
| `error_occurred` | エラー発生 | `error_message`, `event_label` |
| `spam_detected` | スパム検出 | `spam_reason` |
| `terminal_action` | ターミナル操作 | `event_label`: open/close/submit |

## 📈 レポートの見方

### 主要なレポート

#### 1. リアルタイムレポート
- **場所**: レポート → リアルタイム
- **用途**: 現在のアクセス状況をリアルタイムで確認

#### 2. エンゲージメント概要
- **場所**: レポート → エンゲージメント → 概要
- **用途**: ページビュー、イベント数、セッション時間を確認

#### 3. イベント
- **場所**: レポート → エンゲージメント → イベント
- **用途**: カスタムイベントの発生回数を確認
- **見るべき指標**:
  - `memory_posted`: メモリー投稿数
  - `rate_limit_hit`: Rate limit到達回数（多い場合は緩和検討）
  - `error_occurred`: エラー発生数（多い場合は要調査）

#### 4. ユーザー属性
- **場所**: レポート → ユーザー → ユーザー属性
- **用途**: 訪問者の地域、デバイス、ブラウザを確認

### カスタムレポートの作成

#### Rate Limit監視レポート

1. 「探索」→「空白」を選択
2. 「ディメンション」に以下を追加:
   - イベント名
   - ページタイトル
3. 「指標」に以下を追加:
   - イベント数
   - ユーザー数
4. フィルタ: イベント名 = `rate_limit_hit`
5. 保存

#### 投稿パフォーマンスレポート

1. 「探索」→「空白」を選択
2. 「ディメンション」に以下を追加:
   - 日付
   - 時刻
3. 「指標」に以下を追加:
   - イベント数
4. フィルタ: イベント名 = `memory_posted`
5. 保存

## 🔧 トラブルシューティング

### データが表示されない

**原因1**: 環境変数が設定されていない
```bash
# .env.localを確認
cat .env.local | grep NEXT_PUBLIC_GA_ID
```

**原因2**: 本番環境でのみ有効
- 開発環境（localhost）ではGA4は無効
- Vercelの本番環境でのみ動作

**原因3**: 測定IDが間違っている
- `G-XXXXXXXXXX`形式になっているか確認
- ダッシュボードから再度コピー

### イベントが記録されない

1. ブラウザのコンソールでエラーを確認
2. 広告ブロッカーを無効化
3. プライベートブラウジングモードを解除

### リアルタイムレポートに表示されない

- データ反映には**最大60秒**かかります
- ページをリロードしてみてください

## 📱 プライバシーとGDPR対応

### 現在の実装

- ✅ Cookieバナーなし（GA4はCookieレスで動作可能）
- ✅ IPアドレス匿名化（自動）
- ✅ 本番環境のみ有効

### 将来的な対応（必要に応じて）

- Cookie同意バナーの追加
- プライバシーポリシーの更新
- データ保持期間の設定

## 🔗 関連リンク

- [GA4ヘルプセンター](https://support.google.com/analytics/)
- [GA4ダッシュボード](https://analytics.google.com/)
- [実装コード](../src/components/GoogleAnalytics.tsx)
- [アナリティクスヘルパー](../src/lib/analytics.ts)

## 📝 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2025-11-14 | 初期実装完了 |

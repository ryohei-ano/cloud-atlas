# Rate Limit 設定ガイド

このドキュメントでは、Cloud Atlasのレート制限の調整方法について説明します。

## 📍 設定ファイルの場所

**`src/lib/rateLimit.ts`** の91-107行目

## 🎯 現在の設定

```typescript
export const RATE_LIMITS = {
  // メモリー投稿API: 1分間に5回まで
  POST_MEMORY: {
    limit: 5,
    windowMs: 60 * 1000,
  },
  // メモリー取得API: 1分間に30回まで
  GET_MEMORY: {
    limit: 30,
    windowMs: 60 * 1000,
  },
};
```

## 📊 アクセス数別の推奨設定

### 段階1: 立ち上げ期（月間 ~1,000アクセス）
**現在の設定のまま**

```typescript
POST_MEMORY: { limit: 5, windowMs: 60 * 1000 }   // 5回/分
GET_MEMORY: { limit: 30, windowMs: 60 * 1000 }   // 30回/分
```

- スパム防止を最優先
- Supabase無料枠: 十分余裕

### 段階2: 成長期（月間 ~5,000アクセス）
```typescript
POST_MEMORY: { limit: 10, windowMs: 60 * 1000 }  // 10回/分
GET_MEMORY: { limit: 60, windowMs: 60 * 1000 }   // 60回/分
```

- 通常ユーザーに影響なし
- アクティブユーザー対応

### 段階3: 拡大期（月間 ~10,000アクセス）
```typescript
POST_MEMORY: { limit: 15, windowMs: 60 * 1000 }  // 15回/分
GET_MEMORY: { limit: 100, windowMs: 60 * 1000 }  // 100回/分
```

- 人気コンテンツ対応
- リピーター増加に対応

### 段階4: 安定期（月間 ~20,000アクセス）
```typescript
POST_MEMORY: { limit: 20, windowMs: 60 * 1000 }  // 20回/分
GET_MEMORY: { limit: 150, windowMs: 60 * 1000 }  // 150回/分
```

- 成熟したサービス向け
- Supabase無料枠ギリギリ

## 🔧 変更手順

### 1. ファイルを編集
```bash
# エディタで開く
code src/lib/rateLimit.ts
```

### 2. 数値を変更
```typescript
export const RATE_LIMITS = {
  POST_MEMORY: {
    limit: 10,  // ← ここを変更（例: 5 → 10）
    windowMs: 60 * 1000,
  },
  GET_MEMORY: {
    limit: 60,  // ← ここを変更（例: 30 → 60）
    windowMs: 60 * 1000,
  },
};
```

### 3. コミット & デプロイ
```bash
git add src/lib/rateLimit.ts
git commit -m "Update rate limits: POST 5→10/min, GET 30→60/min"
git push origin main
```

Vercelが自動的にデプロイします（約1-2分）。

## 📈 監視方法

### GA4で確認（今後実装予定）
- リアルタイムアクセス数
- Rate limit到達回数
- エラー発生率

### Supabaseダッシュボードで確認
1. [Supabase Dashboard](https://supabase.com/dashboard)にログイン
2. プロジェクトを選択
3. "Database" → "API" で使用量を確認

## ⚠️ 注意事項

### Supabase無料枠の制約
- **Database**: 500MB
- **Bandwidth**: 5GB/月
- **API requests**: 50,000リクエスト/日

### 計算式
```
1日のPOSTリクエスト最大数 = (60分 × 24時間 × limit) ÷ windowMs(分)
例: limit=10 → 60 × 24 × 10 = 14,400リクエスト/日
```

### 推奨モニタリング
- 週1回: Supabase使用量チェック
- 月1回: Rate limit設定の見直し
- エラー多発時: 即座に制限を緩和

## 🚨 緊急時の対応

### Rate limitが厳しすぎる場合
**症状**: 正常なユーザーが429エラーを頻繁に受け取る

**対応**:
```typescript
// 一時的に2倍に緩和
POST_MEMORY: { limit: 10, windowMs: 60 * 1000 }  // 5 → 10
GET_MEMORY: { limit: 60, windowMs: 60 * 1000 }   // 30 → 60
```

### スパム攻撃を受けた場合
**症状**: Supabase使用量が急増

**対応**:
```typescript
// 一時的に厳格化
POST_MEMORY: { limit: 3, windowMs: 60 * 1000 }   // 5 → 3
GET_MEMORY: { limit: 20, windowMs: 60 * 1000 }   // 30 → 20
```

## 📝 変更履歴

| 日付 | POST制限 | GET制限 | 理由 |
|------|---------|---------|------|
| 2025-11-14 | 5/分 | 30/分 | 初期設定（スパム防止） |
| - | - | - | - |

## 🔗 関連ファイル

- **実装**: `src/app/api/post-memory/route.ts`
- **実装**: `src/app/api/get-memories/route.ts`
- **定義**: `src/lib/rateLimit.ts`
- **セキュリティ**: `SECURITY.md`

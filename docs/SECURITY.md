# 🔒 Cloud Atlas - セキュリティドキュメント

## 概要

このドキュメントは、Cloud Atlasプロジェクトに実装されたセキュリティ対策と、運用時の注意事項をまとめたものです。

---

## 🛡️ 実装済みセキュリティ対策

### Phase 1: 緊急対応（Critical）✅

#### 1. **Supabase Row Level Security (RLS)**

- **目的**: データベースレベルでのアクセス制御
- **実装**: `supabase-rls-policies.sql`
- **内容**:
  - 全ユーザーの読み取り許可
  - 匿名ユーザーのみ挿入可能（3〜500文字）
  - 更新・削除の完全禁止

**設定方法**:

```bash
# SupabaseのSQL Editorで以下を実行
cat supabase-rls-policies.sql | pbcopy
# SQL Editorにペーストして実行
```

#### 2. **レート制限**

- **目的**: スパム攻撃・DDoS防止
- **実装**: `src/lib/rateLimit.ts`, `middleware.ts`
- **制限**:
  - メモリー投稿: 1分間に5回
  - メモリー取得: 1分間に30回
  - IP単位: 1時間に20回

#### 3. **サーバー側バリデーション**

- **目的**: XSS、SQLインジェクション、スパム対策
- **実装**: `src/lib/validation.ts`
- **検証内容**:
  - 長さチェック（3〜500文字）
  - 危険なパターン（script、iframe等）
  - スパムパターン（連続文字、過剰URL等）
  - 禁止ワード
  - HTMLサニタイゼーション

#### 4. **環境変数保護**

- **実装**: `.env.local.example`, `.gitignore`
- **状態**: ✅ 環境変数はGitから除外済み

---

### Phase 2: 高優先度（High）✅

#### 5. **CORS/CSRF対策**

- **実装**: `middleware.ts`
- **保護内容**:
  - 許可ドメインのみアクセス可能
  - Originヘッダー必須（POSTリクエスト）
  - Refererチェック

#### 6. **Content Security Policy (CSP)**

- **実装**: `next.config.ts`
- **ヘッダー**:
  - CSP（XSS追加防御）
  - X-Frame-Options（clickjacking防止）
  - X-Content-Type-Options
  - Referrer-Policy
  - Permissions-Policy

#### 7. **エラーハンドリング**

- **実装**: `src/lib/errorHandler.ts`
- **特徴**:
  - 詳細なエラーメッセージの隠蔽（本番環境）
  - 構造化ログ
  - リクエストID追跡

---

### Phase 3: 中優先度（Medium）✅

#### 8. **スパム検出システム**

- **実装**: `src/lib/spamDetection.ts`
- **検出アルゴリズム**:
  - パターンマッチング
  - スコアリングシステム
  - 類似度判定（重複投稿防止）

**スコアリング基準**:
| パターン | スコア |
|---------|--------|
| 同じ文字の連続（5回以上） | +10/回 |
| 大文字70%以上 | +20 |
| 特殊文字30%以上 | +15 |
| URL 3つ以上 | +10/個 |
| スパムワード | +30/語 |

**閾値**: 50点以上でスパム判定

---

## 📋 セットアップ手順

### 1. 環境変数の設定

```bash
# .env.local.exampleをコピー
cp .env.local.example .env.local

# 必要な値を設定
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - NEXT_PUBLIC_SITE_URL (本番環境のドメイン)
```

### 2. Supabase RLSポリシーの適用

1. [Supabaseダッシュボード](https://app.supabase.com/)にログイン
2. SQL Editorを開く
3. `supabase-rls-policies.sql`の内容を貼り付けて実行

### 3. 依存関係のインストール

```bash
npm install
```

### 4. ビルドとテスト

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番環境起動
npm start
```

---

## 🚀 デプロイ手順（Vercel）

### 1. 環境変数の設定

Vercelダッシュボードで以下を設定:

```
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NODE_ENV=production
```

### 2. CORS許可ドメインの更新

`middleware.ts`の`ALLOWED_ORIGINS`に本番ドメインを追加:

```typescript
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  'https://your-production-domain.com', // ここに追加
];
```

### 3. デプロイ

```bash
git push origin main
# Vercelが自動的にデプロイ
```

---

## 🧪 テスト方法

### 1. レート制限のテスト

```bash
# 連続で6回投稿（6回目で制限）
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/post-memory \
    -H "Content-Type: application/json" \
    -d '{"memory":"Test memory '$i'"}'
  echo "\n"
done
```

### 2. バリデーションのテスト

```bash
# 短すぎる（失敗）
curl -X POST http://localhost:3000/api/post-memory \
  -H "Content-Type: application/json" \
  -d '{"memory":"ab"}'

# XSS試行（失敗）
curl -X POST http://localhost:3000/api/post-memory \
  -H "Content-Type: application/json" \
  -d '{"memory":"<script>alert(1)</script>"}'

# 正常な投稿（成功）
curl -X POST http://localhost:3000/api/post-memory \
  -H "Content-Type: application/json" \
  -d '{"memory":"This is a valid memory"}'
```

### 3. スパム検出のテスト

```bash
# スパム（失敗）
curl -X POST http://localhost:3000/api/post-memory \
  -H "Content-Type: application/json" \
  -d '{"memory":"aaaaaaaaaaaaaaaa"}'

# 正常（成功）
curl -X POST http://localhost:3000/api/post-memory \
  -H "Content-Type: application/json" \
  -d '{"memory":"Hello world"}'
```

---

## 🔍 モニタリング

### ログの確認

```bash
# 開発環境
npm run dev
# コンソールにログが出力される

# 本番環境（Vercel）
# Vercelダッシュボード > Logs で確認
```

### レート制限の状態確認

レスポンスヘッダーで確認可能:

- `X-RateLimit-Limit`: 制限数
- `X-RateLimit-Remaining`: 残り回数
- `X-RateLimit-Reset`: リセット時刻

---

## ⚠️ 既知の制限事項

### 1. メモリベースのレート制限

- サーバー再起動でリセット
- マルチインスタンス環境では個別にカウント
- **解決策**: Redis等の外部ストレージ使用（オプション）

### 2. スパム検出の精度

- 誤検出の可能性あり
- 継続的な改善が必要
- **解決策**: スパムワードリストの定期更新

### 3. RLSポリシーの制限

- 管理者による削除も不可
- データベース直接操作が必要
- **解決策**: 管理者用APIの追加（将来実装）

---

## 🚨 セキュリティインシデント対応

### 攻撃を検知した場合

1. **IPブロック**:

```typescript
import { blockIp } from '@/lib/rateLimit';
blockIp('攻撃元IPアドレス');
```

2. **ログの確認**:

```bash
# Vercelダッシュボードでログを確認
# 攻撃パターンを分析
```

3. **RLSポリシーの確認**:

```sql
-- Supabase SQL Editorで確認
SELECT * FROM pg_policies WHERE tablename = 'memories';
```

4. **必要に応じてSupabaseキーを再生成**

---

## 📞 サポート

### 問題が発生した場合

1. [GitHub Issues](https://github.com/ryohei-ano/cloud-atlas/issues)に報告
2. ログを添付（個人情報は除外）
3. 再現手順を記載

### セキュリティ脆弱性の報告

重大なセキュリティ問題を発見した場合:

1. **公開せずに**直接連絡
2. 詳細な情報を提供
3. 修正まで非公開に

---

## 🔄 定期メンテナンス

### 月次

- [ ] ログの確認
- [ ] スパム検出の精度チェック
- [ ] レート制限の調整

### 四半期

- [ ] 依存関係の更新 (`npm audit`)
- [ ] セキュリティパッチの適用
- [ ] RLSポリシーのレビュー

### 年次

- [ ] Supabase APIキーのローテーション
- [ ] セキュリティ監査
- [ ] ドキュメントの更新

---

## 📚 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [Vercel Security Best Practices](https://vercel.com/docs/security)

---

## ✅ セキュリティチェックリスト

### デプロイ前

- [ ] 環境変数が設定されている
- [ ] RLSポリシーが適用されている
- [ ] .env.localがGitに含まれていない
- [ ] CORSの許可ドメインが正しい
- [ ] ビルドエラーがない

### デプロイ後

- [ ] APIが正常に動作する
- [ ] レート制限が機能している
- [ ] スパム検出が機能している
- [ ] ログが正しく出力されている
- [ ] セキュリティヘッダーが設定されている

---

**最終更新**: 2025-11-13
**バージョン**: 1.0.0

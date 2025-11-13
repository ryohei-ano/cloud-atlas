-- ============================================================================
-- Cloud Atlas - Supabase Row Level Security (RLS) Policies
-- ============================================================================
-- このSQLスクリプトをSupabaseのSQL Editorで実行してください
--
-- 目的: データベースレベルでのアクセス制御を実装し、
--       直接的なデータベース操作から保護します
-- ============================================================================

-- Step 1: memoriesテーブルのRLSを有効化
-- ----------------------------------------------------------------------------
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Step 2: 読み取りポリシー（全員が読める）
-- ----------------------------------------------------------------------------
-- 説明: 全ユーザーがメモリーを読み取ることができます
CREATE POLICY "Enable read access for all users"
ON memories
FOR SELECT
USING (true);

-- Step 3: 挿入ポリシー（匿名ユーザーのみ、長さ制限あり）
-- ----------------------------------------------------------------------------
-- 説明: メモリーの長さが3〜500文字で、memory_idが'anonymous'の場合のみ挿入可能
CREATE POLICY "Enable insert for anonymous users with validation"
ON memories
FOR INSERT
WITH CHECK (
  -- メモリーの長さチェック
  length(memory) >= 3 AND
  length(memory) <= 500 AND
  -- memory_idがANONYMOUS_USER_IDであることを確認
  memory_id = 'anonymous'
);

-- Step 4: 更新を禁止
-- ----------------------------------------------------------------------------
-- 説明: 一度投稿されたメモリーは編集できません
CREATE POLICY "Disable update for all users"
ON memories
FOR UPDATE
USING (false);

-- Step 5: 削除を禁止
-- ----------------------------------------------------------------------------
-- 説明: メモリーは削除できません（管理者権限を除く）
CREATE POLICY "Disable delete for all users"
ON memories
FOR DELETE
USING (false);

-- Step 6: パフォーマンス最適化のためのインデックス追加
-- ----------------------------------------------------------------------------
-- 説明: 頻繁にクエリされるカラムにインデックスを作成
CREATE INDEX IF NOT EXISTS idx_memories_created_at
ON memories(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memories_memory_id
ON memories(memory_id);

-- ============================================================================
-- テスト手順
-- ============================================================================
-- 1. 正常な挿入テスト:
--    INSERT INTO memories (memory, memory_id)
--    VALUES ('This is a valid memory', 'anonymous');
--
-- 2. 短すぎるメモリー（失敗すべき）:
--    INSERT INTO memories (memory, memory_id)
--    VALUES ('ab', 'anonymous');
--
-- 3. 長すぎるメモリー（失敗すべき）:
--    INSERT INTO memories (memory, memory_id)
--    VALUES (repeat('a', 501), 'anonymous');
--
-- 4. 不正なmemory_id（失敗すべき）:
--    INSERT INTO memories (memory, memory_id)
--    VALUES ('Test memory', 'hacker');
--
-- 5. 更新操作（失敗すべき）:
--    UPDATE memories SET memory = 'Updated' WHERE id = 1;
--
-- 6. 削除操作（失敗すべき）:
--    DELETE FROM memories WHERE id = 1;
-- ============================================================================

-- ============================================================================
-- 既存のポリシーを削除する場合（再実行時）
-- ============================================================================
-- 注意: 既にポリシーが存在する場合、以下を実行してから再度作成してください
--
-- DROP POLICY IF EXISTS "Enable read access for all users" ON memories;
-- DROP POLICY IF EXISTS "Enable insert for anonymous users with validation" ON memories;
-- DROP POLICY IF EXISTS "Disable update for all users" ON memories;
-- DROP POLICY IF EXISTS "Disable delete for all users" ON memories;
-- ============================================================================

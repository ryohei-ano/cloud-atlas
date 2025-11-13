/**
 * Spam Detection System
 *
 * 高度なスパム検出アルゴリズム
 * - パターンマッチング
 * - 類似度判定
 * - スコアリングシステム
 */

interface SpamScore {
  score: number;
  reasons: string[];
  isSpam: boolean;
}

// スパムスコアの閾値
const SPAM_THRESHOLD = 50;

/**
 * スパム検出メイン関数
 */
export function detectSpam(memory: string): SpamScore {
  let score = 0;
  const reasons: string[] = [];

  // 1. 同じ文字の連続
  const repeatedChars = memory.match(/(.)\1{5,}/g);
  if (repeatedChars) {
    score += repeatedChars.length * 10;
    reasons.push('Repeated characters detected');
  }

  // 2. 大文字の割合
  const uppercaseRatio = (memory.match(/[A-Z]/g) || []).length / memory.length;
  if (uppercaseRatio > 0.7 && memory.length > 10) {
    score += 20;
    reasons.push('Excessive uppercase');
  }

  // 3. 特殊文字の割合
  const specialChars = memory.match(/[^a-zA-Z0-9\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g);
  const specialCharRatio = specialChars ? specialChars.length / memory.length : 0;
  if (specialCharRatio > 0.3) {
    score += 15;
    reasons.push('Too many special characters');
  }

  // 4. URLの数
  const urls = memory.match(/https?:\/\/[^\s]+/g);
  if (urls) {
    if (urls.length > 2) {
      score += urls.length * 10;
      reasons.push('Multiple URLs detected');
    }
  }

  // 5. 数字のみ
  if (/^\d+$/.test(memory.trim())) {
    score += 25;
    reasons.push('Numbers only');
  }

  // 6. 短いメッセージに多くの絵文字
  const emojiCount = (memory.match(/[\u{1F600}-\u{1F6FF}]/gu) || []).length;
  if (memory.length < 50 && emojiCount > 5) {
    score += 20;
    reasons.push('Excessive emojis');
  }

  // 7. 既知のスパムワード
  const spamWords = [
    'buy now',
    'click here',
    'free money',
    'limited offer',
    'earn money fast',
    'work from home',
    'guaranteed income',
    '今すぐ購入',
    'クリックして',
    '無料でお金',
    '限定オファー',
  ];
  const lowerMemory = memory.toLowerCase();
  for (const word of spamWords) {
    if (lowerMemory.includes(word)) {
      score += 30;
      reasons.push(`Spam word detected: ${word}`);
    }
  }

  // 8. 全角文字と半角文字が混在している場合（不自然なパターン）
  const hasFullWidth = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/.test(
    memory
  );
  const hasHalfWidth = /[a-zA-Z0-9]/.test(memory);
  if (hasFullWidth && hasHalfWidth) {
    const fullWidthCount = (
      memory.match(/[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/g) || []
    ).length;
    const halfWidthCount = (memory.match(/[a-zA-Z0-9]/g) || []).length;
    const ratio =
      Math.min(fullWidthCount, halfWidthCount) / Math.max(fullWidthCount, halfWidthCount);

    if (ratio > 0.7) {
      score += 10;
      reasons.push('Unusual character mix');
    }
  }

  return {
    score,
    reasons,
    isSpam: score >= SPAM_THRESHOLD,
  };
}

/**
 * 類似メモリー検出（重複投稿防止）
 */
const recentMemories = new Map<string, number>();

export function checkDuplicateMemory(memory: string): {
  isDuplicate: boolean;
  similarityScore: number;
} {
  const normalized = memory.toLowerCase().trim();
  const now = Date.now();

  // 古いエントリを削除（5分以上前）
  for (const [key, timestamp] of recentMemories.entries()) {
    if (now - timestamp > 5 * 60 * 1000) {
      recentMemories.delete(key);
    }
  }

  // 完全一致チェック
  if (recentMemories.has(normalized)) {
    return { isDuplicate: true, similarityScore: 100 };
  }

  // 類似度チェック（簡易版）
  for (const [existingMemory] of recentMemories) {
    const similarity = calculateSimilarity(normalized, existingMemory);
    if (similarity > 0.9) {
      return { isDuplicate: true, similarityScore: similarity * 100 };
    }
  }

  // メモリーを記録
  recentMemories.set(normalized, now);
  return { isDuplicate: false, similarityScore: 0 };
}

/**
 * レーベンシュタイン距離ベースの類似度計算
 */
function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLength;
}

/**
 * レーベンシュタイン距離の計算
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 置換
          matrix[i][j - 1] + 1, // 挿入
          matrix[i - 1][j] + 1 // 削除
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * 最近のメモリーをクリア（テスト用）
 */
export function clearRecentMemories(): void {
  recentMemories.clear();
}

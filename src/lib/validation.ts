/**
 * Server-Side Validation and Sanitization
 *
 * ユーザー入力の検証とサニタイゼーション
 * XSS、SQLインジェクション、スパム攻撃からの保護
 */

import type { ValidationResult } from '@/types';

// 危険なパターン（XSS、スクリプトインジェクション）
const DANGEROUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick, onerror など
  /<iframe/gi,
  /<embed/gi,
  /<object/gi,
  /eval\(/gi,
  /expression\(/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
];

// スパムパターン
const SPAM_PATTERNS = [
  /(.)\1{10,}/g, // 同じ文字の連続（10回以上）
  /(https?:\/\/[^\s]+){3,}/g, // 複数のURL（3つ以上）
  /[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF.,!?、。！？]{20,}/g, // 意味不明な文字列
];

// 禁止ワード（必要に応じて追加）
const FORBIDDEN_WORDS = [
  // 例として一部のみ。実際の運用では拡充が必要
  'viagra',
  'casino',
  '出会い系',
  '副業',
  // 追加のスパムワードをここに
];

/**
 * メモリーのバリデーション
 */
export function validateMemory(memory: string): ValidationResult {
  // 1. 空文字チェック
  if (!memory || memory.trim().length === 0) {
    return { isValid: false, reason: 'Memory cannot be empty' };
  }

  const trimmed = memory.trim();

  // 2. 長さチェック
  if (trimmed.length < 3) {
    return { isValid: false, reason: 'Memory is too short (minimum 3 characters)' };
  }

  if (trimmed.length > 500) {
    return { isValid: false, reason: 'Memory is too long (maximum 500 characters)' };
  }

  // 3. 危険なパターンチェック（XSS対策）
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(memory)) {
      return { isValid: false, reason: 'Memory contains forbidden patterns' };
    }
  }

  // 4. スパムパターンチェック
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(memory)) {
      return { isValid: false, reason: 'Memory appears to be spam' };
    }
  }

  // 5. 禁止ワードチェック（大文字小文字無視、スペース除去）
  const normalized = memory.toLowerCase().replace(/\s/g, '');
  for (const word of FORBIDDEN_WORDS) {
    if (normalized.includes(word.toLowerCase().replace(/\s/g, ''))) {
      return { isValid: false, reason: 'Memory contains forbidden words' };
    }
  }

  // 6. URLの数をチェック（最大2つまで）
  const urlMatches = memory.match(/https?:\/\/[^\s]+/g);
  if (urlMatches && urlMatches.length > 2) {
    return { isValid: false, reason: 'Too many URLs in memory' };
  }

  // 7. 絵文字の過剰使用チェック
  const emojiCount = (memory.match(/[\u{1F600}-\u{1F6FF}]/gu) || []).length;
  if (trimmed.length < 50 && emojiCount > 10) {
    return { isValid: false, reason: 'Too many emojis for short message' };
  }

  // 8. 数字のみの投稿を禁止
  if (/^\d+$/.test(trimmed)) {
    return { isValid: false, reason: 'Memory cannot contain only numbers' };
  }

  // 9. 特殊文字の割合チェック
  const specialChars = memory.match(/[^a-zA-Z0-9\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g);
  const specialCharRatio = specialChars ? specialChars.length / memory.length : 0;
  if (specialCharRatio > 0.5) {
    return { isValid: false, reason: 'Too many special characters' };
  }

  return { isValid: true };
}

/**
 * HTMLサニタイゼーション（HTMLエスケープ）
 */
export function sanitizeMemory(memory: string): string {
  return memory
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * リクエストボディのバリデーション
 */
export function validateRequestBody(body: unknown): { memory?: string; error?: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'Invalid request body' };
  }

  const { memory } = body as { memory?: unknown };

  if (typeof memory !== 'string') {
    return { error: 'Memory must be a string' };
  }

  return { memory };
}

/**
 * ユーザーエージェントの妥当性チェック（ボット検出の補助）
 */
export function isValidUserAgent(userAgent: string | null): boolean {
  if (!userAgent) {
    return false;
  }

  // 一般的なブラウザのパターン
  const validPatterns = [/Mozilla/i, /Chrome/i, /Safari/i, /Firefox/i, /Edge/i, /Opera/i];

  // 既知のボットパターン
  const botPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i, /python/i];

  // ボットの場合は無効
  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      return false;
    }
  }

  // 有効なブラウザかチェック
  for (const pattern of validPatterns) {
    if (pattern.test(userAgent)) {
      return true;
    }
  }

  return false;
}

/**
 * Content-Typeヘッダーのチェック
 */
export function isValidContentType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  return contentType.includes('application/json');
}

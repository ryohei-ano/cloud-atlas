/**
 * Rate Limiting System
 *
 * メモリベースのレート制限実装（追加パッケージ不要）
 * スパム攻撃やDDoSからAPIを保護します
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 5分ごとに古いエントリをクリーンアップ
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  check(
    identifier: string,
    limit: number,
    windowMs: number
  ): { success: boolean; remaining: number; reset: number } {
    const now = Date.now();
    const entry = this.store[identifier];

    // エントリが存在しない、または期限切れの場合
    if (!entry || entry.resetTime < now) {
      this.store[identifier] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return {
        success: true,
        remaining: limit - 1,
        reset: now + windowMs,
      };
    }

    // リミットを超えている場合
    if (entry.count >= limit) {
      return {
        success: false,
        remaining: 0,
        reset: entry.resetTime,
      };
    }

    // カウントを増やす
    entry.count += 1;
    return {
      success: true,
      remaining: limit - entry.count,
      reset: entry.resetTime,
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// シングルトンインスタンス
export const rateLimiter = new RateLimiter();

// レート制限設定
export const RATE_LIMITS = {
  // 1分間に5回まで（メモリー投稿）
  POST_MEMORY: {
    limit: 5,
    windowMs: 60 * 1000,
  },
  // 1分間に30回まで（メモリー取得）
  GET_MEMORY: {
    limit: 30,
    windowMs: 60 * 1000,
  },
  // 1時間に20回まで（IP単位の厳格制限）
  IP_HOURLY: {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  },
} as const;

/**
 * クライアントのIPアドレスを取得
 * Vercel、Cloudflare等の各種プラットフォームに対応
 */
export function getClientIp(request: Request): string {
  // Vercelのヘッダーから取得
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Cloudflareのヘッダー
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // その他のプロキシヘッダー
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // フォールバック
  return 'unknown';
}

// IPブロックリスト（悪質なIPを手動でブロック）
const blockedIps = new Set<string>();

/**
 * IPアドレスをブロックリストに追加
 */
export function blockIp(ip: string): void {
  blockedIps.add(ip);
  // IPアドレスはログに出力しない（プライバシー保護）
}

/**
 * IPアドレスをブロックリストから削除
 */
export function unblockIp(ip: string): void {
  blockedIps.delete(ip);
  // IPアドレスはログに出力しない（プライバシー保護）
}

/**
 * IPアドレスがブロックされているかチェック
 */
export function isIpBlocked(ip: string): boolean {
  return blockedIps.has(ip);
}

/**
 * IP単位の厳格なレート制限チェック
 */
export function checkIpRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  reset: number;
} {
  const result = rateLimiter.check(
    `ip-${ip}`,
    RATE_LIMITS.IP_HOURLY.limit,
    RATE_LIMITS.IP_HOURLY.windowMs
  );

  return {
    allowed: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}

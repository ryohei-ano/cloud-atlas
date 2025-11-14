/**
 * Google Analytics 4 ヘルパー関数
 *
 * カスタムイベントを送信するためのユーティリティ関数群
 */

// グローバル型定義
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'set',
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}

/**
 * ページビューイベントを送信
 * Next.jsのルート変更時に自動的に呼び出されます
 */
export const pageview = (url: string): void => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID as string, {
      page_path: url,
    });
  }
};

/**
 * カスタムイベントを送信
 *
 * @param action - イベント名（例: 'memory_posted', 'rate_limit_hit'）
 * @param params - イベントパラメータ
 */
export const event = (action: string, params?: Record<string, unknown>): void => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, params);
  }
};

/**
 * メモリー投稿イベント
 */
export const trackMemoryPost = (memoryLength: number): void => {
  event('memory_posted', {
    event_category: 'engagement',
    event_label: 'user_content',
    value: memoryLength,
  });
};

/**
 * メモリー取得イベント
 */
export const trackMemoryFetch = (count: number): void => {
  event('memories_fetched', {
    event_category: 'data',
    event_label: 'fetch',
    value: count,
  });
};

/**
 * Rate Limit到達イベント
 */
export const trackRateLimitHit = (endpoint: string, retryAfter: number): void => {
  event('rate_limit_hit', {
    event_category: 'security',
    event_label: endpoint,
    value: retryAfter,
  });
};

/**
 * エラー発生イベント
 */
export const trackError = (errorType: string, errorMessage: string): void => {
  event('error_occurred', {
    event_category: 'error',
    event_label: errorType,
    error_message: errorMessage,
  });
};

/**
 * スパム検出イベント
 */
export const trackSpamDetected = (reason: string): void => {
  event('spam_detected', {
    event_category: 'security',
    event_label: 'spam_prevention',
    spam_reason: reason,
  });
};

/**
 * ターミナル操作イベント
 */
export const trackTerminalAction = (action: 'open' | 'close' | 'submit'): void => {
  event('terminal_action', {
    event_category: 'interaction',
    event_label: action,
  });
};

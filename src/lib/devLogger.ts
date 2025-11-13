/**
 * Development-only Logger
 *
 * 開発環境でのみログを出力するユーティリティ
 * 本番環境では何も出力しない
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const devLog = {
  /**
   * 開発環境でのみログを出力
   */
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * 開発環境でのみ警告を出力
   */
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * 開発環境でのみエラーを出力（本番環境ではerrorHandlerを使用すべき）
   */
  error: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.error(...args);
    }
  },

  /**
   * 開発環境でのみデバッグ情報を出力
   */
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

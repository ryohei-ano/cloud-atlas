/**
 * Error Handling and Logging System
 *
 * 一貫したエラーレスポンスとロギング
 * 本番環境では詳細なエラー情報を隠蔽
 */

import { NextResponse } from 'next/server';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  SPAM_DETECTED = 'SPAM_DETECTED',
  DUPLICATE_CONTENT = 'DUPLICATE_CONTENT',
}

interface ErrorResponse {
  error: string;
  code: ErrorCode;
  timestamp: string;
  requestId?: string;
}

/**
 * 標準化されたエラーレスポンスを作成
 */
export function createErrorResponse(
  message: string,
  code: ErrorCode,
  status: number,
  requestId?: string
): NextResponse<ErrorResponse> {
  // 本番環境では詳細なエラーメッセージを隠す
  const isProduction = process.env.NODE_ENV === 'production';
  const userMessage = isProduction ? getGenericMessage(code) : message;

  return NextResponse.json(
    {
      error: userMessage,
      code,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    },
    { status }
  );
}

/**
 * エラーコードに対応する一般的なメッセージを取得
 */
function getGenericMessage(code: ErrorCode): string {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
      return 'Invalid input provided';
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return 'Too many requests. Please try again later';
    case ErrorCode.DATABASE_ERROR:
      return 'A database error occurred';
    case ErrorCode.AUTHENTICATION_ERROR:
      return 'Authentication failed';
    case ErrorCode.FORBIDDEN:
      return 'Access denied';
    case ErrorCode.NOT_FOUND:
      return 'Resource not found';
    case ErrorCode.SPAM_DETECTED:
      return 'Content flagged as spam';
    case ErrorCode.DUPLICATE_CONTENT:
      return 'Duplicate or similar content detected';
    case ErrorCode.INTERNAL_ERROR:
    default:
      return 'An internal error occurred';
  }
}

/**
 * エラーをログに記録
 */
export function logError(error: Error | unknown, context: Record<string, unknown> = {}): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const logEntry = {
    timestamp,
    level: 'ERROR',
    message: errorMessage,
    stack: errorStack,
    ...context,
  };

  // 開発環境では詳細ログ
  if (process.env.NODE_ENV !== 'production') {
    console.error(JSON.stringify(logEntry, null, 2));
  } else {
    // 本番環境ではシンプルなログ
    console.error(JSON.stringify(logEntry));
  }

  // 本番環境では外部ロギングサービスに送信
  if (process.env.NODE_ENV === 'production' && process.env.LOGGING_ENDPOINT) {
    sendToLoggingService(logEntry).catch((err) => {
      console.error('Failed to send log:', err);
    });
  }
}

/**
 * 外部ロギングサービスへの送信
 */
async function sendToLoggingService(logEntry: Record<string, unknown>): Promise<void> {
  if (!process.env.LOGGING_ENDPOINT) {
    return;
  }

  try {
    await fetch(process.env.LOGGING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logEntry),
    });
  } catch (error) {
    console.error('Logging service error:', error);
  }
}

/**
 * 情報ログ
 */
export function logInfo(message: string, context: Record<string, unknown> = {}): void {
  const timestamp = new Date().toISOString();

  const logEntry = {
    timestamp,
    level: 'INFO',
    message,
    ...context,
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log(JSON.stringify(logEntry, null, 2));
  }
}

/**
 * 警告ログ
 */
export function logWarning(message: string, context: Record<string, unknown> = {}): void {
  const timestamp = new Date().toISOString();

  const logEntry = {
    timestamp,
    level: 'WARN',
    message,
    ...context,
  };

  console.warn(JSON.stringify(logEntry, null, 2));

  // 本番環境では警告も外部サービスに送信
  if (process.env.NODE_ENV === 'production' && process.env.LOGGING_ENDPOINT) {
    sendToLoggingService(logEntry).catch((err) => {
      console.error('Failed to send warning log:', err);
    });
  }
}

/**
 * リクエストIDの生成
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

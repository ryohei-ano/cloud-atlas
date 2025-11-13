/**
 * Security Middleware
 *
 * APIエンドポイントのセキュリティ保護:
 * - レート制限
 * - CORS保護
 * - CSRF対策
 * - IPブロッキング
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  rateLimiter,
  RATE_LIMITS,
  getClientIp,
  isIpBlocked,
  checkIpRateLimit,
} from '@/lib/rateLimit';

// 許可するオリジン（本番環境では実際のドメインに変更）
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  // 本番環境のドメインを追加
  'https://cloud-atlas-space.vercel.app',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');

  // APIルートのみセキュリティ保護を適用
  if (pathname.startsWith('/api/')) {
    // ===== IPブロックチェック =====
    const ip = getClientIp(request);

    if (isIpBlocked(ip)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // ===== CORS保護 =====
    // POSTリクエストの場合、Originヘッダー必須
    if (request.method === 'POST' && !origin) {
      return NextResponse.json({ error: 'Origin header required' }, { status: 403 });
    }

    // Originチェック（許可されたドメインのみ）
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json({ error: 'CORS policy violation' }, { status: 403 });
    }

    // ===== CSRF対策 =====
    // Refererチェック（追加保護）
    if (request.method === 'POST') {
      const referer = request.headers.get('referer');
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          const isValidReferer = ALLOWED_ORIGINS.some(
            (allowed) =>
              refererUrl.origin === allowed || refererUrl.origin === new URL(allowed).origin
          );

          if (!isValidReferer) {
            return NextResponse.json({ error: 'Invalid referer' }, { status: 403 });
          }
        } catch {
          // URLパースエラー
          return NextResponse.json({ error: 'Invalid referer' }, { status: 403 });
        }
      }
    }

    // ===== IP単位の厳格なレート制限 =====
    const ipRateCheck = checkIpRateLimit(ip);
    if (!ipRateCheck.allowed) {
      const retryAfter = Math.ceil((ipRateCheck.reset - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Too many requests from your IP',
          retryAfter: retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
          },
        }
      );
    }

    // ===== エンドポイント別レート制限 =====
    const identifier = `${ip}-${pathname}`;

    let rateLimit;
    if (pathname === '/api/post-memory') {
      rateLimit = RATE_LIMITS.POST_MEMORY;
    } else if (pathname === '/api/get-memories') {
      rateLimit = RATE_LIMITS.GET_MEMORY;
    } else {
      // その他のAPIエンドポイント用のデフォルト
      rateLimit = { limit: 10, windowMs: 60 * 1000 };
    }

    const result = rateLimiter.check(identifier, rateLimit.limit, rateLimit.windowMs);

    // レート制限超過の場合
    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(result.reset).toISOString(),
          },
        }
      );
    }

    // ===== レスポンスヘッダー設定 =====
    const response = NextResponse.next();

    // CORSヘッダー
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      response.headers.set('Access-Control-Max-Age', '86400');
    }

    // レート制限ヘッダー
    response.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString());

    // セキュリティヘッダー
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
  }

  return NextResponse.next();
}

// OPTIONSリクエスト（preflight）のハンドリング
export function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return new NextResponse(null, { status: 403 });
}

export const config = {
  matcher: '/api/:path*',
};

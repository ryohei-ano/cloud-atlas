import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logError, logWarning, logInfo, generateRequestId } from '@/lib/errorHandler';
import { rateLimiter, RATE_LIMITS, getClientIp } from '@/lib/rateLimit';

export async function GET(req: Request) {
  const requestId = generateRequestId();

  try {
    // ===== Rate Limit チェック =====
    const ip = getClientIp(req);
    const rateLimitIdentifier = `${ip}-/api/get-memories`;
    const rateLimitResult = rateLimiter.check(
      rateLimitIdentifier,
      RATE_LIMITS.GET_MEMORY.limit,
      RATE_LIMITS.GET_MEMORY.windowMs
    );

    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);

      logWarning('Rate limit exceeded', {
        requestId,
        endpoint: '/api/get-memories',
        ip: ip === 'unknown' ? 'unknown' : '[REDACTED]',
        remainingTime: retryAfter,
      });

      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter,
          requestId,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(RATE_LIMITS.GET_MEMORY.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          },
        }
      );
    }

    logInfo('Rate limit check passed', {
      requestId,
      endpoint: '/api/get-memories',
      remaining: rateLimitResult.remaining,
      limit: RATE_LIMITS.GET_MEMORY.limit,
    });

    // ===== データ取得 =====
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      logError(error, {
        requestId,
        endpoint: '/api/get-memories',
        method: 'GET',
        message: 'Failed to fetch memories from database',
      });
      return NextResponse.json(
        { error: 'Fetch error', requestId },
        {
          status: 500,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMITS.GET_MEMORY.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          },
        }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'X-RateLimit-Limit': String(RATE_LIMITS.GET_MEMORY.limit),
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
      },
    });
  } catch (err) {
    logError(err, {
      requestId,
      endpoint: '/api/get-memories',
      message: 'Unexpected error in GET handler',
    });
    return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
  }
}

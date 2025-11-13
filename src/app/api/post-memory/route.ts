/**
 * POST /api/post-memory
 *
 * メモリー投稿API（セキュリティ強化版）
 * - サーバー側バリデーション
 * - XSS対策
 * - スパム検出
 * - エラーハンドリング
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ANONYMOUS_USER_ID } from '@/lib/constants';
import {
  validateMemory,
  sanitizeMemory,
  validateRequestBody,
  isValidContentType,
} from '@/lib/validation';
import {
  createErrorResponse,
  ErrorCode,
  logError,
  logInfo,
  logWarning,
  generateRequestId,
} from '@/lib/errorHandler';
import { detectSpam, checkDuplicateMemory } from '@/lib/spamDetection';

export async function POST(req: Request) {
  const requestId = generateRequestId();

  try {
    // ===== 1. Content-Typeチェック =====
    const contentType = req.headers.get('content-type');
    if (!isValidContentType(contentType)) {
      return createErrorResponse(
        'Content-Type must be application/json',
        ErrorCode.VALIDATION_ERROR,
        415,
        requestId
      );
    }

    // ===== 2. リクエストボディのパース =====
    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON', ErrorCode.VALIDATION_ERROR, 400, requestId);
    }

    // ===== 3. リクエストボディのバリデーション =====
    const { memory, error: bodyError } = validateRequestBody(body);
    if (bodyError || !memory) {
      return createErrorResponse(
        bodyError || 'Invalid request',
        ErrorCode.VALIDATION_ERROR,
        400,
        requestId
      );
    }

    // ===== 4. メモリーのバリデーション =====
    const validation = validateMemory(memory);
    if (!validation.isValid) {
      logInfo('Validation failed', {
        requestId,
        reason: validation.reason,
        memoryLength: memory.length,
      });

      return createErrorResponse(
        validation.reason || 'Invalid memory',
        ErrorCode.VALIDATION_ERROR,
        400,
        requestId
      );
    }

    // ===== 5. スパム検出 =====
    const spamResult = detectSpam(memory);
    if (spamResult.isSpam) {
      logWarning('Spam detected', {
        requestId,
        spamScore: spamResult.score,
        reasons: spamResult.reasons,
        memoryPreview: memory.substring(0, 50),
      });

      return createErrorResponse(
        'Content flagged as spam',
        ErrorCode.SPAM_DETECTED,
        400,
        requestId
      );
    }

    // ===== 6. 重複検出 =====
    const duplicateCheck = checkDuplicateMemory(memory);
    if (duplicateCheck.isDuplicate) {
      logInfo('Duplicate content detected', {
        requestId,
        similarityScore: duplicateCheck.similarityScore,
      });

      return createErrorResponse(
        'Duplicate or similar content detected',
        ErrorCode.DUPLICATE_CONTENT,
        409,
        requestId
      );
    }

    // ===== 7. サニタイゼーション =====
    const sanitizedMemory = sanitizeMemory(memory);

    // ===== 8. Supabaseに挿入 =====
    logInfo('Attempting to insert memory', {
      requestId,
      memoryLength: sanitizedMemory.length,
    });

    const { data, error } = await supabase
      .from('memories')
      .insert([{ memory: sanitizedMemory, memory_id: ANONYMOUS_USER_ID }])
      .select();

    if (error) {
      logError(new Error('Database error'), {
        requestId,
        errorMessage: error.message,
        errorCode: error.code,
      });

      // エラーの詳細を隠す
      return createErrorResponse('Failed to save memory', ErrorCode.DATABASE_ERROR, 500, requestId);
    }

    // ===== 9. 成功レスポンス =====
    logInfo('Memory saved successfully', {
      requestId,
      memoryId: data?.[0]?.id,
    });

    return NextResponse.json(
      {
        message: 'Saved',
        data,
        requestId,
      },
      { status: 201 }
    );
  } catch (err) {
    logError(err, { requestId });

    // エラーの詳細を隠す
    return createErrorResponse('Internal server error', ErrorCode.INTERNAL_ERROR, 500, requestId);
  }
}

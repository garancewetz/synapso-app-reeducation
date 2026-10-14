import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// --- Types ---

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetTime: number;
};

// --- Configuration ---

const RATE_LIMIT_CONFIG = {
  auth: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  api: { maxAttempts: 100, windowMs: 60 * 1000 },
};

// ⚡ PERFORMANCE: fail open after 1s instead of Upstash's 5s default — a slow Redis
// must not hold every API call (and so the app launch) hostage.
const RATE_LIMIT_TIMEOUT_MS = 1000;

// --- Upstash Redis (production) ---

let upstashAuthLimiter: UpstashLimiter | null = null;
let upstashApiLimiter: UpstashLimiter | null = null;

type UpstashLimiter = {
  limit: (key: string) => Promise<{ success: boolean; remaining: number; reset: number }>;
};

async function getUpstashLimiters(): Promise<boolean> {
  if (upstashAuthLimiter && upstashApiLimiter) return true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;

  try {
    const { Redis } = await import('@upstash/redis');
    const { Ratelimit } = await import('@upstash/ratelimit');

    const redis = new Redis({ url, token });

    upstashAuthLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(RATE_LIMIT_CONFIG.auth.maxAttempts, '15 m'),
      prefix: 'ratelimit:auth',
      timeout: RATE_LIMIT_TIMEOUT_MS,
    });

    upstashApiLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(RATE_LIMIT_CONFIG.api.maxAttempts, '1 m'),
      prefix: 'ratelimit:api',
      timeout: RATE_LIMIT_TIMEOUT_MS,
    });

    return true;
  } catch {
    return false;
  }
}

// --- Fallback in-memory (développement) ---

const rateLimitMap = new Map<string, RateLimitRecord>();

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (record.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }
}

function checkRateLimitInMemory(
  key: string,
  config: { maxAttempts: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (Math.random() < 0.1) cleanupExpiredEntries();

  if (!record || record.resetTime < now) {
    const resetTime = now + config.windowMs;
    rateLimitMap.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: config.maxAttempts - 1, resetTime };
  }

  if (record.count >= config.maxAttempts) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: config.maxAttempts - record.count, resetTime: record.resetTime };
}

// --- Helpers ---

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}

function rateLimitResponse(result: RateLimitResult, config: { maxAttempts: number }, message: string): NextResponse {
  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': config.maxAttempts.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      },
    }
  );
}

function addRateLimitHeaders(response: NextResponse, result: RateLimitResult, config: { maxAttempts: number }): NextResponse {
  response.headers.set('X-RateLimit-Limit', config.maxAttempts.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
  return response;
}

// --- Unified rate limit check ---

async function rateLimit(
  key: string,
  config: { maxAttempts: number; windowMs: number },
  type: 'auth' | 'api'
): Promise<RateLimitResult> {
  const hasUpstash = await getUpstashLimiters();

  if (hasUpstash) {
    const limiter = type === 'auth' ? upstashAuthLimiter! : upstashApiLimiter!;
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetTime: result.reset,
    };
  }

  return checkRateLimitInMemory(`${type}:${key}`, config);
}

// --- Middleware ---

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const ip = getClientIP(request);

  // Désactiver le rate limiting en développement local
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // Routes d'authentification : 5 tentatives / 15 min
  if (path.startsWith('/api/auth/login') || path.startsWith('/api/auth/register')) {
    const result = await rateLimit(ip, RATE_LIMIT_CONFIG.auth, 'auth');

    if (!result.allowed) {
      return rateLimitResponse(result, RATE_LIMIT_CONFIG.auth, 'Trop de tentatives. Veuillez réessayer dans quelques minutes.');
    }

    return addRateLimitHeaders(NextResponse.next(), result, RATE_LIMIT_CONFIG.auth);
  }

  // Routes API générales : 100 requêtes / min
  if (path.startsWith('/api/')) {
    const result = await rateLimit(ip, RATE_LIMIT_CONFIG.api, 'api');

    if (!result.allowed) {
      return rateLimitResponse(result, RATE_LIMIT_CONFIG.api, 'Trop de requêtes. Veuillez ralentir.');
    }

    return addRateLimitHeaders(NextResponse.next(), result, RATE_LIMIT_CONFIG.api);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};

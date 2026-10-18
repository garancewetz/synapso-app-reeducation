import { NextResponse } from 'next/server';

// --- Types ---

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetTime: number;
};

type RateLimitConfig = { maxAttempts: number; windowSeconds: number };

// --- Configuration ---

export const RATE_LIMIT_CONFIG = {
  // Login + inscription, par IP
  auth: { maxAttempts: 5, windowSeconds: 15 * 60 },
  // Login, par nom de compte : freine le bruteforce distribué sur plusieurs IP
  loginName: { maxAttempts: 10, windowSeconds: 15 * 60 },
  // Upload Cloudinary, par IP : chaque upload coûte du stockage
  upload: { maxAttempts: 30, windowSeconds: 60 * 60 },
  api: { maxAttempts: 100, windowSeconds: 60 },
} satisfies Record<string, RateLimitConfig>;

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIG;

// ⚡ PERFORMANCE: fail open after 1s instead of Upstash's 5s default — a slow Redis
// must not hold every API call (and so the app launch) hostage.
const RATE_LIMIT_TIMEOUT_MS = 1000;

// --- Upstash Redis (production) ---

type UpstashLimiter = {
  limit: (key: string) => Promise<{ success: boolean; remaining: number; reset: number }>;
};

let upstashLimiters: Record<RateLimitType, UpstashLimiter> | null = null;

async function getUpstashLimiters(): Promise<Record<RateLimitType, UpstashLimiter> | null> {
  if (upstashLimiters) return upstashLimiters;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const { Redis } = await import('@upstash/redis');
    const { Ratelimit } = await import('@upstash/ratelimit');

    const redis = new Redis({ url, token });
    const createLimiter = (type: RateLimitType): UpstashLimiter => {
      const { maxAttempts, windowSeconds } = RATE_LIMIT_CONFIG[type];
      return new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(maxAttempts, `${windowSeconds} s`),
        prefix: `ratelimit:${type}`,
        timeout: RATE_LIMIT_TIMEOUT_MS,
      });
    };

    upstashLimiters = {
      auth: createLimiter('auth'),
      loginName: createLimiter('loginName'),
      upload: createLimiter('upload'),
      api: createLimiter('api'),
    };
    return upstashLimiters;
  } catch {
    return null;
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

function checkRateLimitInMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (Math.random() < 0.1) cleanupExpiredEntries();

  if (!record || record.resetTime < now) {
    const resetTime = now + config.windowSeconds * 1000;
    rateLimitMap.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: config.maxAttempts - 1, resetTime };
  }

  if (record.count >= config.maxAttempts) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: config.maxAttempts - record.count, resetTime: record.resetTime };
}

// --- API ---

export async function rateLimit(type: RateLimitType, key: string): Promise<RateLimitResult> {
  const limiters = await getUpstashLimiters();

  if (limiters) {
    const result = await limiters[type].limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetTime: result.reset,
    };
  }

  return checkRateLimitInMemory(`${type}:${key}`, RATE_LIMIT_CONFIG[type]);
}

/**
 * IP du client. Sur Netlify, `x-nf-client-connection-ip` est posé par l'edge et
 * ne peut pas être forgé ; `x-forwarded-for` est contrôlable par le client
 * (il suffit d'envoyer l'en-tête), on ne s'en sert qu'en dernier recours.
 */
export function getClientIP(request: Request): string {
  const headers = request.headers;
  return (
    headers.get('x-nf-client-connection-ip') ??
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  );
}

export function rateLimitResponse(type: RateLimitType, result: RateLimitResult, message: string): NextResponse {
  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': RATE_LIMIT_CONFIG[type].maxAttempts.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      },
    }
  );
}

export function addRateLimitHeaders(type: RateLimitType, response: NextResponse, result: RateLimitResult): NextResponse {
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_CONFIG[type].maxAttempts.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
  return response;
}

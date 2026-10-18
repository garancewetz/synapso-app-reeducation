import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  rateLimit,
  getClientIP,
  rateLimitResponse,
  addRateLimitHeaders,
  type RateLimitType,
} from '@/app/lib/rate-limit';

const MESSAGES: Record<RateLimitType, string> = {
  auth: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
  loginName: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
  upload: 'Trop d\'envois de photos. Veuillez réessayer plus tard.',
  api: 'Trop de requêtes. Veuillez ralentir.',
};

function getRateLimitType(path: string): RateLimitType {
  if (path.startsWith('/api/auth/login') || path.startsWith('/api/auth/register')) return 'auth';
  if (path.startsWith('/api/exercices/upload-media')) return 'upload';
  return 'api';
}

export async function middleware(request: NextRequest) {
  // Désactiver le rate limiting en développement local
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  const type = getRateLimitType(request.nextUrl.pathname);
  const result = await rateLimit(type, getClientIP(request));

  if (!result.allowed) {
    return rateLimitResponse(type, result, MESSAGES[type]);
  }

  return addRateLimitHeaders(type, NextResponse.next(), result);
}

export const config = {
  matcher: '/api/:path*',
};

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import {
  AUTH_COOKIE_NAME,
  IMPERSONATE_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  signValue,
  readUserIdFromCookieValue,
} from './auth-shared';
import { findSessionUser, type SessionUser } from './session';

// Configuration des cookies
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: '/',
};

/**
 * Hash un mot de passe avec bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Vérifie un mot de passe contre un hash bcrypt
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Une route appelle souvent requireAuth + getEffectiveUserId + isAdmin :
// on ne résout la session qu'une fois par requête.
const sessionCache = new WeakMap<NextRequest, Promise<SessionUser | null>>();

/**
 * Récupère l'utilisateur connecté (session vérifiée en base)
 */
export function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  let session = sessionCache.get(request);
  if (!session) {
    session = findSessionUser(request.cookies.get(AUTH_COOKIE_NAME)?.value);
    sessionCache.set(request, session);
  }
  return session;
}

/**
 * Récupère l'ID de l'utilisateur connecté
 */
export async function getCurrentUserId(request: NextRequest): Promise<number | null> {
  const user = await getSessionUser(request);
  return user?.id ?? null;
}

/**
 * Récupère l'ID de l'utilisateur impersonné (admin only)
 */
export function getImpersonatedUserId(request: NextRequest): number | null {
  return readUserIdFromCookieValue(request.cookies.get(IMPERSONATE_COOKIE_NAME)?.value);
}

/**
 * Récupère l'ID de l'utilisateur effectif (impersonné si admin, sinon connecté)
 * L'impersonation est ignorée si l'utilisateur connecté n'est pas admin
 */
export async function getEffectiveUserId(request: NextRequest): Promise<number | null> {
  const user = await getSessionUser(request);
  if (!user) return null;

  const impersonatedUserId = getImpersonatedUserId(request);
  if (!impersonatedUserId || user.role !== 'ADMIN') return user.id;

  return impersonatedUserId;
}

/**
 * Vérifie si l'utilisateur connecté est admin
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const user = await getSessionUser(request);
  return user?.role === 'ADMIN';
}

/**
 * Pose le cookie d'authentification (jeton créé par createSessionToken)
 */
export function setAuthCookie(response: NextResponse, sessionToken: string): NextResponse {
  response.cookies.set(AUTH_COOKIE_NAME, sessionToken, COOKIE_OPTIONS);
  return response;
}

/**
 * Crée le cookie d'impersonation (admin only)
 */
export function setImpersonateCookie(response: NextResponse, userId: number): NextResponse {
  const signedValue = signValue(userId.toString());
  response.cookies.set(IMPERSONATE_COOKIE_NAME, signedValue, COOKIE_OPTIONS);
  return response;
}

/**
 * Supprime le cookie d'authentification
 */
export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.delete(AUTH_COOKIE_NAME);
  response.cookies.delete(IMPERSONATE_COOKIE_NAME);
  return response;
}

/**
 * Supprime le cookie d'impersonation
 */
export function clearImpersonateCookie(response: NextResponse): NextResponse {
  response.cookies.delete(IMPERSONATE_COOKIE_NAME);
  return response;
}

/**
 * Middleware pour protéger les routes API
 * Retourne null si l'utilisateur est authentifié, sinon retourne une réponse d'erreur
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const user = await getSessionUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Non autorisé. Authentification requise.' },
      { status: 401 }
    );
  }
  
  return null;
}

/**
 * Middleware pour protéger les routes API admin
 * Retourne null si l'utilisateur est admin, sinon retourne une réponse d'erreur
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const adminStatus = await isAdmin(request);

  if (!adminStatus) {
    return NextResponse.json(
      { error: 'Accès refusé. Droits administrateur requis.' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Contexte d'authentification pour les routes API.
 * Retourne { userId } si authentifié, sinon une NextResponse 401.
 */
export async function getAuthContext(
  request: NextRequest
): Promise<{ userId: number } | NextResponse> {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const userId = await getEffectiveUserId(request);
  if (!userId) {
    return NextResponse.json(
      { error: 'Utilisateur non authentifié' },
      { status: 401 }
    );
  }
  return { userId };
}

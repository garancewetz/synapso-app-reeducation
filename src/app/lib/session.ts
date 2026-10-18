import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import {
  authUserSelect,
  isSessionSignatureValid,
  parseSessionToken,
  readUserIdFromCookieValue,
} from './auth-shared';

export type SessionUser = Prisma.UserGetPayload<{ select: typeof authUserSelect }>;

/**
 * Résout l'utilisateur d'un cookie de session.
 * Retourne null si le jeton est absent, expiré, mal signé, émis avant le
 * dernier changement de mot de passe, ou si le compte n'existe plus.
 */
export async function findSessionUser(rawValue: string | undefined): Promise<SessionUser | null> {
  const token = parseSessionToken(rawValue);
  if (!token) return null;

  const user = await prisma.user.findUnique({
    where: { id: token.userId },
    select: { ...authUserSelect, passwordHash: true },
  });
  if (!user || !isSessionSignatureValid(token, user.passwordHash)) return null;

  const { passwordHash, ...sessionUser } = user;
  void passwordHash;
  return sessionUser;
}

export type AuthState = {
  authenticated: boolean;
  user: SessionUser | null;
  isAdmin: boolean;
  impersonatedUser: SessionUser | null;
};

const UNAUTHENTICATED: AuthState = {
  authenticated: false,
  user: null,
  isAdmin: false,
  impersonatedUser: null,
};

/**
 * État d'authentification complet à partir des deux cookies
 * (partagé entre /api/auth/check et le rendu serveur).
 */
export async function resolveAuthState(
  authCookie: string | undefined,
  impersonateCookie: string | undefined
): Promise<AuthState> {
  const user = await findSessionUser(authCookie);
  if (!user) return UNAUTHENTICATED;

  const isAdmin = user.role === 'ADMIN';
  const impersonatedUserId = readUserIdFromCookieValue(impersonateCookie);
  const impersonatedUser =
    isAdmin && impersonatedUserId && impersonatedUserId !== user.id
      ? await prisma.user.findUnique({ where: { id: impersonatedUserId }, select: authUserSelect })
      : null;

  return { authenticated: true, user, isAdmin, impersonatedUser };
}

import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, IMPERSONATE_COOKIE_NAME } from './auth-shared';
import { resolveAuthState, type SessionUser } from './session';

type ServerUser = {
  id: number;
  name: string;
  role: 'USER' | 'ADMIN';
  resetFrequency?: 'DAILY' | 'WEEKLY';
  dominantHand?: 'LEFT' | 'RIGHT';
  hasJournal?: boolean;
  createdAt?: string;
};

export type InitialAuthData = {
  authenticated: boolean;
  user: ServerUser | null;
  isAdmin: boolean;
  impersonatedUser: ServerUser | null;
};

function serializeUser(user: SessionUser): ServerUser {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    resetFrequency: user.resetFrequency ?? undefined,
    dominantHand: user.dominantHand ?? undefined,
    hasJournal: user.hasJournal ?? undefined,
    createdAt: user.createdAt ? user.createdAt.toISOString() : undefined,
  };
}

export const getInitialAuthData = cache(async (): Promise<InitialAuthData> => {
  const cookieStore = await cookies();
  const state = await resolveAuthState(
    cookieStore.get(AUTH_COOKIE_NAME)?.value,
    cookieStore.get(IMPERSONATE_COOKIE_NAME)?.value
  );

  return {
    authenticated: state.authenticated,
    user: state.user ? serializeUser(state.user) : null,
    isAdmin: state.isAdmin,
    impersonatedUser: state.impersonatedUser ? serializeUser(state.impersonatedUser) : null,
  };
});

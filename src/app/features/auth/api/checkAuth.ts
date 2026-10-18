import { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, IMPERSONATE_COOKIE_NAME } from '@/app/lib/auth-shared';
import { resolveAuthState } from '@/app/lib/session';

type CheckAuthParams = {
  request: NextRequest;
};

export async function checkAuth(params: CheckAuthParams) {
  const { request } = params;
  return resolveAuthState(
    request.cookies.get(AUTH_COOKIE_NAME)?.value,
    request.cookies.get(IMPERSONATE_COOKIE_NAME)?.value
  );
}

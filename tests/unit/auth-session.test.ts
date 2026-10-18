import { describe, it, expect } from 'vitest';
import {
  createSessionToken,
  parseSessionToken,
  isSessionSignatureValid,
  SESSION_MAX_AGE_SECONDS,
  signValue,
} from '@/app/lib/auth-shared';

const HASH = '$2b$10$C4Zt4rAa6PpXHuxclT6wyucQYBtDIX2DVAKUWxCdzrAcyR6WF9ysG';
const NOW = Date.UTC(2026, 9, 18, 12, 0, 0);

describe('session token', () => {
  it('round-trips a valid token', () => {
    const token = parseSessionToken(createSessionToken(42, HASH, NOW), NOW);
    expect(token?.userId).toBe(42);
    expect(isSessionSignatureValid(token!, HASH)).toBe(true);
  });

  it('is rejected once the password hash changes', () => {
    const token = parseSessionToken(createSessionToken(42, HASH, NOW), NOW);
    expect(isSessionSignatureValid(token!, HASH.replace('C4Z', 'X4Z'))).toBe(false);
  });

  it('expires server-side after the session max age', () => {
    const raw = createSessionToken(42, HASH, NOW);
    expect(parseSessionToken(raw, NOW + (SESSION_MAX_AGE_SECONDS - 1) * 1000)).not.toBeNull();
    expect(parseSessionToken(raw, NOW + SESSION_MAX_AGE_SECONDS * 1000)).toBeNull();
  });

  it('cannot be re-targeted to another user', () => {
    const [, exp, signature] = createSessionToken(42, HASH, NOW).split('.');
    const forged = parseSessionToken(`1.${exp}.${signature}`, NOW);
    expect(isSessionSignatureValid(forged!, HASH)).toBe(false);
  });

  it('cannot have its expiry extended', () => {
    const [userId, exp, signature] = createSessionToken(42, HASH, NOW).split('.');
    const forged = parseSessionToken(`${userId}.${Number(exp) + 1000}.${signature}`, NOW);
    expect(isSessionSignatureValid(forged!, HASH)).toBe(false);
  });

  it('rejects the legacy `userId.hmac` cookie format', () => {
    expect(parseSessionToken(signValue('42'), NOW)).toBeNull();
  });

  it('rejects malformed values', () => {
    expect(parseSessionToken(undefined, NOW)).toBeNull();
    expect(parseSessionToken('', NOW)).toBeNull();
    expect(parseSessionToken('abc.123.sig', NOW)).toBeNull();
    expect(parseSessionToken('1.2.3.4', NOW)).toBeNull();
  });
});

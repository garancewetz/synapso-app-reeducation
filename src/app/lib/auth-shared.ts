import crypto, { timingSafeEqual } from 'crypto';

export const AUTH_COOKIE_NAME = 'synapso_auth';
export const IMPERSONATE_COOKIE_NAME = 'synapso_impersonate';

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 jours

function getSecret(): string {
  const secret = process.env.COOKIE_SECRET;
  if (secret) return secret;
  // 🔒 SÉCURITÉ: refuser le fallback dev dès que NODE_ENV=production OU que
  // NEXT_PUBLIC_ENVIRONMENT=production. Avant, seule la 2ᵉ var était checkée :
  // si elle n'était pas définie sur Netlify (cas réel possible), l'app
  // démarrait avec un secret hardcodé public → cookies forgeables.
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
  if (isProduction) {
    throw new Error('COOKIE_SECRET environment variable is required in production');
  }
  return 'dev-only-secret-not-for-production';
}

const SECRET = getSecret();

function hmac(value: string): string {
  return crypto.createHmac('sha256', SECRET).update(value).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

export function signValue(value: string): string {
  return `${value}.${hmac(value)}`;
}

export function verifySignedValue(signedValue: string): string | null {
  const parts = signedValue.split('.');
  if (parts.length !== 2) return null;

  const [value, signature] = parts;
  return safeEqual(signature, hmac(value)) ? value : null;
}

export function readUserIdFromCookieValue(rawValue: string | undefined): number | null {
  if (!rawValue) return null;
  const verified = verifySignedValue(rawValue);
  if (!verified) return null;
  const parsed = parseInt(verified, 10);
  return isNaN(parsed) ? null : parsed;
}

// --- Jeton de session ---
//
// Format : `${userId}.${exp}.${signature}`
// La signature couvre aussi le hash du mot de passe (jamais transmis au client) :
// changer de mot de passe invalide donc toutes les sessions existantes, et
// `exp` (secondes epoch) borne la durée de vie côté serveur, pas seulement
// côté navigateur.

type ParsedSessionToken = {
  userId: number;
  exp: number;
  signature: string;
};

function sessionSignature(userId: number, exp: number, passwordHash: string): string {
  return hmac(`session:${userId}.${exp}.${passwordHash}`);
}

export function createSessionToken(
  userId: number,
  passwordHash: string,
  now: number = Date.now()
): string {
  const exp = Math.floor(now / 1000) + SESSION_MAX_AGE_SECONDS;
  return `${userId}.${exp}.${sessionSignature(userId, exp, passwordHash)}`;
}

/**
 * Vérifie le format et l'expiration du jeton (sans base de données).
 * La signature se vérifie ensuite avec `isSessionSignatureValid` une fois le
 * hash du mot de passe de l'utilisateur récupéré.
 */
export function parseSessionToken(
  rawValue: string | undefined,
  now: number = Date.now()
): ParsedSessionToken | null {
  if (!rawValue) return null;

  const parts = rawValue.split('.');
  if (parts.length !== 3) return null;

  const [userIdPart, expPart, signature] = parts;
  if (!/^\d+$/.test(userIdPart) || !/^\d+$/.test(expPart)) return null;

  const userId = Number(userIdPart);
  const exp = Number(expPart);
  if (exp * 1000 <= now) return null;

  return { userId, exp, signature };
}

export function isSessionSignatureValid(
  token: ParsedSessionToken,
  passwordHash: string
): boolean {
  return safeEqual(token.signature, sessionSignature(token.userId, token.exp, passwordHash));
}

export const authUserSelect = {
  id: true,
  name: true,
  role: true,
  resetFrequency: true,
  dominantHand: true,
  hasJournal: true,
  createdAt: true,
} as const;

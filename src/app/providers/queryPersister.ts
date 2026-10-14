import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// localStorage key holding the dehydrated React Query cache.
export const QUERY_CACHE_KEY = 'synapso-rq-cache';

// Bump to invalidate every persisted cache after a breaking data-shape change.
export const QUERY_CACHE_BUSTER = 'v1';

// How long a persisted snapshot stays restorable.
// 7 days: covers patients who do not open the app every day (past 24h they got
// the full cold chain again). Wiped on logout (clearPersistedQueryCache).
export const PERSIST_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// gcTime for the persisted-root queries. Must be >= PERSIST_MAX_AGE_MS: a query
// garbage-collected from memory is also dropped from the next persisted snapshot,
// so a shorter gcTime would silently empty localStorage when the user leaves home.
export const PERSISTED_QUERY_GC_TIME = PERSIST_MAX_AGE_MS;

// Query roots we persist. We only keep what the home shell needs to paint
// instantly on a cold start (the entry route is static, so there is no SSR
// data anymore). Everything else stays memory-only.
const PERSISTED_QUERY_ROOTS = new Set<string>(['user', 'history', 'exercices']);

export function isPersistedQueryKey(queryKey: readonly unknown[]): boolean {
  return typeof queryKey[0] === 'string' && PERSISTED_QUERY_ROOTS.has(queryKey[0]);
}

// Sync persister backed by localStorage. On the server (SSR/prerender) there is
// no window, so the persister becomes a no-op.
export function createQueryPersister() {
  return createSyncStoragePersister({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    key: QUERY_CACHE_KEY,
  });
}

// 🔒 Wipe the persisted cache (health data) so it is never restored for another
// user on a shared device. Called on logout, alongside the SW HTML cache wipe.
export function clearPersistedQueryCache() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(QUERY_CACHE_KEY);
  } catch {
    // localStorage can throw (private mode, quota) — nothing to recover here.
  }
}

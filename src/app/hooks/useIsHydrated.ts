'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * false during SSR/prerender AND during hydration, true right after.
 *
 * useSyncExternalStore always uses the server snapshot while hydrating, so a
 * component gated on this renders exactly the server HTML at hydration time,
 * whatever client-only state (persisted cache, localStorage) is already there.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

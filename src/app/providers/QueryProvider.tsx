'use client';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import {
  createQueryPersister,
  isPersistedQueryKey,
  PERSIST_MAX_AGE_MS,
  QUERY_CACHE_BUSTER,
} from './queryPersister';

export function QueryProvider({ children }: PropsWithChildren) {
  // ⚡ PERFORMANCE: Créer le QueryClient une seule fois (singleton)
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // ⚡ CACHE: Données considérées "fraîches" pendant 30 secondes
        staleTime: 30000,
        // ⚡ CACHE: Garder les données en cache pendant 5 minutes
        gcTime: 5 * 60 * 1000, // (anciennement cacheTime)
        // ⚡ REFETCH: Ne pas refetch automatiquement au focus (évite les requêtes inutiles)
        refetchOnWindowFocus: false,
        // ⚡ REFETCH: Ne pas refetch automatiquement au reconnect (évite les requêtes inutiles)
        refetchOnReconnect: false,
        // ⚡ RETRY: Retry automatique en cas d'erreur (2 tentatives)
        retry: 2,
        // ⚡ RETRY: Délai entre les tentatives (1 seconde)
        retryDelay: 1000,
      },
      mutations: {
        // ⚡ RETRY: Ne pas retry les mutations (erreurs immédiates)
        retry: false,
      },
    },
  }));

  // ⚡ COLD START: persist the cache (user/history/exercices) to localStorage.
  // The entry route `/` is static → no SSR data anymore: without this the heatmap
  // renders empty on first paint then fills after the client fetch (the filled→empty
  // flash on stale SSR HTML still held by the SW). Restoration repaints the last
  // known heatmap instantly, then revalidates in the background.
  const [persister] = useState(() => createQueryPersister());

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        // Health data — kept 7 days max, revalidated at mount anyway.
        maxAge: PERSIST_MAX_AGE_MS,
        buster: QUERY_CACHE_BUSTER,
        dehydrateOptions: {
          // Only persist successful queries from the allowlisted roots.
          shouldDehydrateQuery: (query) =>
            query.state.status === 'success' && isPersistedQueryKey(query.queryKey),
        },
      }}
    >
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </PersistQueryClientProvider>
  );
}

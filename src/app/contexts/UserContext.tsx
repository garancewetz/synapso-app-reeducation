'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, use } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { queryKeys, fetchUser, type FetchUserResponse } from '@/app/lib/api-queries';
import { clearPersistedQueryCache, PERSISTED_QUERY_GC_TIME } from '@/app/providers/queryPersister';

type User = {
  id: number;
  name: string;
  role: 'USER' | 'ADMIN';
  resetFrequency?: 'DAILY' | 'WEEKLY';
  dominantHand?: 'LEFT' | 'RIGHT';
  hasJournal?: boolean;
  createdAt?: string;
};

type UserWithStats = User & {
  _count?: {
    exercices: number;
    progress: number;
    journalNotes: number;
  };
};

type UserContextType = {
  /** L'utilisateur connecté (toujours l'admin s'il est connecté) */
  currentUser: User | null;
  /** L'utilisateur effectif (impersonné si admin, sinon currentUser) */
  effectiveUser: User | null;
  /** Si l'utilisateur connecté est admin */
  isAdmin: boolean;
  /** Chargement en cours */
  loading: boolean;
  /** Met à jour l'utilisateur effectif (après modification de ses settings) */
  updateEffectiveUser: (updatedUser: User) => void;
  /** Déconnexion */
  logout: () => Promise<void>;
  /** Recharger les infos utilisateur */
  refreshUser: () => Promise<void>;
  /** Supprimer un compte utilisateur */
  deleteAccount: (userId: number) => Promise<void>;
  // Admin only
  /** Liste de tous les utilisateurs (admin only) */
  allUsers: UserWithStats[];
  /** Impersonner un utilisateur (admin only) */
  impersonate: (userId: number) => Promise<void>;
  /** Arrêter l'impersonation (admin only) */
  stopImpersonation: () => Promise<void>;
  /** Recharger la liste des utilisateurs (admin only) */
  refreshAllUsers: () => Promise<void>;
  /** Supprimer un compte utilisateur (admin only) */
  deleteUser: (userId: number) => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

type UserProviderProps = {
  children: ReactNode;
  /** Données auth déjà résolues (compat). Préférer authPromise pour streaming SSR. */
  initialData?: FetchUserResponse;
  /** Promise SSR non-awaitée — résolue via use() pour streamer le HTML sans attendre la DB. */
  authPromise?: Promise<FetchUserResponse>;
};

export function UserProvider({ children, initialData, authPromise }: UserProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [allUsers, setAllUsers] = useState<UserWithStats[]>([]);

  // ⚡ STREAMING SSR: use() suspend le rendu jusqu'à résolution de la promise
  // → le Suspense parent affiche AppShellSkeleton (navbar neutre), pas un loader
  // → l'utilisateur voit immédiatement la structure du shell
  const resolvedInitialData = authPromise ? use(authPromise) : initialData;

  const { data: userData, isPending: userPending, refetch: refetchUser } = useQuery({
    queryKey: queryKeys.user.current(),
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000,
    // Persisted root: keep gcTime >= persist maxAge so the snapshot survives.
    gcTime: PERSISTED_QUERY_GC_TIME,
    placeholderData: (previousData) => previousData,
    retry: false,
    initialData: resolvedInitialData,
  });

  // Extraire les données de l'utilisateur depuis la réponse
  // ⚡ FIX: Gérer le cas où userData est undefined (pendant le chargement initial)
  const currentUser = userData?.authenticated && userData?.user ? userData.user : null;
  const impersonatedUser = userData?.impersonatedUser || null;
  const isAdmin = userData?.isAdmin || false;
  // ⚡ COLD START: `isPending` (no data yet), not `isLoading` (pending AND fetching).
  // During the static prerender of `/` and while PersistQueryClientProvider restores
  // the cache, the query is pending but idle → isLoading is false, so SiteProtection
  // rendered AuthScreen: the static HTML and every launch showed the login form.
  // isPending keeps the skeleton until we actually know (cache or /api/auth/check);
  // an error (retry: false) moves it to 'error' → login screen, no infinite skeleton.
  const loading = userPending;

  // ⚡ PERFORMANCE: Mémoriser effectiveUser pour éviter les recalculs inutiles
  // L'utilisateur effectif est l'impersonné si présent, sinon le connecté
  const effectiveUser = useMemo(() => impersonatedUser || currentUser, [impersonatedUser, currentUser]);
  
  // ⚡ NETTOYAGE: Vider le cache TanStack Query quand l'utilisateur change
  // ⚡ FIX: Utiliser un ref pour éviter de vider le cache au premier rendu
  const previousUserIdRef = useRef<number | null>(null);
  
  useEffect(() => {
    const currentUserId = effectiveUser?.id ?? null;

    // Ne vider le cache que si l'utilisateur a vraiment changé (pas au premier rendu)
    if (previousUserIdRef.current !== null && previousUserIdRef.current !== currentUserId) {
      // Supprimer toutes les queries SAUF la query user pour éviter d'afficher les données
      // de l'ancien utilisateur tout en évitant un refetch user → userLoading = true → loader 2s
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== queryKeys.user.all[0],
      });

      // Déclencher le rafraîchissement de tous les hooks qui dépendent de l'utilisateur
      window.dispatchEvent(new CustomEvent('user-changed'));
    }

    previousUserIdRef.current = currentUserId;
  }, [effectiveUser?.id, queryClient]);

  // Charger la liste de tous les utilisateurs (admin only)
  const loadAllUsers = useCallback(async () => {
    if (!isAdmin) {
      setAllUsers([]);
      return;
    }

    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      } else {
        setAllUsers([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setAllUsers([]);
    }
  }, [isAdmin]);

  // Charger la liste des utilisateurs quand on devient admin
  useEffect(() => {
    if (isAdmin) {
      loadAllUsers();
    }
  }, [isAdmin, loadAllUsers]);

  // Recharger les infos utilisateur
  const refreshUser = useCallback(async () => {
    await refetchUser();
  }, [refetchUser]);

  // Recharger la liste des utilisateurs (admin only)
  const refreshAllUsers = useCallback(async () => {
    await loadAllUsers();
  }, [loadAllUsers]);

  // Mettre à jour l'utilisateur effectif (après modification de ses settings)
  const updateEffectiveUser = useCallback((updatedUser: User) => {
    // ⚡ TANSTACK QUERY: Mettre à jour le cache directement
    queryClient.setQueryData<typeof userData>(queryKeys.user.current(), (old) => {
      if (!old) return old;
      
      const newData = { ...old };
      
      if (impersonatedUser && impersonatedUser.id === updatedUser.id) {
        // On modifie l'utilisateur impersonné
        newData.impersonatedUser = updatedUser;
      } else if (currentUser && currentUser.id === updatedUser.id) {
        // On modifie notre propre compte
        newData.user = updatedUser;
      }
      
      return newData;
    });
    
    // Mettre à jour dans la liste allUsers si admin
    if (isAdmin) {
      setAllUsers(prevUsers => 
        prevUsers.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u)
      );
    }
  }, [currentUser, impersonatedUser, isAdmin, queryClient]);

  // Déconnexion
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // 🔒 Wiper le HTML caché par le service worker : avec la stratégie SWR,
      // le HTML SSR (qui contient nom user, etc.) est en cache et serait servi
      // instantanément à un autre user sur le même device.
      navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_HTML_CACHE' });

      // 🔒 Also wipe the persisted React Query cache (localStorage): it holds
      // health data (history, exercices) and would otherwise be restored for the
      // next user on the same device.
      clearPersistedQueryCache();

      // ⚡ TANSTACK QUERY: Invalider la query utilisateur
      queryClient.setQueryData(queryKeys.user.current(), {
        authenticated: false,
        user: null,
        isAdmin: false,
        impersonatedUser: null,
      });
      
      setAllUsers([]);
      
      // Recharger la page pour afficher l'écran de connexion
      router.refresh();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }, [router, queryClient]);

  // Impersonner un utilisateur (admin only)
  const impersonate = useCallback(async (userId: number) => {
    if (!isAdmin) return;

    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        // ⚡ FIX: Invalider la query pour forcer un refetch avec les nouvelles données
        // Cela garantit que toutes les données sont à jour (effectiveUser, etc.)
        await queryClient.invalidateQueries({
          queryKey: queryKeys.user.current(),
          refetchType: 'active',
        });
      } else {
        const error = await res.json().catch(() => ({ error: 'Erreur lors de l\'impersonation' }));
        throw new Error(error.error || 'Erreur lors de l\'impersonation');
      }
    } catch (error) {
      console.error('Erreur lors de l\'impersonation:', error);
      throw error; // Propager l'erreur pour affichage dans le composant
    }
  }, [isAdmin, queryClient]);

  // Arrêter l'impersonation (admin only)
  const stopImpersonation = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        // ⚡ FIX: Invalider la query pour forcer un refetch avec les nouvelles données
        // Cela garantit que toutes les données sont à jour (effectiveUser, etc.)
        await queryClient.invalidateQueries({
          queryKey: queryKeys.user.current(),
          refetchType: 'active',
        });
      } else {
        const error = await res.json().catch(() => ({ error: 'Erreur lors de l\'arrêt de l\'impersonation' }));
        throw new Error(error.error || 'Erreur lors de l\'arrêt de l\'impersonation');
      }
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de l\'impersonation:', error);
      throw error; // Propager l'erreur pour affichage dans le composant
    }
  }, [isAdmin, queryClient]);

  // Supprimer un compte utilisateur (pour supprimer son propre compte)
  const deleteAccount = useCallback(async (userId: number) => {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la suppression');
    }

    // Nettoyer le localStorage
    localStorage.removeItem('synapso_current_user');
    
    // ⚡ TANSTACK QUERY: Réinitialiser la query utilisateur
    queryClient.setQueryData(queryKeys.user.current(), {
      authenticated: false,
      user: null,
      isAdmin: false,
      impersonatedUser: null,
    });
    
    setAllUsers([]);
  }, [queryClient]);

  // Supprimer un compte utilisateur (admin only - pour supprimer n'importe quel compte)
  const deleteUser = useCallback(async (userId: number) => {
    if (!isAdmin) {
      throw new Error('Accès refusé. Droits administrateur requis.');
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }

      // Si on supprimait l'utilisateur impersonné, arrêter l'impersonation
      if (impersonatedUser && impersonatedUser.id === userId) {
        await stopImpersonation();
      }

      // Recharger la liste des utilisateurs
      await refreshAllUsers();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error; // Propager l'erreur pour affichage dans le composant
    }
  }, [isAdmin, impersonatedUser, stopImpersonation, refreshAllUsers]);

  // ⚡ PERFORMANCE: Mémoriser la valeur du context pour éviter les re-renders inutiles
  // Quand une valeur change, seuls les composants qui utilisent cette valeur se re-renderont
  const contextValue = useMemo<UserContextType>(() => ({
    currentUser,
    effectiveUser,
    isAdmin,
    loading,
    updateEffectiveUser,
    logout,
    refreshUser,
    deleteAccount,
    allUsers,
    impersonate,
    stopImpersonation,
    refreshAllUsers,
    deleteUser,
  }), [
    currentUser,
    effectiveUser,
    isAdmin,
    loading,
    updateEffectiveUser,
    logout,
    refreshUser,
    deleteAccount,
    allUsers,
    impersonate,
    stopImpersonation,
    refreshAllUsers,
    deleteUser,
  ]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

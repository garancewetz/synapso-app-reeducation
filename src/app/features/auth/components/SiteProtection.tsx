'use client';

import { memo, useCallback } from 'react';
import { AuthScreen } from './AuthScreen';
import { AppShellSkeleton } from '@/app/components/AppShellSkeleton';
import { useUser } from '@/app/contexts/UserContext';
import { useIsHydrated } from '@/app/hooks/useIsHydrated';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onAuthSuccess?: () => void;
};

export const SiteProtection = memo(function SiteProtection({ children, onAuthSuccess }: Props) {
  const { currentUser, loading: userLoading, refreshUser } = useUser();
  const isHydrated = useIsHydrated();

  const handleAuthSuccess = useCallback(async () => {
    await refreshUser();
    onAuthSuccess?.();
  }, [refreshUser, onAuthSuccess]);

  // ⚡ COLD START: userLoading reste vrai tant que l'utilisateur est inconnu
  // (prerender statique de `/`, restauration du cache persisté, premier
  // /api/auth/check) → le HTML statique et le boot affichent le skeleton,
  // jamais l'écran de connexion d'un utilisateur pourtant connecté.
  //
  // 💧 HYDRATATION : ce composant est dans une frontière <Suspense> que React
  // hydrate après le shell. Si la restauration du cache persisté a déjà abouti,
  // l'utilisateur est connu et on rendrait l'app au lieu du skeleton du HTML
  // statique → erreur #418 et React re-rend toute la racine côté client.
  // !isHydrated garantit le skeleton pendant l'hydratation ; l'app s'affiche
  // au rendu suivant, immédiatement après.
  if (!isHydrated || userLoading) {
    return <AppShellSkeleton />;
  }

  if (!currentUser) {
    return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  return <>{children}</>;
});

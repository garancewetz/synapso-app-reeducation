'use client';

import { memo, useCallback } from 'react';
import { AuthScreen } from './AuthScreen';
import { AppShellSkeleton } from '@/app/components/AppShellSkeleton';
import { useUser } from '@/app/contexts/UserContext';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onAuthSuccess?: () => void;
};

export const SiteProtection = memo(function SiteProtection({ children, onAuthSuccess }: Props) {
  const { currentUser, loading: userLoading, refreshUser } = useUser();

  const handleAuthSuccess = useCallback(async () => {
    await refreshUser();
    onAuthSuccess?.();
  }, [refreshUser, onAuthSuccess]);

  // ⚡ COLD START: userLoading reste vrai tant que l'utilisateur est inconnu
  // (prerender statique de `/`, restauration du cache persisté, premier
  // /api/auth/check) → le HTML statique et le boot affichent le skeleton,
  // jamais l'écran de connexion d'un utilisateur pourtant connecté.
  if (userLoading) {
    return <AppShellSkeleton />;
  }

  if (!currentUser) {
    return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  return <>{children}</>;
});

'use client';

import { useCallback, useMemo, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { WelcomeHeaderWrapper } from '@/app/features/home';
import { useUser } from '@/app/contexts/UserContext';
import { useExercices, useExerciceHandlers } from '@/app/features/exercices';
import { useProgressModal, useProgress } from '@/app/features/progress';
import { useJournalNotes } from '@/app/features/journal';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/lib/api-queries';
import { HomePinnedTab } from '@/app/features/home';
import { HomeExercicesView } from './HomeExercicesView';

const MotionDiv = motion.div;

const ProgressBottomSheet = dynamic(
  () => import('@/app/features/progress').then(mod => ({ default: mod.ProgressBottomSheet })),
  { ssr: false }
);

type HomeClientProps = {
  exercicesSlot?: ReactNode;
  welcomeHeaderSlot?: ReactNode;
};

export function HomeClient({ exercicesSlot, welcomeHeaderSlot }: HomeClientProps = {}) {

  const { effectiveUser, loading: userLoading } = useUser();
  const progressModal = useProgressModal();
  const queryClient = useQueryClient();

  const { exercices, updateExercice } = useExercices({ includeArchived: true });
  const { progressList } = useProgress();
  const { notes: journalNotes, refetch: refetchNotes } = useJournalNotes();
  const pinnedExercices = useMemo(() => exercices.filter(e => !e.archived && e.pinned), [exercices]);
  const pinnedProgress = useMemo(() => progressList.filter(p => p.pinned), [progressList]);
  const pinnedNotes = useMemo(() => journalNotes.filter(n => n.pinned), [journalNotes]);
  const hasPinned = pinnedExercices.length + pinnedProgress.length + pinnedNotes.length > 0;

  const { handleEditClick: handlePinnedEdit, handleCompleted: handlePinnedUpdate } = useExerciceHandlers({
    updateExercice,
    fromPath: '/',
  });




  const handleProgressSuccess = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.progress.all,
      refetchType: 'active',
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.categoryStats.all,
      refetchType: 'active',
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.exercices.all,
      refetchType: 'active',
    });
  }, [queryClient]);

  return (
    <section>
      <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto">
        {/* Welcome Header - uniquement sur la page d'accueil */}
        {welcomeHeaderSlot ?? <WelcomeHeaderWrapper />}

        {/* Contenu principal */}
        <div
          className="px-3 md:px-6 lg:px-8 pb-12 md:pb-8"
          aria-live="polite"
          aria-busy={userLoading}
          aria-atomic="true"
        >
          {!userLoading && !effectiveUser && (
            <p className="sr-only" role="status">Impossible de charger votre profil. Utilisez le bouton Réessayer.</p>
          )}
          {/* ⚡ FAST FIRST PAINT: pas de loader plein écran. Avec initialData SSR,
              le contenu rend immédiatement ; les Suspense internes (welcome/exercices)
              affichent leurs skeletons individuels si la donnée n'est pas prête. */}
          <AnimatePresence mode="wait">
            {!userLoading && !effectiveUser ? (
              <MotionDiv
                key="no-user"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 gap-3"
              >
                <div className="text-gray-500">Impossible de charger votre profil.</div>
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm text-blue-600 underline"
                >
                  Réessayer
                </button>
              </MotionDiv>
            ) : (
              <MotionDiv
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-6 md:space-y-8"
              >
                <section aria-labelledby="zones-heading">
                  <h2 id="zones-heading" className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Mes zones
                  </h2>
                  {exercicesSlot ?? <HomeExercicesView />}
                </section>

                {/* Pinned items used to hide behind a tab: shown only when there are some. */}
                {hasPinned && (
                  <section aria-labelledby="pinned-heading">
                    <h2 id="pinned-heading" className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Épinglés
                    </h2>
                    <HomePinnedTab
                      pinnedExercices={pinnedExercices}
                      pinnedProgress={pinnedProgress}
                      pinnedNotes={pinnedNotes}
                      onEdit={handlePinnedEdit}
                      onEditProgress={progressModal.openForEdit}
                      onCompleted={handlePinnedUpdate}
                      onArchive={handlePinnedUpdate}
                      onNoteUpdated={refetchNotes}
                    />
                  </section>
                )}
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal d'édition de progrès */}
      {effectiveUser && (
        <ProgressBottomSheet
          isOpen={progressModal.isOpen}
          onClose={progressModal.close}
          onSuccess={handleProgressSuccess}
          userId={effectiveUser.id}
          progressToEdit={progressModal.progressToEdit}
          initialContent={progressModal.initialContent}
          initialEmoji={progressModal.initialEmoji}
        />
      )}
    </section>
  );
}
